// @lyku/fuse — array-method chain fusion for JavaScript / TypeScript.
//
// A source-to-source transform that collapses chains of Array
// methods into a single for-loop, eliminating the intermediate
// arrays each `.map()` / `.filter()` would otherwise allocate.
// Neither V8 nor JSC fuses these chains on its own, so the win is
// real: ~5-6x on a map→filter→map→reduce over 2M elements (see
// bench.mjs), purely from killing the throwaway intermediates.
//
// It is NOT tied to any language extension — it operates on plain
// `arr.map(f).filter(g)` method chains, whoever wrote them. (Para's
// `|>` pipeline operator desugars TO these chains, so fused Para
// pipelines fall out for free, but the transform itself doesn't
// know `|>` exists.)
//
// Recognises chains of the form
//
//   PRODUCER.map(f).filter(g).map(h)            // transforms only
//   PRODUCER.map(f).filter(g).reduce(r, init)   // ending in a terminal
//
// and rewrites them to a single for-loop wrapped in an IIFE. The
// fundamental win is: one pass over the source array, no intermediate
// arrays allocated for each `.map()` / `.filter()` stage.
//
// Patterns handled
//
//   transform stages (can repeat): map, filter
//
//   terminal stages (at most one, at the end):
//     forEach, reduce, some, every, find, findIndex
//
// Anything else terminates the fusable prefix. So
//
//   xs.map(f).filter(g).sort()   →   sort() not fusable
//
// becomes
//
//   ( IIFE that does the .map + .filter as one loop ).sort()
//
// Callbacks are passed through unchanged. We don't try to substitute
// arrow parameters at the source level (text-level rewrites of
// `(x) => x.trim()` are bug-prone when `x` shadows or collides);
// modern engines inline small one-call-site arrow callbacks so the
// runtime result is equivalent to a hand-written loop.
//
// What's intentionally out of scope
//
//   - flatMap  → would need a nested sub-loop, breaks the linear model
//   - chains shorter than 2 stages → nothing to fuse
//   - non-arrow callbacks like `arr.map(parseInt)` → still passes
//     through, but the synthesized loop calls them once per iter,
//     same as native behaviour
//   - sort / reverse / concat / slice / etc. → not fusable; they
//     stop the prefix
//
// The lowering is iterative: find the first fusable chain, rewrite,
// re-scan from the rewrite's tail.

const TRANSFORM = new Set(["map", "filter"]);
const TERMINAL = new Set(["forEach", "reduce", "some", "every", "find", "findIndex"]);

const isIdentStart = c => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_" || c === "$";
const isIdentCont = c => isIdentStart(c) || (c >= "0" && c <= "9");

function skipString(src, i) {
  const q = src[i];
  i++;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === q) return i + 1;
    i++;
  }
  return i;
}

function skipTemplate(src, i) {
  i++;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === "`") return i + 1;
    if (c === "$" && src[i + 1] === "{") {
      i = skipBalanced(src, i + 1);
      continue;
    }
    i++;
  }
  return i;
}

function skipBalanced(src, i) {
  const open = src[i];
  const close = open === "(" ? ")" : open === "[" ? "]" : "}";
  let depth = 1;
  i++;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i = skipString(src, i);
      continue;
    }
    if (c === "`") {
      i = skipTemplate(src, i);
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < src.length - 1 && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    i++;
  }
  return i;
}

// Split a comma-separated argument list at top-level commas. Returns
// the argument source strings (with their original whitespace).
function splitArgs(argsSrc) {
  const out = [];
  let buf = "";
  let i = 0;
  while (i < argsSrc.length) {
    const c = argsSrc[i];
    if (c === '"' || c === "'") {
      const end = skipString(argsSrc, i);
      buf += argsSrc.slice(i, end);
      i = end;
      continue;
    }
    if (c === "`") {
      const end = skipTemplate(argsSrc, i);
      buf += argsSrc.slice(i, end);
      i = end;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") {
      const end = skipBalanced(argsSrc, i);
      buf += argsSrc.slice(i, end);
      i = end;
      continue;
    }
    if (c === ",") {
      out.push(buf);
      buf = "";
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf.length > 0 || out.length > 0) out.push(buf);
  return out.map(s => s.trim());
}

// At `src[dotPos] === '.'`, read a single `.method(args)` call.
// Returns null if this isn't a method-call form (e.g. `.length` with
// no parens).
function readMethodCall(src, dotPos) {
  let j = dotPos + 1;
  while (j < src.length && isIdentCont(src[j])) j++;
  const name = src.slice(dotPos + 1, j);
  if (name.length === 0) return null;
  let k = j;
  while (k < src.length && /\s/.test(src[k])) k++;
  if (src[k] !== "(") return null;
  const argsEnd = skipBalanced(src, k);
  const args = src.slice(k + 1, argsEnd - 1);
  return { name, args: args.trim(), end: argsEnd };
}

// Read a chain of `.method(args)` calls starting at `startPos`. The
// caller positions startPos AT the first `.` (or immediately after
// the producer expression, including any trailing whitespace).
function parseChain(src, startPos) {
  const stages = [];
  let i = startPos;
  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] !== ".") break;
    const call = readMethodCall(src, i);
    if (!call) break;
    stages.push(call);
    i = call.end;
  }
  return { stages, end: i };
}

// Of the chain's stages, take the longest prefix that's all
// TRANSFORM (with at most one TERMINAL at the very end).
function longestFusablePrefix(stages) {
  const out = [];
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (TRANSFORM.has(s.name)) {
      out.push(s);
      continue;
    }
    if (TERMINAL.has(s.name)) {
      out.push(s);
      break;
    }
    break;
  }
  return out;
}

// Walk backward from the producerEnd offset to find the start of the
// producer expression. Mirrors lower-pipeline's findLHSStart.
function findProducerStart(src, producerEnd) {
  let i = producerEnd - 1;
  let depth = 0;
  while (i >= 0 && /\s/.test(src[i])) i--;
  const stopAtTopLevel = new Set([";", ",", "?", ":"]);
  while (i >= 0) {
    const c = src[i];
    if (c === ")" || c === "]" || c === "}") {
      depth++;
      i--;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") {
      if (depth === 0) return i + 1;
      depth--;
      i--;
      continue;
    }
    if (depth > 0) {
      i--;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      i--;
      while (i >= 0) {
        if (src[i] === q && src[i - 1] !== "\\") {
          i--;
          break;
        }
        i--;
      }
      continue;
    }
    if (c === "`") {
      i--;
      while (i >= 0 && src[i] !== "`") i--;
      i--;
      continue;
    }
    if (stopAtTopLevel.has(c)) return i + 1;
    // `=>` arrow head — the producer begins AFTER the arrow, not at
    // the `>`. Without this, walking back from `txns` in
    // `() => txns.filter(...)` would stop at the `=` and leave the
    // `>` glued to the producer (`> txns`).
    if (c === ">" && src[i - 1] === "=") return i + 1;
    if (c === "=") {
      const prev = src[i - 1];
      if (prev === "=" || prev === "!" || prev === "<" || prev === ">") {
        i--;
        continue;
      }
      return i + 1;
    }
    if (isIdentCont(c)) {
      let j = i;
      while (j >= 0 && isIdentCont(src[j])) j--;
      const word = src.slice(j + 1, i + 1);
      if (
        word === "return" ||
        word === "await" ||
        word === "yield" ||
        word === "throw" ||
        word === "typeof" ||
        word === "new" ||
        word === "delete" ||
        word === "void" ||
        word === "in" ||
        word === "of" ||
        word === "instanceof"
      ) {
        return i + 1;
      }
      i = j;
      continue;
    }
    i--;
  }
  return 0;
}

// Render the per-stage body for a TRANSFORM step. The synthesised
// loop iterates with `__src` / `__x` / `__i`, so callbacks get the
// usual `(value, index, source)` triple.
function transformBody(stage) {
  if (stage.name === "map") {
    return `\n\t\t__x = (${stage.args})(__x, __i, __src);`;
  }
  if (stage.name === "filter") {
    return `\n\t\tif (!(${stage.args})(__x, __i, __src)) continue;`;
  }
  return "";
}

// Build the full IIFE that replaces the chain. `producer` is the
// source expression preceding the first `.method()` call; `stages`
// is the fusable prefix.
function synthesize(producer, stages) {
  const last = stages[stages.length - 1];
  const isTerminal = TERMINAL.has(last.name);
  const xforms = isTerminal ? stages.slice(0, -1) : stages;
  const xformsBody = xforms.map(transformBody).join("");

  if (!isTerminal) {
    return (
      `((__src) => {\n` +
      `\tconst __out = [];\n` +
      `\tfor (let __i = 0; __i < __src.length; __i++) {\n` +
      `\t\tlet __x = __src[__i];` +
      xformsBody +
      `\n\t\t__out.push(__x);\n` +
      `\t}\n` +
      `\treturn __out;\n` +
      `})(${producer})`
    );
  }

  switch (last.name) {
    case "forEach":
      return (
        `((__src) => {\n` +
        `\tfor (let __i = 0; __i < __src.length; __i++) {\n` +
        `\t\tlet __x = __src[__i];` +
        xformsBody +
        `\n\t\t(${last.args})(__x, __i, __src);\n` +
        `\t}\n` +
        `})(${producer})`
      );
    case "reduce": {
      const args = splitArgs(last.args);
      const cb = args[0] ?? "() => undefined";
      const hasInit = args.length >= 2;
      const init = hasInit ? args[1] : "undefined";
      // Native .reduce without an initial value uses the first
      // element AS the accumulator and starts at index 1. The
      // emitted loop handles both forms.
      return (
        `((__src) => {\n` +
        `\tlet __acc = ${init};\n` +
        `\tlet __start = 0;\n` +
        (hasInit ? "" : `\tif (__src.length > 0) { __acc = __src[0]; __start = 1; }\n`) +
        `\tfor (let __i = __start; __i < __src.length; __i++) {\n` +
        `\t\tlet __x = __src[__i];` +
        xformsBody +
        `\n\t\t__acc = (${cb})(__acc, __x, __i, __src);\n` +
        `\t}\n` +
        `\treturn __acc;\n` +
        `})(${producer})`
      );
    }
    case "some":
      return (
        `((__src) => {\n` +
        `\tfor (let __i = 0; __i < __src.length; __i++) {\n` +
        `\t\tlet __x = __src[__i];` +
        xformsBody +
        `\n\t\tif ((${last.args})(__x, __i, __src)) return true;\n` +
        `\t}\n` +
        `\treturn false;\n` +
        `})(${producer})`
      );
    case "every":
      return (
        `((__src) => {\n` +
        `\tfor (let __i = 0; __i < __src.length; __i++) {\n` +
        `\t\tlet __x = __src[__i];` +
        xformsBody +
        `\n\t\tif (!(${last.args})(__x, __i, __src)) return false;\n` +
        `\t}\n` +
        `\treturn true;\n` +
        `})(${producer})`
      );
    case "find":
      return (
        `((__src) => {\n` +
        `\tfor (let __i = 0; __i < __src.length; __i++) {\n` +
        `\t\tlet __x = __src[__i];` +
        xformsBody +
        `\n\t\tif ((${last.args})(__x, __i, __src)) return __x;\n` +
        `\t}\n` +
        `\treturn undefined;\n` +
        `})(${producer})`
      );
    case "findIndex":
      return (
        `((__src) => {\n` +
        `\tfor (let __i = 0; __i < __src.length; __i++) {\n` +
        `\t\tlet __x = __src[__i];` +
        xformsBody +
        `\n\t\tif ((${last.args})(__x, __i, __src)) return __i;\n` +
        `\t}\n` +
        `\treturn -1;\n` +
        `})(${producer})`
      );
  }
  return `${producer}${last.args}`;
}

// Find every fusable chain in the source, replacing each with its
// synthesised loop. Iterative: rewrite the leftmost chain, re-scan
// from after the rewrite, repeat. The replacement is a self-contained
// IIFE so it can sit in any expression position the original chain did.
export function lowerFusion(src) {
  for (let safety = 0; safety < 4096; safety++) {
    const hit = findNextFusableChain(src, 0);
    if (!hit) return src;
    src = src.slice(0, hit.start) + hit.replacement + src.slice(hit.end);
    // move on past the rewritten span on the next pass — but we
    // just restart from 0 since the scanner is cheap and the
    // IIFE doesn't contain further fusable chains in its
    // generated form.
  }
  return src;
}

function findNextFusableChain(src, from) {
  let i = from;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i = skipString(src, i);
      continue;
    }
    if (c === "`") {
      i = skipTemplate(src, i);
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < src.length - 1 && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c !== ".") {
      i++;
      continue;
    }
    // `.` candidate — must follow ), ], or an identifier char to
    // belong to a method call. Walk back past whitespace first so a
    // multi-line chain (where `.filter` sits on its own line) still
    // qualifies. Number-literal decimal points (`3.14`) get rejected
    // downstream by readMethodCall (no `(` follows the digits).
    let p = i - 1;
    while (p >= 0 && /\s/.test(src[p])) p--;
    const prev = p >= 0 ? src[p] : "";
    if (prev !== ")" && prev !== "]" && !isIdentCont(prev)) {
      i++;
      continue;
    }
    // Try to read a chain starting here.
    const chain = parseChain(src, i);
    if (chain.stages.length === 0) {
      i++;
      continue;
    }
    const fusable = longestFusablePrefix(chain.stages);
    if (fusable.length < 2) {
      i++;
      continue;
    }
    // Walk back to the producer.
    const producerStart = findProducerStart(src, i);
    if (producerStart < 0 || producerStart >= i) {
      i++;
      continue;
    }
    const producer = src.slice(producerStart, i).trim();
    if (producer.length === 0) {
      i++;
      continue;
    }
    const chainEnd = fusable[fusable.length - 1].end;
    const replacement = synthesize(producer, fusable);
    return { start: producerStart, end: chainEnd, replacement };
  }
  return null;
}

// Report every fusable chain in the source WITHOUT rewriting — for
// editors / tooltips that want to show "this chain fuses to <loop>".
// Returns `{ start, end, original, fused }` per chain, in source
// order, with non-overlapping ranges (we skip past each match).
export function findFusableChains(src) {
  const out = [];
  let from = 0;
  for (let safety = 0; safety < 4096; safety++) {
    const hit = findNextFusableChain(src, from);
    if (!hit) break;
    out.push({
      start: hit.start,
      end: hit.end,
      original: src.slice(hit.start, hit.end),
      fused: hit.replacement,
    });
    from = hit.end;
  }
  return out;
}

// Para Lang spike: inline-markup attribute values.
//
// Today in .pui you write:
//
//   <Form header={headerSnip}>…</Form>
//   {#snippet headerSnip()}<Header variant="h2">Sign in</Header>{/snippet}
//
// With this preprocess you write:
//
//   <Form header={<Header variant="h2">Sign in</Header>}>…</Form>
//
// The preprocess scans the markup for attribute values of the form
//   name={<Tag …>…</Tag>}
//   name={
//     <Tag …>
//       …
//     </Tag>
//   }
// (any multi-line, balanced markup expression), lifts each to a
// generated `{#snippet __para_attr_N()}…{/snippet}` appended at end of
// the markup, and replaces the attribute body with the snippet name.
//
// Limitations (acceptable for the spike, all hand-roll-recoverable):
//   • Generated snippets are hoisted to module scope, so an inline
//     attribute body cannot close over `{#each items as item}` locals.
//     If we hit that case we keep the original snippet form by hand.
//   • Param form `(row) => <Tag>{row.x}</Tag>` is NOT yet supported.
//     The `Table` cell callback still needs hand-written snippets if
//     it wants to render markup. Tracked for the full version.
//   • Trigger heuristic: `={…}` whose body, after whitespace, starts
//     with `<` followed by an ASCII letter. Anything else is left
//     alone — including `{x < y}` (no letter after `<`) and any
//     non-markup expression.
//
// The preprocess only touches `.pui` files. For non-.pui it is a no-op.
import type { PreprocessorGroup } from "svelte/compiler";

/**
 * Match the closing `}` for an expression that begins at index `start`
 * inside `src` (where `src[start - 1] === '{'`). Returns the index OF
 * the matching `}`, or -1 if unbalanced (in which case we abandon the
 * lift and leave the source untouched).
 *
 * Brace-aware over `{}`, `()`, `[]`; transparent across single-quoted,
 * double-quoted, and backtick template-literal strings (with nested
 * `${…}` correctly recursed); skips `//` and `/* … *\/` comments. Stays
 * inside JSX-style child markup naturally since `<` and `>` aren't
 * brace characters.
 */
function matchExprEnd(src: string, start: number): number {
  const len = src.length;

  // Skip a single- or double-quoted string. Returns the index AFTER the
  // closing quote.
  function skipString(at: number, quote: string): number {
    let i = at + 1;
    while (i < len && src[i] !== quote) {
      if (src[i] === "\\") {
        i += 2;
        continue;
      }
      i++;
    }
    return i + 1;
  }

  // Skip a backtick template literal, recursing into each `${…}` so
  // nested template literals / strings / braces don't desync the depth
  // counter. Returns the index AFTER the closing backtick.
  function skipTemplate(at: number): number {
    let i = at + 1;
    while (i < len) {
      if (src[i] === "\\") {
        i += 2;
        continue;
      }
      if (src[i] === "`") return i + 1;
      if (src[i] === "$" && src[i + 1] === "{") {
        // ${…} — scan as a balanced sub-expression, then resume the
        // template-literal walk where it left off.
        i = skipBalancedBrace(i + 2);
        continue;
      }
      i++;
    }
    return i;
  }

  // Scan from one past a `{` to the matching `}`, returning the index
  // AFTER the closing `}`. Used inside template-literal `${…}` only;
  // does not handle JSX since template-literal expressions are pure JS.
  function skipBalancedBrace(at: number): number {
    let i = at;
    let depth = 1;
    while (i < len && depth > 0) {
      const c = src[i];
      if (c === "'" || c === '"') {
        i = skipString(i, c);
        continue;
      }
      if (c === "`") {
        i = skipTemplate(i);
        continue;
      }
      if (c === "/" && src[i + 1] === "/") {
        while (i < len && src[i] !== "\n") i++;
        continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        i += 2;
        while (i < len && !(src[i] === "*" && src[i + 1] === "/")) i++;
        i += 2;
        continue;
      }
      if (c === "{") depth++;
      else if (c === "}") depth--;
      i++;
    }
    return i;
  }

  // Top-level scan: find the closing `}` that matches the `{` already
  // consumed by the caller (start = first char inside the brace). Same
  // shape as skipBalancedBrace but returns the index OF the closing
  // brace (not after), per matchExprEnd's contract.
  let i = start;
  let depth = 1;
  while (i < len) {
    const c = src[i];
    if (c === "'" || c === '"') {
      i = skipString(i, c);
      continue;
    }
    if (c === "`") {
      i = skipTemplate(i);
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < len && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < len && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === "{" || c === "(" || c === "[") {
      depth++;
      i++;
      continue;
    }
    if (c === "}" || c === ")" || c === "]") {
      depth--;
      if (depth === 0 && c === "}") return i;
      i++;
      continue;
    }
    i++;
  }
  return -1;
}

/**
 * Detect that the expression starting at `body` (already brace-trimmed,
 * leading whitespace allowed) is inline JSX-style markup: a `<` followed
 * by an ASCII letter (component or element tag). Anything else stays
 * a plain JS expression.
 */
function looksLikeJsxBody(body: string): boolean {
  let i = 0;
  while (i < body.length && /\s/.test(body[i])) i++;
  return body[i] === "<" && /[A-Za-z]/.test(body[i + 1] ?? "");
}

/**
 * Find attribute-value expressions of the form `\sNAME={<…>}` and lift
 * their bodies to generated `{#snippet}` declarations appended at the
 * end of the markup. Returns the rewritten source. Pure scanner — no
 * AST dependency on Svelte — so it composes cleanly with the existing
 * para-preprocess script handler that follows it in the chain.
 *
 * Skips `<script>` and `<style>` blocks verbatim; their contents are
 * not template markup and might legitimately contain `{…}` patterns
 * that read like attribute values to a naive scanner.
 */
function lowerInlineSnippets(source: string): string {
  const out: string[] = [];
  const lifted: string[] = [];
  let i = 0;
  let counter = 0;
  const len = source.length;

  while (i < len) {
    // Pass <script> / <style> blocks through unchanged.
    if (source.startsWith("<script", i)) {
      const close = source.indexOf("</script>", i);
      const end = close === -1 ? len : close + "</script>".length;
      out.push(source.slice(i, end));
      i = end;
      continue;
    }
    if (source.startsWith("<style", i)) {
      const close = source.indexOf("</style>", i);
      const end = close === -1 ? len : close + "</style>".length;
      out.push(source.slice(i, end));
      i = end;
      continue;
    }
    // HTML comments — pass through verbatim. Comments routinely
    // include attribute-shaped strings (`header={<Box …/>}`) as part
    // of the documented surface; lifting those would clobber the doc
    // and emit garbage Svelte. Both the JSX-style `<!-- … -->` and
    // the Svelte-template `<!-- … -->` forms use the same delimiters.
    if (source.startsWith("<!--", i)) {
      const close = source.indexOf("-->", i + 4);
      const end = close === -1 ? len : close + 3;
      out.push(source.slice(i, end));
      i = end;
      continue;
    }

    // Look for an attribute-name=`{…}` pattern. Specifically: a
    // whitespace boundary, then an identifier, then `={`. The `={`
    // is the cheap discriminator — anything else (`name="…"`,
    // `{name}`, `{name={…}}`) is left alone.
    const c = source[i];
    if (/[\s\n]/.test(c) || c === "(" || c === ",") {
      // Within a tag, an attribute boundary follows whitespace.
      // Easiest reliable trigger: `\sIDENT={`.
      const tail = source.slice(i);
      const m = /^[\s\n]+([A-Za-z_$][\w$]*)\s*=\s*\{/.exec(tail);
      if (m) {
        const nameStart = i + m[0].indexOf(m[1]);
        const braceOpen = i + m[0].length; // index after `{`
        const braceClose = matchExprEnd(source, braceOpen);
        if (braceClose !== -1) {
          const body = source.slice(braceOpen, braceClose);
          if (looksLikeJsxBody(body)) {
            // Lift. Recurse on the body so nested inline-markup
            // inside the lifted snippet is also handled.
            const recursed = lowerInlineSnippets(body);
            const id = `__para_attr_${++counter}`;
            lifted.push(`{#snippet ${id}()}${recursed}{/snippet}`);
            out.push(source.slice(i, nameStart));
            out.push(`${m[1]}={${id}}`);
            i = braceClose + 1;
            continue;
          }
        }
      }
    }

    out.push(c);
    i++;
  }

  if (lifted.length === 0) return source;
  return out.join("") + "\n\n" + lifted.join("\n");
}

export default function paraInlineSnippets(): PreprocessorGroup {
  return {
    name: "para-inline-snippets",
    markup({ content, filename }) {
      if (!filename?.endsWith(".pui")) return;
      const out = lowerInlineSnippets(content);
      if (out === content) return;
      return { code: out };
    },
  };
}

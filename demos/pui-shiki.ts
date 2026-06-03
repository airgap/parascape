// Shiki highlighter wired to the parabun TextMate grammars.
//
// Grammars copied from /raid/parabun/editors/vscode/parabun/syntaxes/
// into demos/grammars/. The .pui grammar (source.pui) embeds
// source.ts for `<script>` blocks; the parabun-ts grammar (source.pts)
// is the same TypeScript surface plus Para keywords / operators
// (`signal`, `derived`, `effect`, `pure`, `match`, `..!`, `..&`,
// `..=`, `|>`); the parabun-inject grammar injects those Para tokens
// into source.ts so a `<script lang="ts">` block in a .pui file gets
// them too.
//
// Shiki uses the `name` field of each grammar as the lookup id, but
// the bundled VS Code grammars carry display names (`"Para UI
// Component"`, `"Parabun TypeScript"`). We wrap each grammar with a
// short id (`pui`, `pts`, `ptsx`, plus the injects) before handing it
// to Shiki — the internal scope-name references (`source.ts`,
// `source.pts`, …) still resolve because those use the scope field,
// which we leave untouched.
import { createHighlighter, type Highlighter } from "shiki";

import puiGrammar from "./grammars/pui.tmLanguage.json";
import ptsGrammar from "./grammars/pts.tmLanguage.json";
import ptsxGrammar from "./grammars/ptsx.tmLanguage.json";
import puiPtsInject from "./grammars/pui-pts-inject.tmLanguage.json";
import parabunInject from "./grammars/parabun-inject.tmLanguage.json";
import { findPipelineChains } from "./lower-pipeline.js";
import { lowerLeadingDot } from "./lower-leading-dot.js";
import { lowerFusion, findFusableChains } from "./lower-fusion.js";

// Cast helpers — Shiki's `LanguageRegistration` type is wider than
// the JSON shape, so we just trust the runtime-loaded grammar.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lang = (id: string, grammar: any) => ({ ...grammar, name: id });

let highlighterPromise: Promise<Highlighter> | null = null;
let resolvedHighlighter: Highlighter | null = null;

// Dual-theme rendering. Shiki emits `color: <light-color>;
// --shiki-dark: <dark-color>` on every token; the demo viewer's
// stylesheet swaps `color: var(--shiki-dark)` when the host
// document is in dark mode (data-theme="dark"). One Shiki render
// covers both themes — no recompute on toggle.
const DUAL_THEMES = { light: "github-light", dark: "github-dark" } as const;

function init(): Promise<Highlighter> {
  if (highlighterPromise) return highlighterPromise;
  highlighterPromise = createHighlighter({
    themes: [DUAL_THEMES.light, DUAL_THEMES.dark],
    langs: [
      "typescript",
      "tsx",
      "javascript",
      "jsx",
      // Custom Para grammars. Order matters: source.pts depends on
      // source.ts; source.pui depends on source.ts + source.js;
      // the injects layer on top of source.ts.
      lang("pts", ptsGrammar),
      lang("ptsx", ptsxGrammar),
      lang("pui", puiGrammar),
      lang("pui-pts-inject", puiPtsInject),
      lang("parabun-inject", parabunInject),
    ],
  }).then(hl => {
    resolvedHighlighter = hl;
    return hl;
  });
  return highlighterPromise;
}

// Kick off init so by the time the viewer mounts the highlighter is
// usually ready and the first frame doesn't flash unhighlighted.
init().catch(e => console.error("[pui-shiki] init failed:", e));

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Annotate fusable chains in the source with a `data-fused`
// decoration carrying its single-loop form, so the DemoPane can show
// a hover tooltip. Fusion is a Para-only optimization, so this is
// gated to the `pui` pane — the React/Cloudscape side runs its method
// chains as written and gets no fusion annotation. Two sources of
// chains, both Para-only:
//
//   1. `|>` pipeline chains — found in the displayed source, where
//      they still read as `x |> .map(f) |> .filter(g)`. Desugared +
//      leading-dot-expanded + fused for the tooltip.
//   2. Direct method chains (`x.map(f).filter(g)…`) — Para fuses these
//      too, even without `|>`.
//
// Ranges are de-overlapped (a `|>` chain that's already been caught
// won't be double-annotated as a direct chain), sorted by start.
function fusionDecorations(src: string, lang: "pui" | "tsx") {
  type Deco = { start: number; end: number; fused: string };
  const decos: Deco[] = [];
  if (lang !== "pui") return [];
  // A chain's range can begin at the newline ending the previous line
  // (e.g. `derived tags =\n\t\traw |> …`), which would drag that line
  // into the decoration / box. Trim to the non-whitespace bounds so the
  // decoration starts at the first real token.
  const trim = (start: number, end: number): [number, number] => {
    while (start < end && /\s/.test(src[start])) start++;
    while (end > start && /\s/.test(src[end - 1])) end--;
    return [start, end];
  };
  try {
    // `readable: true` — the tooltip is display-only, so use legible
    // temp names (arr/out/i/x, `it` for placeholder lambdas) instead of
    // the hygienic `__`-prefixed ones the real compile path emits.
    for (const c of findPipelineChains(src)) {
      // The `.map(.trim())` placeholder form is still present at
      // this point; expand leading-dots before fusing, else the
      // fuser sees `.trim()` as a callable and emits unparseable
      // `(.trim())(it, …)`.
      const [start, end] = trim(c.start, c.end);
      decos.push({
        start,
        end,
        fused: lowerFusion(lowerLeadingDot(c.lowered, { readable: true }), { readable: true }).trim(),
      });
    }
    for (const c of findFusableChains(src, { readable: true })) {
      const [start, end] = trim(c.start, c.end);
      decos.push({ start, end, fused: c.fused.trim() });
    }
  } catch {
    // Best-effort — a malformed mid-edit source shouldn't blow up
    // the whole highlight.
    return [];
  }
  // De-overlap: sort by start, drop any range that intersects one
  // already kept.
  decos.sort((a, b) => a.start - b.start);
  const kept: Deco[] = [];
  let lastEnd = -1;
  for (const d of decos) {
    if (d.start < lastEnd) continue;
    kept.push(d);
    lastEnd = d.end;
  }
  return kept.map(d => ({
    start: d.start,
    end: d.end,
    properties: { class: "pipeline-fused", "data-fused": d.fused },
  }));
}

// Teaching POIs for the intro demo: a hotspot on the first `signal`, the
// first `derived`, and the first `bind:` — each with a one-line explanation.
// Only the first occurrence of each is marked.
const CONCEPT_COPY: Record<string, string> = {
  signal:
    "Reactive state. Reading it, in a derived or the markup, subscribes; assigning re-runs everything that read it.",
  derived: "A cached computation. It re-runs only when one of the signals it depends on changes, and you read it like a plain value.",
  bind: "Two-way binding. The input's value and the signal stay in sync: typing updates the signal, assigning the signal updates the input, with no change handler and no setter.",
};
// `signal`/`derived` are keyword tokens (word-boundary terminated). `bind` is
// the Svelte directive `bind:`, so it's matched only when followed by `:` (not
// a bare identifier named "bind").
const CONCEPT_PATTERN: Record<string, RegExp> = {
  signal: /(?:^|[^\w$.])(signal)\b/,
  derived: /(?:^|[^\w$.])(derived)\b/,
  bind: /(?:^|[^\w$.])(bind)(?=:)/,
};
function firstTokenRange(src: string, kw: string): { start: number; end: number } | null {
  const m = CONCEPT_PATTERN[kw]!.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length - kw.length;
  return { start, end: start + kw.length };
}
function conceptDecorations(src: string) {
  const out = [];
  for (const kw of ["signal", "derived", "bind"]) {
    const r = firstTokenRange(src, kw);
    if (r)
      out.push({
        start: r.start,
        end: r.end,
        properties: { class: "poi-concept", "data-poi-label": kw, "data-poi-text": CONCEPT_COPY[kw] },
      });
  }
  return out;
}

// ── Variable semantic highlight ────────────────────────────────────────────
// TextMate grammars (both the .pui grammar and Shiki's bundled `tsx`) scope
// declarations, calls and params but NOT plain identifier *references* — a real
// editor colours those from the language server's semantic tokens, which the
// in-browser demos have no room to run. This is a lightweight stand-in: collect
// the names BOUND in the snippet (signal / derived / prop / const|let|var /
// destructures / params / `{#each … as}`) and decorate every reference with
// `tok-var`, so `count` reads as a variable wherever it appears, not only at its
// declaration. Best-effort + regex-based: it may miss an exotic binding or tint
// a same-named object key, but it never throws — ranges that would overlap a
// fusion/concept decoration are dropped (Shiki forbids partial overlaps).

// Same-length copy with string interiors + line/block comments blanked, so an
// identifier inside a string or comment isn't mistaken for a reference. Quote
// and newline characters are preserved so offsets and line counts stay exact.
function maskStringsComments(src: string): string {
  const a = src.split("");
  const blank = (from: number, to: number) => {
    for (let k = from; k < to; k++) if (a[k] !== "\n") a[k] = " ";
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      let e = src.indexOf("\n", i);
      if (e === -1) e = src.length;
      blank(i, e);
      i = e;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      let e = src.indexOf("*/", i + 2);
      e = e === -1 ? src.length : e + 2;
      blank(i, e);
      i = e;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === c) {
          j++;
          break;
        }
        j++;
      }
      blank(i + 1, Math.max(i + 1, j - 1)); // keep the quotes, blank the interior
      i = j;
      continue;
    }
    i++;
  }
  return a.join("");
}

// Split a binding target on top-level commas (depth-aware over () [] {}).
function splitTopCommas(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      parts.push(s.slice(last, i));
      last = i + 1;
    }
  }
  parts.push(s.slice(last));
  return parts.map((p) => p.trim()).filter(Boolean);
}

// Identifiers bound by a target: a plain name, an object/array destructure
// (`{ a, b: c, ...rest }` binds a, c, rest; `[x, y]` binds x, y), each with its
// type annotation / default stripped.
function identsFromTarget(t: string, out: Set<string>): void {
  t = t.trim();
  if (!t) return;
  if (t[0] === "{" || t[0] === "[") {
    const inner = t.slice(1, -1);
    for (let part of splitTopCommas(inner)) {
      part = part.replace(/^\.\.\./, "").trim();
      if (!part) continue;
      if (part[0] === "{" || part[0] === "[") {
        identsFromTarget(part, out);
        continue;
      }
      // `key: target` — the bound name is the value side (which may itself
      // destructure); a lone `key` binds `key`.
      const colon = part.indexOf(":");
      if (colon !== -1) {
        identsFromTarget(part.slice(colon + 1), out);
        continue;
      }
      const nm = part.match(/^[A-Za-z_$][\w$]*/);
      if (nm) out.add(nm[0]);
    }
    return;
  }
  const nm = t.match(/^[A-Za-z_$][\w$]*/);
  if (nm) out.add(nm[0]);
}

// Collect the names bound in a masked snippet, split into variables and
// functions. Function bindings are kept separate so their references get the
// function colour (and call sites keep the grammar's function colour) while
// variables get the variable colour.
function collectBindings(masked: string): { vars: Set<string>; funcs: Set<string> } {
  const vars = new Set<string>();
  const funcs = new Set<string>();

  // `function NAME` and `const NAME = (…) =>` / `= function` → functions.
  for (const m of masked.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) funcs.add(m[1]!);
  for (const m of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|(?:\([^()]*\)|[A-Za-z_$][\w$]*)\s*(?::\s*[^=]+?)?=>)/g,
  ))
    funcs.add(m[1]!);

  // Para reactive declarations: signal / derived / prop / source / synced /
  // using / sync / `async signal`. Each binds one identifier.
  for (const m of masked.matchAll(
    /\b(?:async\s+signal|signal|derived|prop|source|synced|using|sync)\s+([A-Za-z_$][\w$]*)/g,
  ))
    vars.add(m[1]!);

  // const/let/var — simple names AND object/array destructures.
  for (const m of masked.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) vars.add(m[1]!);
  for (const m of masked.matchAll(/\b(?:const|let|var)\s+([{[][\s\S]*?[}\]])\s*=/g)) identsFromTarget(m[1]!, vars);

  // Parameters: `function name(…)`, arrow `(…) =>`, and single-ident `x =>`.
  for (const m of masked.matchAll(/\(([^()]*)\)\s*(?::\s*[^=]+?)?=>/g))
    for (const p of splitTopCommas(m[1]!)) identsFromTarget(p, vars);
  for (const m of masked.matchAll(/(?:\bfunction\b[^(]*)\(([^()]*)\)/g))
    for (const p of splitTopCommas(m[1]!)) identsFromTarget(p, vars);
  for (const m of masked.matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)\s*=>/g)) vars.add(m[2]!);

  // `{#each EXPR as NAME}` / `as NAME, INDEX` (and the keyed form's index).
  for (const m of masked.matchAll(/\bas\s+([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?/g)) {
    vars.add(m[1]!);
    if (m[2]) vars.add(m[2]);
  }

  for (const f of funcs) vars.delete(f);
  vars.delete("");
  funcs.delete("");
  return { vars, funcs };
}

const VAR_KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "of", "in",
  "new", "typeof", "instanceof", "void", "delete", "await", "async", "yield", "as",
  "true", "false", "null", "undefined", "this", "import", "from", "export", "default",
  "signal", "derived", "effect", "prop", "source", "synced", "using", "sync",
]);

// Primitive / built-in type names. TextMate scopes these correctly in normal
// annotation positions, but the `signal X: T` / `derived X: T` para forms make
// the TS grammar read `X:` as a label and `T` as a plain variable reference, so
// the type renders uncoloured. Marking the names directly restores the colour.
const PRIMITIVE_TYPES = new Set([
  "string", "number", "boolean", "bigint", "symbol", "object", "unknown", "any", "never", "void",
]);

// One token-decoration pass: variable refs (`tok-var`), function refs
// (`tok-fn`), and primitive type names (`tok-type`). Scanned over the masked
// source so strings/comments and dotted members (`.name`) are skipped; ranges
// that would overlap a reserved (fusion/concept) decoration or an already-added
// one are dropped (Shiki forbids partial overlaps).
function tokenDecorations(src: string, avoid: Array<{ start: number; end: number }>) {
  const masked = maskStringsComments(src);
  const { vars, funcs } = collectBindings(masked);
  const decos: Array<{ start: number; end: number; properties: { class: string } }> = [];
  const clashes = (s: number, e: number) =>
    avoid.some((r) => s < r.end && e > r.start) || decos.some((d) => s < d.end && e > d.start);
  const mark = (name: string, cls: string) => {
    if (VAR_KEYWORDS.has(name)) return;
    const re = new RegExp(`(?<![\\w$.])${name.replace(/[$]/g, "\\$&")}(?![\\w$])`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(masked)) !== null) {
      const start = m.index;
      const end = start + name.length;
      if (clashes(start, end)) continue;
      decos.push({ start, end, properties: { class: cls } });
    }
  };
  for (const name of vars) mark(name, "tok-var");
  for (const name of funcs) mark(name, "tok-fn");
  for (const name of PRIMITIVE_TYPES) mark(name, "tok-type");
  // Svelte's shorthand attribute `{name}` scopes its braces as an attribute
  // name (purple), so `{onsubmit}` reads as all-purple. Neutralise the braces
  // to punctuation so only the identifier inside carries colour. A no-op for
  // ordinary `{expr}` interpolation (those braces are already punctuation).
  for (const m of masked.matchAll(/\{[A-Za-z_$][\w$]*\}/g)) {
    const s = m.index!;
    const e = s + m[0].length;
    if (!clashes(s, s + 1)) decos.push({ start: s, end: s + 1, properties: { class: "tok-punc" } });
    if (!clashes(e - 1, e)) decos.push({ start: e - 1, end: e, properties: { class: "tok-punc" } });
  }
  decos.sort((a, b) => a.start - b.start);
  return decos;
}

function decorationsFor(src: string, lang: "pui" | "tsx", opts?: { concepts?: boolean }) {
  const fusion = fusionDecorations(src, lang);
  const concepts = opts?.concepts && lang === "pui" ? conceptDecorations(src) : [];
  // Token decorations must not partially overlap the fusion boxes / concept
  // marks (Shiki throws); drop any that would. Order: structural decorations
  // first, then the per-token colour decorations.
  const reserved = [...fusion, ...concepts].map((d) => ({ start: d.start, end: d.end }));
  const tokens = tokenDecorations(src, reserved);
  return [...fusion, ...concepts, ...tokens];
}

/**
 * Highlight synchronously. If the highlighter hasn't finished init,
 * returns escaped raw source so the page renders without blocking.
 */
export function highlightSync(src: string, lang: "pui" | "tsx", opts?: { concepts?: boolean }): string {
  if (!resolvedHighlighter) return `<pre class="shiki"><code>${esc(src)}</code></pre>`;
  return resolvedHighlighter.codeToHtml(src, {
    lang,
    themes: DUAL_THEMES,
    defaultColor: false,
    decorations: decorationsFor(src, lang, opts),
  });
}

/** Async highlight. `await ready` once at module init to be safe. */
export async function highlight(src: string, lang: "pui" | "tsx", opts?: { concepts?: boolean }): Promise<string> {
  const hl = await init();
  return hl.codeToHtml(src, {
    lang,
    themes: DUAL_THEMES,
    defaultColor: false,
    decorations: decorationsFor(src, lang, opts),
  });
}

export const ready: Promise<Highlighter> = init();

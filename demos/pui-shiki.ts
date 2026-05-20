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

/**
 * Highlight synchronously. If the highlighter hasn't finished init,
 * returns escaped raw source so the page renders without blocking.
 */
export function highlightSync(src: string, lang: "pui" | "tsx"): string {
  if (!resolvedHighlighter) return `<pre class="shiki"><code>${esc(src)}</code></pre>`;
  return resolvedHighlighter.codeToHtml(src, { lang, themes: DUAL_THEMES, defaultColor: false });
}

/** Async highlight. `await ready` once at module init to be safe. */
export async function highlight(src: string, lang: "pui" | "tsx"): Promise<string> {
  const hl = await init();
  return hl.codeToHtml(src, { lang, themes: DUAL_THEMES, defaultColor: false });
}

export const ready: Promise<Highlighter> = init();

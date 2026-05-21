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

// Annotate every fusable chain in the source with a `data-fused`
// decoration carrying its single-loop form, so the DemoPane can show
// a hover tooltip. Two sources of chains:
//
//   1. `|>` pipeline chains (Para only) — found in the displayed
//      source, where they still read as `x |> .map(f) |> .filter(g)`.
//      Desugared + leading-dot-expanded + fused for the tooltip.
//   2. Direct method chains (`x.map(f).filter(g)…`) — found in BOTH
//      panes. Fusion is language-agnostic, so a plain TSX chain on
//      the Cloudscape side gets the same treatment. The compile path
//      fuses both panes too, so the tooltip is honest.
//
// Ranges are de-overlapped (a `|>` chain that's already been caught
// won't be double-annotated as a direct chain), sorted by start.
function fusionDecorations(src: string, lang: "pui" | "tsx") {
  type Deco = { start: number; end: number; fused: string };
  const decos: Deco[] = [];
  try {
    if (lang === "pui") {
      for (const c of findPipelineChains(src)) {
        // The `.map(.trim())` placeholder form is still present at
        // this point; expand leading-dots before fusing, else the
        // fuser sees `.trim()` as a callable and emits unparseable
        // `(.trim())(__x, …)`.
        decos.push({
          start: c.start,
          end: c.end,
          fused: lowerFusion(lowerLeadingDot(c.lowered)).trim(),
        });
      }
    }
    for (const c of findFusableChains(src)) {
      decos.push({ start: c.start, end: c.end, fused: c.fused.trim() });
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

/**
 * Highlight synchronously. If the highlighter hasn't finished init,
 * returns escaped raw source so the page renders without blocking.
 */
export function highlightSync(src: string, lang: "pui" | "tsx"): string {
  if (!resolvedHighlighter) return `<pre class="shiki"><code>${esc(src)}</code></pre>`;
  return resolvedHighlighter.codeToHtml(src, {
    lang,
    themes: DUAL_THEMES,
    defaultColor: false,
    decorations: fusionDecorations(src, lang),
  });
}

/** Async highlight. `await ready` once at module init to be safe. */
export async function highlight(src: string, lang: "pui" | "tsx"): Promise<string> {
  const hl = await init();
  return hl.codeToHtml(src, {
    lang,
    themes: DUAL_THEMES,
    defaultColor: false,
    decorations: fusionDecorations(src, lang),
  });
}

export const ready: Promise<Highlighter> = init();

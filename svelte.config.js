import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { parabunPreprocess } from "@lyku/para-preprocess";
import paraInlineSnippets from "./demos/para-inline-snippets.ts";
import lowerMatchPreprocess from "./demos/lower-match.ts";
import lowerLeadingDotPreprocess from "./demos/lower-leading-dot.ts";

// @lyku/para-preprocess returns `dependencies: [filename]` on every
// script-tag pass. vite-plugin-svelte's preprocess plugin records the
// file as a dependant of itself, then emits a `change` for every
// dependant when the file changes — which means a single .pui save
// recursively re-emits a change for itself until the call stack
// blows. Strip self-dependencies so we don't death-spiral the dev
// server every time we touch a component.
const withoutSelfDependency = pp => ({
  name: `${pp.name ?? "parabun"}-no-self-dep`,
  markup: pp.markup,
  script: pp.script
    ? async args => {
        const r = await pp.script(args);
        if (r && Array.isArray(r.dependencies)) {
          const filtered = r.dependencies.filter(d => d && d !== args.filename);
          return { ...r, dependencies: filtered.length ? filtered : undefined };
        }
        return r;
      }
    : undefined,
  style: pp.style,
});

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
export default {
  // `.pui` (Para UI) is the authoring surface; `.svelte` still works.
  // parabunPreprocess lowers Para syntax (signal/derived/effect/|> ...)
  // to standard Svelte 5 — so this runs on STOCK svelte, no para-ui fork
  // required. para-ui stays an optional swap, not a dependency.
  //
  // paraInlineSnippets — spike for `attr={<Tag/>}` inline-markup sugar
  // (see demos/para-inline-snippets.ts). Runs FIRST: lifts inline JSX
  // to {#snippet …}{/snippet} declarations before any other pass sees
  // the markup, so the rest of the chain works on standard Svelte.
  //
  // lowerMatchPreprocess — match-to-ternary lowering. The published
  // @lyku/para-preprocess only STUBS `match` for the TS type checker
  // (matchTypeStubSpans); the actual runtime lowering lives in the
  // parabun zig binary, which doesn't run in browser / vite dev.
  // Lowered here so .pui authors can use `match` and have it become
  // working JS in any environment.
  //
  // lowerLeadingDotPreprocess — placeholder-lambda in call-arg
  // position. `.filter(.name.toLowerCase())` lowers to
  // `.filter((__x) => __x.name.toLowerCase())`. Same rationale as
  // lowerMatchPreprocess — sugar that exists in para-preprocess as a
  // type-stub but needs runtime lowering for browser / live-compile.
  extensions: [".svelte", ".pui"],
  preprocess: [
    lowerLeadingDotPreprocess(),
    lowerMatchPreprocess(),
    paraInlineSnippets(),
    withoutSelfDependency(parabunPreprocess()),
    vitePreprocess(),
  ],
  compilerOptions: {
    runes: true,
  },
};

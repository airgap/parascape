import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { parabunPreprocess } from "@lyku/para-preprocess";
import paraInlineSnippets from "./demos/para-inline-snippets.ts";
import lowerMatchPreprocess from "./demos/lower-match.ts";

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
  extensions: [".svelte", ".pui"],
  preprocess: [lowerMatchPreprocess(), paraInlineSnippets(), parabunPreprocess(), vitePreprocess()],
  compilerOptions: {
    runes: true,
  },
};

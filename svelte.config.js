import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { parabunPreprocess } from "@lyku/para-preprocess";
import paraInlineSnippets from "./demos/para-inline-snippets.ts";

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
  extensions: [".svelte", ".pui"],
  preprocess: [paraInlineSnippets(), parabunPreprocess(), vitePreprocess()],
  compilerOptions: {
    runes: true,
  },
};

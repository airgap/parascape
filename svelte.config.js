import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { parabunPreprocess } from '@lyku/para-preprocess';

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
export default {
	// `.pui` (Para UI) is the authoring surface; `.svelte` still works.
	// parabunPreprocess lowers Para syntax (signal/derived/effect/|> ...)
	// to standard Svelte 5 — so this runs on STOCK svelte, no para-ui fork
	// required. para-ui stays an optional swap, not a dependency.
	extensions: ['.svelte', '.pui'],
	preprocess: [parabunPreprocess(), vitePreprocess()],
	compilerOptions: {
		runes: true,
	},
};

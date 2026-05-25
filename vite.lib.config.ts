// Library build — precompiles the catalog'd `.pui` components to standalone
// Svelte-5 JS (one entry per component, styles injected, `svelte` external) so
// `@parascape-design/components` installs and imports like a normal component
// library (the Svelte analog of @cloudscape-design/components). Runs through the
// SAME svelte.config preprocess chain as the app, so Para syntax (match, |>,
// signal/derived/effect, …) is fully lowered in the published output — consumers
// need no preprocessor, and E bundles the plain JS via parabun.
//
//   bun run build:lib   (→ dist/<kebab>.js + chunks; d.ts/exports added by gen)
import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { catalog } from "./components/catalog.ts";

// Same kebab→Pascal alias the app uses, so intra-library
// `@parascape-design/components/<kebab>` imports resolve during the lib build.
const parascapeDesign = (): Plugin => ({
  name: "parascape-design-alias",
  enforce: "pre",
  resolveId(id) {
    const m = /^@parascape-design\/components\/([a-z][a-z0-9-]*)$/.exec(id);
    if (!m) return null;
    const pascal = m[1]
      .split("-")
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
    return resolve(__dirname, "src/lib/components", pascal + ".pui");
  },
});

const manifests = JSON.parse(readFileSync(resolve(__dirname, "components/manifests.json"), "utf8"));
const entries: Record<string, string> = {};
for (const group of catalog) {
  for (const item of group.items) {
    const name = manifests[item.id]?.name;
    if (name) entries[item.id] = resolve(__dirname, "src/lib/components", `${name}.pui`);
  }
}

export default defineConfig({
  plugins: [parascapeDesign(), svelte({ compilerOptions: { css: "injected" } })],
  resolve: { alias: { "@components": resolve(__dirname, "src/lib/components") } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: { entry: entries, formats: ["es"] },
    rollupOptions: {
      external: [/^svelte(\/|$)/],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});

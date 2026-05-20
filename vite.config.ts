import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

import { resolve } from "node:path";

export default defineConfig({
  plugins: [svelte()],
  server: { port: 5273 },
  resolve: {
    alias: {
      // Lets the side-by-side demos under demos/scenarios/*.parascape.pui
      // import .pui components with the same '@components/X.pui' shortcut
      // the conformance suite uses — keeps the demo source code we show
      // identical to what application code would actually write.
      "@components": resolve(__dirname, "src/lib/components"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        demos: resolve(__dirname, "demos/index.html"),
        box: resolve(__dirname, "tests/visual/box-fixture/box.html"),
        wide: resolve(__dirname, "tests/visual/wide-fixture/wide.html"),
        cp: resolve(__dirname, "tests/visual/cp-fixture/cp.html"),
        ann: resolve(__dirname, "tests/visual/ann-fixture/ann.html"),
        chart: resolve(__dirname, "tests/visual/chart-fixture/chart.html"),
        area: resolve(__dirname, "tests/visual/area-fixture/area.html"),
        pie: resolve(__dirname, "tests/visual/pie-fixture/pie.html"),
        popover: resolve(__dirname, "tests/visual/popover-fixture/popover.html"),
      },
    },
  },
});

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

import { resolve } from "node:path";

export default defineConfig({
  plugins: [svelte()],
  server: { port: 5273 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
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

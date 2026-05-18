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
        popover: resolve(__dirname, "tests/visual/popover-fixture/popover.html"),
      },
    },
  },
});

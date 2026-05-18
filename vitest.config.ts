import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { resolve } from "node:path";

// The svelte plugin auto-reads svelte.config.js → extensions:['.svelte',
// '.pui'] + parabunPreprocess. So .pui compiles here EXACTLY as in the
// pixel-verified app/build — same lowering, same output. That identity
// is what makes Cloudscape's own tests a valid behavioral oracle.
// vitest 3 (Vite 6) matches vite-plugin-svelte v7's Environment API.
//
// esbuild.jsx*: Cloudscape tests are .tsx authored as `render(<Comp/>)`.
// We compile that JSX to the adapter's `h()` descriptor (NOT React) so
// the codemod never hand-parses JSX. jsxInject auto-imports h/Fragment
// into every conformance file.
export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  resolve: {
    alias: {
      "@conformance": resolve(__dirname, "tests/conformance"),
      "@components": resolve(__dirname, "src/lib/components"),
      "@cloudscape": resolve(__dirname, "src/lib/cloudscape"),
    },
  },
  esbuild: {
    jsxFactory: "__pui_h",
    jsxFragment: "__pui_Fragment",
    jsxInject: `import { h as __pui_h, Fragment as __pui_Fragment } from '@conformance/adapter'`,
  },
  test: {
    // Cloudscape tests use describe/test/expect/vi as jest-style
    // globals — globals:true keeps them adaptation-free.
    globals: true,
    environment: "jsdom",
    setupFiles: ["tests/conformance/setup.ts"],
    include: ["tests/conformance/**/*.test.{ts,tsx}"],
    css: false,
  },
});

// Live in-browser compile pipelines for the editable demo panes.
//
// CLOUDSCAPE (TSX): sucrase strips types + lowers JSX → JS, then
//   `new Function` runs the result with a pre-bound `require()` map
//   that resolves every import the demos use (React + the Cloudscape
//   components touched by the six scenarios). No bundler at runtime;
//   the module map is built once at viewer init from static imports.
//
// PARASCAPE (.pui): the source is fed through `lowerInlineSnippets`
//   (the markup pass that lifts `attr={<Tag/>}` to {#snippet …}),
//   then svelte/compiler runs the standard Svelte 5 compile path
//   producing a client-side ES module. We then run THAT module
//   through sucrase (mostly a passthrough — svelte emits ES2020) and
//   eval it the same way, with a require-map containing @components/*
//   .pui components. The result is a Svelte component constructor we
//   can hand to `mount(Comp, { target })`.
//
// The whole point of the live compile is that the user can EDIT
// either pane and see the render react in place. So each compile is
// idempotent (same source → same result) and isolates errors per
// pane (a syntax error on one side doesn't break the other).
import { transform } from "sucrase";
import { compile as svelteCompile } from "svelte/compiler";
import { parabunPreprocess } from "@lyku/para-preprocess";
// `lowerInlineSnippets` lives in /raid/parabun/packages/para-preprocess
// (committed but unpublished); use the local Parascape spike's
// markup-pass with the same input/output contract until the next
// @lyku/para-preprocess release lands.
import paraInlineSnippets from "./para-inline-snippets";
import { mount, unmount, type Component as SvelteComponent } from "svelte";
import { createRoot } from "react-dom/client";
import { createElement, type ComponentType } from "react";

const inlineSnippetsPreprocess = paraInlineSnippets();
const paraScriptPreprocess = parabunPreprocess();

/**
 * Run a .pui source through the full Para preprocess chain to produce
 * vanilla Svelte 5 the bundled compiler can parse:
 *   1. paraInlineSnippets `markup`     — lifts `attr={<Tag/>}` to {#snippet}
 *   2. parabunPreprocess `script`      — signal/derived/effect → runes,
 *                                         match/prop/source/using/mount,
 *                                         |>/..!/..&/..= operators
 *   3. sucrase TS-strip on the script  — Svelte's parser doesn't read TS
 *                                         types; para-preprocess leaves
 *                                         them in browser-mode because
 *                                         it has no Bun.Transpiler here.
 *
 * Each pass is wrapped to no-op on unchanged input so the chain stays
 * idempotent on the editable hot path.
 */
function lowerPuiSource(src: string): string {
  // 1. Markup pass — lift inline JSX in attribute values.
  const afterMarkup =
    (
      inlineSnippetsPreprocess.markup?.({
        content: src,
        filename: "live.pui",
      } as never) as { code?: string } | undefined
    )?.code ?? src;

  // 2 + 3. Walk each `<script ...>…</script>` block, run the Para
  //        script handler, then sucrase to strip TypeScript types.
  return afterMarkup
    .replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/g, (_full, open: string, body: string, close: string) => {
      const langMatch = /lang=["']([^"']+)["']/.exec(open);
      const attributes = langMatch ? { lang: langMatch[1] } : {};
      // para-preprocess script handler — signal/derived/effect/etc.
      const lowered =
        (
          paraScriptPreprocess.script?.({
            content: body,
            attributes,
            filename: "live.pui",
            markup: afterMarkup,
          } as never) as { code?: string } | undefined
        )?.code ?? body;
      // Strip TS types so Svelte's parser can read it. Sucrase drops
      // imports it thinks are unused — but a Svelte script-block's
      // imports are routinely "unused" at the script level and only
      // referenced from the template, which Sucrase can't see. Extract
      // them, run the strip on the rest, then prepend the imports
      // back verbatim so Svelte's compiler keeps them in scope.
      const importLines: string[] = [];
      const nonImport = lowered.replace(/^[ \t]*import\s[^\n]*\n?/gm, m => {
        importLines.push(m);
        return "";
      });
      const stripped = transform(nonImport, {
        transforms: ["typescript"],
        production: true,
      }).code;
      // The Para handler returns lang:"ts" in attributes — once we've
      // stripped types, the script is plain JS. Drop the lang= attr
      // so Svelte doesn't try to re-process as TS.
      const reopen = open.replace(/\s*lang=["'][^"']+["']/, "");
      return `${reopen}\n${importLines.join("")}${stripped}${close}`;
    })
    .replace(
      // Svelte 5's template parser is plain-JS once lang=ts is dropped,
      // so a TS annotation like `(r: Row) => …` in an attribute body
      // (`cell: (r: Row) => r.name`) is a parse error. Strip the
      // `: Type` part from arrow-function param lists in the markup —
      // only inside `( … )` where the comma/close-paren boundary keeps
      // the regex safe. Type names can include `< >`, `[ ]`, `|`, `&`,
      // `'`, `"`, `,` inside generics, so the match is a bracket-balanced
      // scan that stops at the next top-level `,` or `)`.
      /\(([^)]*)\)/g,
      (m, inner: string) => {
        // Quick reject: no `:` in the param list, nothing to strip.
        if (!/[A-Za-z_$][\w$]*\s*:/.test(inner)) return m;
        // Split on top-level commas, strip `:Type` from each param.
        const parts: string[] = [];
        let depth = 0;
        let buf = "";
        for (const c of inner) {
          if (c === "<" || c === "[" || c === "{") depth++;
          else if (c === ">" || c === "]" || c === "}") depth--;
          if (c === "," && depth === 0) {
            parts.push(buf);
            buf = "";
            continue;
          }
          buf += c;
        }
        parts.push(buf);
        const stripped = parts
          .map(p => p.replace(/^(\s*[A-Za-z_$][\w$]*\s*)(?::\s*[^=]+?)?(\s*=|\s*$)/, "$1$2"))
          .join(",");
        return `(${stripped})`;
      },
    );
}

// ─── module registry (statically populated from the demos bundle) ──────
//
// Vite's `import.meta.glob({ eager: true })` collects every matching
// module at build time. We use it to pre-resolve every import path
// the scenarios use, so the compiled user code can find them at
// runtime without going through a module loader.

// All ported .pui components, keyed by their `@components/X.pui` path.
// (src/ globs are handled by Vite's own dev transform pipeline, so
// .pui files come back as compiled Svelte components.)
const puiComponents = import.meta.glob<{ default: SvelteComponent }>("/src/lib/components/*.pui", {
  eager: true,
});

// Cloudscape React components. We import them EXPLICITLY (not via
// `import.meta.glob('/node_modules/…')`) because the glob path serves
// the raw CJS — `prop-types` and friends would arrive as
// `module.exports = …` strings and the browser refuses to read them
// as ES modules. Explicit named imports go through Vite's optimizeDeps
// + esbuild CJS→ESM interop and resolve cleanly.
import * as React from "react";
import * as ReactJsxRuntime from "react/jsx-runtime";
import CsAppLayout from "@cloudscape-design/components/app-layout";
import CsBox from "@cloudscape-design/components/box";
import CsButton from "@cloudscape-design/components/button";
import CsCards from "@cloudscape-design/components/cards";
import CsContainer from "@cloudscape-design/components/container";
import CsContentLayout from "@cloudscape-design/components/content-layout";
import CsForm from "@cloudscape-design/components/form";
import CsFormField from "@cloudscape-design/components/form-field";
import CsHeader from "@cloudscape-design/components/header";
import CsHelpPanel from "@cloudscape-design/components/help-panel";
import CsInput from "@cloudscape-design/components/input";
import CsKeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import CsModal from "@cloudscape-design/components/modal";
import CsSideNavigation from "@cloudscape-design/components/side-navigation";
import CsSpaceBetween from "@cloudscape-design/components/space-between";
import CsStatusIndicator from "@cloudscape-design/components/status-indicator";
import CsTable from "@cloudscape-design/components/table";
import CsTabs from "@cloudscape-design/components/tabs";
import CsTextFilter from "@cloudscape-design/components/text-filter";

const cloudscapeComponents: Record<string, { default: unknown }> = {
  "@cloudscape-design/components/app-layout": { default: CsAppLayout },
  "@cloudscape-design/components/box": { default: CsBox },
  "@cloudscape-design/components/button": { default: CsButton },
  "@cloudscape-design/components/cards": { default: CsCards },
  "@cloudscape-design/components/container": { default: CsContainer },
  "@cloudscape-design/components/content-layout": { default: CsContentLayout },
  "@cloudscape-design/components/form": { default: CsForm },
  "@cloudscape-design/components/form-field": { default: CsFormField },
  "@cloudscape-design/components/header": { default: CsHeader },
  "@cloudscape-design/components/help-panel": { default: CsHelpPanel },
  "@cloudscape-design/components/input": { default: CsInput },
  "@cloudscape-design/components/key-value-pairs": { default: CsKeyValuePairs },
  "@cloudscape-design/components/modal": { default: CsModal },
  "@cloudscape-design/components/side-navigation": { default: CsSideNavigation },
  "@cloudscape-design/components/space-between": { default: CsSpaceBetween },
  "@cloudscape-design/components/status-indicator": { default: CsStatusIndicator },
  "@cloudscape-design/components/table": { default: CsTable },
  "@cloudscape-design/components/tabs": { default: CsTabs },
  "@cloudscape-design/components/text-filter": { default: CsTextFilter },
};
import * as SvelteInternalClient from "svelte/internal/client";
import * as SvelteInternalDiscloseVersion from "svelte/internal/disclose-version";
import * as SvelteInternalFlagsLegacy from "svelte/internal/flags/legacy";
import * as Svelte from "svelte";

/**
 * Build the per-pane require-map. Returns a fn that resolves an
 * import specifier (`"react"`, `"@cloudscape-design/components/button"`,
 * `"@components/Form.pui"`, `"svelte/internal/client"`) to the actual
 * module exports.
 */
function makeRequires(side: "cs" | "ps"): (id: string) => Record<string, unknown> {
  const builtins: Record<string, Record<string, unknown>> = {
    react: React as unknown as Record<string, unknown>,
    "react/jsx-runtime": ReactJsxRuntime as unknown as Record<string, unknown>,
    // Svelte 5's compiler emits `import * as $ from "svelte/internal/
    // client"` plus a side-effect `import "svelte/internal/disclose-
    // version"`. Both need to resolve so the .pui compile mounts.
    svelte: Svelte as unknown as Record<string, unknown>,
    "svelte/internal/client": SvelteInternalClient as unknown as Record<string, unknown>,
    "svelte/internal/disclose-version": SvelteInternalDiscloseVersion as unknown as Record<string, unknown>,
    "svelte/internal/flags/legacy": SvelteInternalFlagsLegacy as unknown as Record<string, unknown>,
  };
  return (id: string) => {
    if (builtins[id]) return builtins[id]!;
    // `@cloudscape-design/components/<name>` → the explicit map.
    // Editable scenarios can only import components already in the
    // map; adding a new one is a single line above.
    if (cloudscapeComponents[id]) return cloudscapeComponents[id] as Record<string, unknown>;
    if (id.startsWith("@cloudscape-design/components/")) {
      throw new Error(
        `[live-compile/${side}] Cloudscape component "${id}" isn't in the live-compile registry. Add it to demos/live-compile.ts.`,
      );
    }
    // `@components/X.pui` → the matching .pui module
    const psMatch = id.match(/^@components\/(.+)$/);
    if (psMatch) {
      const key = `/src/lib/components/${psMatch[1]}`;
      const mod = puiComponents[key];
      if (mod) return mod as unknown as Record<string, unknown>;
      throw new Error(
        `[live-compile/${side}] unresolved .pui import: ${id} (key=${key}, available=${Object.keys(puiComponents).slice(0, 3).join(", ")} …)`,
      );
    }
    throw new Error(`[live-compile/${side}] unresolved import: ${id}`);
  };
}

// Replace ES module imports with `const X = __require("…").Y` so the
// compiled JS can run inside `new Function`. Sucrase's output keeps
// imports as ES syntax (it doesn't bundle), so we have to lower them
// ourselves. Same shape for default, named, namespace, and renamed.
function lowerImports(code: string): string {
  // Sucrase sometimes packs multiple imports onto one line
  // (`import {jsx} from "react/jsx-runtime";import {useState} from "react";`).
  // Split them onto their own lines so the line-anchored regexes
  // below match each one cleanly.
  code = code.replace(/;\s*import\s+/g, ";\nimport ");

  // `import X from "Y";`
  code = code.replace(/^import\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']+)["'];?$/gm, (_, name, mod) => {
    return `const ${name} = __require(${JSON.stringify(mod)}).default;`;
  });
  // `import { a, b as c } from "Y";`
  code = code.replace(/^import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?$/gm, (_, names, mod) => {
    const out = names
      .split(",")
      .map((n: string) => n.trim())
      .filter(Boolean)
      .map((n: string) => {
        const [orig, alias] = n.split(/\s+as\s+/).map(s => s.trim());
        return `const ${alias ?? orig} = __require(${JSON.stringify(mod)}).${orig};`;
      })
      .join("\n");
    return out;
  });
  // `import X, { a, b } from "Y";`
  code = code.replace(
    /^import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([^}]+)\}\s+from\s+["']([^"']+)["'];?$/gm,
    (_, def, names, mod) => {
      const parts = [
        `const ${def} = __require(${JSON.stringify(mod)}).default;`,
        ...names
          .split(",")
          .map((n: string) => n.trim())
          .filter(Boolean)
          .map((n: string) => {
            const [orig, alias] = n.split(/\s+as\s+/).map(s => s.trim());
            return `const ${alias ?? orig} = __require(${JSON.stringify(mod)}).${orig};`;
          }),
      ];
      return parts.join("\n");
    },
  );
  // `import * as X from "Y";`
  code = code.replace(/^import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']+)["'];?$/gm, (_, name, mod) => {
    return `const ${name} = __require(${JSON.stringify(mod)});`;
  });
  // Side-effect import — drop it.
  code = code.replace(/^import\s+["'][^"']+["'];?$/gm, "");
  // `export default X;` → `__exports.default = X;`
  code = code.replace(/^export\s+default\s+/gm, "__exports.default = ");
  return code;
}

/**
 * Compile a TSX source into a React component constructor.
 */
export function compileCloudscape(src: string): ComponentType<Record<string, unknown>> {
  const { code } = transform(src, {
    transforms: ["typescript", "jsx"],
    jsxRuntime: "automatic",
    jsxImportSource: "react",
    production: true,
  });
  const lowered = lowerImports(code);
  const exports: { default?: ComponentType<Record<string, unknown>> } = {};
  const fn = new Function("__require", "__exports", `${lowered}\nreturn __exports;`);
  fn(makeRequires("cs"), exports);
  if (!exports.default) throw new Error("[live-compile/cs] no default export");
  return exports.default;
}

/**
 * Compile a .pui source into a Svelte component constructor.
 */
export function compileParascape(src: string): SvelteComponent {
  const lowered = lowerPuiSource(src);
  const result = svelteCompile(lowered, {
    generate: "client",
    dev: false,
    runes: true,
    filename: "live.pui",
  });
  const jsCode = lowerImports(result.js.code);
  const exports: { default?: SvelteComponent } = {};
  const fn = new Function("__require", "__exports", `${jsCode}\nreturn __exports;`);
  fn(makeRequires("ps"), exports);
  if (!exports.default) throw new Error("[live-compile/ps] no default export");
  return exports.default;
}

/** Mount a React component into a target div. Returns a teardown fn. */
export function mountReact(component: ComponentType<Record<string, unknown>>, target: HTMLElement): () => void {
  const root = createRoot(target);
  root.render(createElement(component, {}));
  return () => queueMicrotask(() => root.unmount());
}

/** Mount a Svelte component into a target div. Returns a teardown fn. */
export function mountSvelte(component: SvelteComponent, target: HTMLElement): () => void {
  const instance = mount(component, { target });
  return () => unmount(instance);
}

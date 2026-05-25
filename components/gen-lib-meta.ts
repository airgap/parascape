// Library packaging metadata, run after the vite lib build (dist/<kebab>.js).
// Emits per-component `.d.ts` (typed from the same $props extraction the manifest
// uses — no svelte2tsx needed) and writes the `exports` map into package.json so
// the package imports per-component like @cloudscape-design/components. Only
// catalog'd components that actually produced a dist file are exported.
//
//   bun components/gen-lib-meta.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { catalog } from "./catalog.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const MANIFESTS = path.join(import.meta.dirname, "manifests.json");
const PKG = path.join(ROOT, "package.json");

type PropInfo = { name: string; type: string; optional: boolean };
type RawManifest = { id: string; name: string; props: PropInfo[] };

const raw: Record<string, RawManifest> = JSON.parse(fs.readFileSync(MANIFESTS, "utf8"));

/** A `.d.ts` for a component, props typed from the manifest. */
function dtsFor(m: RawManifest): string {
  const body =
    m.props.length === 0
      ? "  [key: string]: unknown;"
      : m.props.map(p => `  ${p.name}${p.optional ? "?" : ""}: ${p.type};`).join("\n");
  return `import type { Component } from "svelte";

export interface ${m.name}Props {
${body}
}

declare const ${m.name}: Component<${m.name}Props>;
export default ${m.name};
`;
}

const exportsMap: Record<string, unknown> = {
  "./package.json": "./package.json",
  "./component-manifest.json": "./component-manifest.json",
};
let emitted = 0;
const skipped: string[] = [];

for (const group of catalog) {
  for (const item of group.items) {
    const m = raw[item.id];
    if (!m) continue;
    // Only export components the lib build actually produced.
    if (!fs.existsSync(path.join(DIST, `${item.id}.js`))) {
      skipped.push(item.id);
      continue;
    }
    fs.writeFileSync(path.join(DIST, `${item.id}.d.ts`), dtsFor(m));
    exportsMap[`./${item.id}`] = {
      types: `./dist/${item.id}.d.ts`,
      svelte: `./dist/${item.id}.js`,
      default: `./dist/${item.id}.js`,
    };
    emitted++;
  }
}

const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
pkg.exports = exportsMap;
fs.writeFileSync(PKG, JSON.stringify(pkg, null, 2) + "\n");

console.log(`gen-lib-meta: ${emitted} components (d.ts + exports).`);
if (skipped.length) console.warn(`  (skipped ${skipped.length} with no dist build: ${skipped.join(", ")})`);

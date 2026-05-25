// Generic component-manifest generator.
//
// Emits /component-manifest.json — a versioned, consumer-facing description of
// this library's components that ANY tool (the E designer's palette, a docs
// generator, an AI builder) can read without knowing anything Parascape-specific.
// A consumer discovers it via the package.json "componentManifest" field.
//
// It composes two existing sources:
//   • components/manifests.json — per-component props (from gen-manifests.ts)
//   • components/catalog.ts     — the curated grouping + one-line descriptions
// so the public artifact only ever lists the curated, user-insertable set.
//
//   bun components/gen-manifests.ts && bun components/gen-component-manifest.ts
//
// ── Generic v1 schema ────────────────────────────────────────────────────────
//   {
//     version: 1,
//     library: string,            // the import namespace, e.g. "@scope/components"
//     generatedAt: ISODateString,
//     groups: [{
//       name: string,
//       components: [{
//         name: string,           // binding/display name (PascalCase)
//         id: string,             // kebab id (module subpath)
//         description?: string,
//         import: { module: string; name: string; default: boolean },
//         snippet: string,        // ready-to-insert markup
//         props: PropInfo[],      // { name, type, default, optional, bindable, kind }
//       }],
//     }],
//   }
// A consumer builds the import from `import`:
//   default ? `import ${name} from '${module}'`
//           : `import { ${name} } from '${module}'`
import * as fs from "node:fs";
import * as path from "node:path";
import { catalog } from "./catalog.ts";

const LIBRARY = "@parascape-design/components";
const HERE = import.meta.dirname;
const ROOT = path.resolve(HERE, "..");
const MANIFESTS = path.join(HERE, "manifests.json");
const OUT = path.join(ROOT, "component-manifest.json");

type PropInfo = {
  name: string;
  type: string;
  default: string | null;
  optional: boolean;
  bindable: boolean;
  kind: "value" | "event" | "slot";
};
type RawManifest = { id: string; name: string; props: PropInfo[] };

if (!fs.existsSync(MANIFESTS)) {
  console.error(`Missing ${MANIFESTS}. Run \`bun components/gen-manifests.ts\` first.`);
  process.exit(1);
}
const raw: Record<string, RawManifest> = JSON.parse(fs.readFileSync(MANIFESTS, "utf8"));

// A component renders children when it exposes a `children` snippet — those want
// `<Comp></Comp>`; everything else is fine self-closed.
function snippetFor(name: string, props: PropInfo[]): string {
  const hasChildren = props.some(p => p.kind === "slot" && p.name === "children");
  return hasChildren ? `<${name}></${name}>` : `<${name} />`;
}

const groups = [];
const missing: string[] = [];
let count = 0;

for (const group of catalog) {
  const components = [];
  for (const item of group.items) {
    const m = raw[item.id];
    if (!m) {
      missing.push(item.id);
      continue;
    }
    components.push({
      name: m.name,
      id: m.id,
      description: item.blurb,
      import: { module: `${LIBRARY}/${m.id}`, name: m.name, default: true },
      snippet: snippetFor(m.name, m.props),
      props: m.props,
    });
    count++;
  }
  if (components.length) groups.push({ name: group.category, components });
}

const manifest = {
  version: 1,
  library: LIBRARY,
  generatedAt: new Date().toISOString(),
  groups,
};

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${OUT}: ${count} components in ${groups.length} groups.`);
if (missing.length) {
  console.warn(`  (skipped ${missing.length} catalog ids with no manifest: ${missing.join(", ")})`);
}

// Validates component-manifest.json against the v1 contract and checks it's in
// sync with the catalog (so a stale artifact is caught). Exits non-zero on any
// violation. Repo idiom: a directly-runnable bun script.
//
//   bun components/check-component-manifest.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { catalog } from "./catalog.ts";

const OUT = path.resolve(import.meta.dirname, "..", "component-manifest.json");
const errs: string[] = [];
const check = (cond: unknown, msg: string) => {
  if (!cond) errs.push(msg);
};

if (!fs.existsSync(OUT)) {
  console.error(`Missing ${OUT}. Run \`bun run gen:component-manifest\`.`);
  process.exit(1);
}
const m = JSON.parse(fs.readFileSync(OUT, "utf8"));

check(m.version === 1, "version must be 1");
check(typeof m.library === "string" && m.library.length > 0, "library must be a non-empty string");
check(Array.isArray(m.groups) && m.groups.length > 0, "groups must be a non-empty array");

const all = (m.groups ?? []).flatMap((g: any) => {
  check(typeof g.name === "string" && g.name, "group needs a name");
  check(Array.isArray(g.components) && g.components.length, `group "${g.name}" needs components`);
  return g.components ?? [];
});

for (const c of all) {
  const where = `component "${c.name ?? "?"}"`;
  check(/^[A-Z][A-Za-z0-9]*$/.test(c.name), `${where}: name must be PascalCase`);
  check(/^[a-z][a-z0-9-]*$/.test(c.id), `${where}: id must be kebab-case`);
  check(c.import?.module === `${m.library}/${c.id}`, `${where}: import.module mismatch`);
  check(c.import?.name === c.name, `${where}: import.name must equal name`);
  check(typeof c.import?.default === "boolean", `${where}: import.default must be boolean`);
  const hasChildren = (c.props ?? []).some((p: any) => p.kind === "slot" && p.name === "children");
  check(
    c.snippet === (hasChildren ? `<${c.name}></${c.name}>` : `<${c.name} />`),
    `${where}: snippet does not match its slot shape`,
  );
  check(Array.isArray(c.props), `${where}: props must be an array`);
  for (const p of c.props ?? [])
    check(["value", "event", "slot"].includes(p.kind), `${where}: bad prop kind "${p.kind}"`);
}

// Catalog parity: every manifest component is a real catalog entry.
const catalogIds = new Set(catalog.flatMap(g => g.items.map(i => i.id)));
for (const c of all) check(catalogIds.has(c.id), `component "${c.id}" is not in the catalog — regenerate`);

if (errs.length) {
  console.error(`component-manifest.json FAILED ${errs.length} check(s):`);
  for (const e of errs) console.error("  • " + e);
  process.exit(1);
}
console.log(`component-manifest.json OK: ${all.length} components in ${m.groups.length} groups.`);

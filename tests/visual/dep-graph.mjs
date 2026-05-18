// Inter-component dependency graph of @cloudscape-design/components.
// Edge C -> X iff C's compiled source imports sibling component X.
// Tier 0 = components with no public-component deps (the primitives to
// port/parity FIRST); tier k = 1 + max(dep tier). Cycles reported as SCCs
// (port together). Static analysis caveat: type-only/lazy/barrel imports
// may slightly over/under-count — first-order map, not gospel.
import * as fs from "node:fs";
import * as path from "node:path";

const PKG = "/raid/Parascape/node_modules/@cloudscape-design/components";
const NON_COMPONENT = new Set(["internal", "i18n", "test-utils", "contexts", "index", "error-boundary"]);
const comps = fs
  .readdirSync(PKG, { withFileTypes: true })
  .filter(d => d.isDirectory() && !NON_COMPONENT.has(d.name))
  .map(d => d.name);
const compSet = new Set(comps);

function jsFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...jsFiles(p));
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}

const importRe = /(?:from|import\()\s*["']([^"']+)["']/g;
const deps = new Map(comps.map(c => [c, new Set()]));
for (const c of comps) {
  for (const f of jsFiles(path.join(PKG, c))) {
    const src = fs.readFileSync(f, "utf8");
    let m;
    while ((m = importRe.exec(src))) {
      const spec = m[1];
      if (!spec.startsWith(".")) continue; // skip externals
      for (const seg of spec.split("/")) {
        if (compSet.has(seg) && seg !== c) deps.get(c).add(seg);
      }
    }
  }
}

// Tier via longest-path; detect cycles (nodes that never resolve).
const tier = new Map();
let changed = true,
  pass = 0;
while (changed && pass++ < 50) {
  changed = false;
  for (const c of comps) {
    const ds = [...deps.get(c)];
    if (ds.every(d => tier.has(d))) {
      const t = ds.length ? 1 + Math.max(...ds.map(d => tier.get(d))) : 0;
      if (tier.get(c) !== t) {
        tier.set(c, t);
        changed = true;
      }
    }
  }
}
const cyclic = comps.filter(c => !tier.has(c));

const byTier = {};
for (const [c, t] of tier) (byTier[t] ??= []).push(c);

console.log(`components: ${comps.length} | cyclic (SCCs, port together): ${cyclic.length}`);
for (const t of Object.keys(byTier)
  .map(Number)
  .sort((a, b) => a - b)) {
  console.log(`\nTIER ${t} (${byTier[t].length}):`);
  console.log("  " + byTier[t].sort().join(", "));
}
console.log(`\nCYCLIC (${cyclic.length}): ${cyclic.sort().join(", ")}`);

// Tier-0 fan-in: which higher components each primitive unblocks (port order).
const fanIn = Object.fromEntries((byTier[0] || []).map(c => [c, 0]));
for (const c of comps) for (const d of deps.get(c)) if (d in fanIn) fanIn[d]++;
console.log(
  "\nTIER 0 by fan-in (port these first, highest leverage):\n  " +
    Object.entries(fanIn)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `${c}(${n})`)
      .join("  "),
);
fs.writeFileSync(
  "/raid/Parascape/tests/visual/dep-graph.json",
  JSON.stringify({ tiers: byTier, cyclic, deps: Object.fromEntries([...deps].map(([k, v]) => [k, [...v]])) }, null, 1),
);

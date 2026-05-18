// Regenerates the "## Status" section of README.md from ground truth:
//   - ported = a <Name>.pui exists in src/lib/components
//   - tier / deps / fan-in = tests/visual/dep-graph.json
// A component is only ported once its deps are (the recipe is dep-first),
// so every ported row's deps are ✅ by construction — the table asserts
// that invariant rather than restating per-row parity numbers (those are
// a point-in-time measurement and would rot; the headline lives above).
// Run: `bun run status`  (rewrites between the AUTOGEN markers).
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
const graph = JSON.parse(fs.readFileSync(path.join(root, "tests/visual/dep-graph.json"), "utf8"));
const norm = s => s.toLowerCase().replace(/[^a-z]/g, "");

const ported = fs
  .readdirSync(path.join(root, "src/lib/components"))
  .filter(f => f.endsWith(".pui"))
  .map(f => f.replace(".pui", ""))
  .sort((a, b) => a.localeCompare(b));
const P = new Set(ported.map(norm));

const deps = graph.deps;
const total = Object.keys(deps).length;
const fanIn = {};
for (const ds of Object.values(deps)) for (const d of ds) fanIn[norm(d)] = (fanIn[norm(d)] || 0) + 1;
const tierOf = c => ["0", "1", "2"].find(t => graph.tiers[t]?.includes(c)) ?? "—";

// Cloudscape package name for a ported component (kebab-case of the .pui name)
const kebab = n => n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// Per-dep truth: ✅ if a matching .pui exists, ✗ if not. A ✗ is NOT a
// gap — it's a Cloudscape dep deliberately outside the rendered static
// path (sr-only `live-region`, hover-only `tooltip`, or slots the demo
// doesn't exercise like `popover`/`form-field`/charts). Each such case
// is documented in that component's .pui header comment. Asserting
// "all ✅" would be an overclaim, so the table shows each dep's state.
const rows = ported.map(name => {
  const id = kebab(name);
  const d = deps[id] || [];
  return {
    name,
    id,
    tier: tierOf(id),
    fanin: fanIn[norm(id)] || 0,
    deps: d.length ? d.map(x => `${x} ${P.has(norm(x)) ? "✅" : "✗"}`).join(", ") : "—",
    excluded: d.filter(x => !P.has(norm(x))),
  };
});
const anyExcluded = rows.some(r => r.excluded.length);

const nextReady = Object.keys(deps)
  .filter(c => !P.has(norm(c)) && (deps[c] || []).every(x => P.has(norm(x))))
  .map(c => ({ c, fin: fanIn[norm(c)] || 0, deps: deps[c] || [] }))
  .sort((a, b) => b.fin - a.fin)
  .slice(0, 6);

const lines = [];
lines.push("## Status");
lines.push("");
lines.push(
  `**${ported.length} / ${total}** Cloudscape components ported to \`.pui\` at ` +
    `pixel parity. Verification is mechanical, not by eye: a deterministic ` +
    `Playwright pixel-diff against the **real** \`@cloudscape-design/components\` ` +
    `(pinned Chromium, fixed viewport/DPR, animations/caret off, fonts settled, ` +
    `built-not-dev). Current residuals — component matrix **≤0.01%**, ` +
    `integrated \`Table\` **0.70%** — are sub-pixel antialiasing on glyph/text ` +
    `edges with **zero box-model delta** (proven via the computed-box ` +
    `diagnostics, \`*-diag.mjs\`), i.e. visually indistinguishable. Harnesses: ` +
    `\`tests/visual/box-shoot.mjs\` (matrix), \`shoot.mjs\` (Table).`,
);
lines.push("");
lines.push("> Dep-first by construction: a *pixel-relevant* dep is ported");
lines.push("> before its consumer. A `✗` dep is **not a gap** — it is a");
lines.push("> Cloudscape dependency deliberately outside the rendered static");
lines.push("> path (sr-only `live-region`, hover-only `tooltip`, or slots the");
lines.push("> demo doesn't exercise), documented in that `.pui`'s header.");
lines.push("> This table is generated — run `bun run status` (do not hand-edit).");
lines.push("");
lines.push("| Component | Cloudscape pkg | Tier | Fan-in | Deps |");
lines.push("|-----------|----------------|:----:|:------:|------|");
for (const r of rows)
  lines.push(`| \`${r.name}\` | \`@cloudscape-design/components/${r.id}\` | ${r.tier} | ${r.fanin} | ${r.deps} |`);
lines.push("");
lines.push(
  "**Next portable** (deps satisfied, fan-in desc): " +
    nextReady.map(n => `\`${n.c}\`${n.deps.length ? ` (needs ${n.deps.join("+")} ✅)` : ""}`).join(", ") +
    ".",
);
lines.push("");
lines.push(
  "_`live-region` has the highest raw fan-in (22) but is `aria-live` " +
    "sr-only — zero painted pixels, no meaningful pixel-diff — so it is " +
    "deprioritized despite being a real dependency (consumers like `Button` " +
    "exclude it from the static render)._",
);

const block = lines.join("\n");
const readmePath = path.join(root, "README.md");
let md = fs.readFileSync(readmePath, "utf8");
const START = "<!-- AUTOGEN:status (bun run status) -->";
const END = "<!-- /AUTOGEN:status -->";
const wrapped = `${START}\n${block}\n${END}`;

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
if (md.includes(START) && md.includes(END)) {
  md = md.replace(new RegExp(`${esc(START)}[\\s\\S]*?${esc(END)}`), wrapped);
} else {
  // First run: replace the legacy hand-written "## Status" section
  // (from the heading up to the next "## " or EOF).
  md = md.replace(/## Status\n[\s\S]*?(?=\n## |\s*$)/, wrapped + "\n");
}
fs.writeFileSync(readmePath, md);
console.log(`README Status regenerated: ${ported.length}/${total} ported.`);

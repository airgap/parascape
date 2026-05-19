// Phase-0 harness validation: render→extract→geomDiff→pixel against a
// real Cloudscape BarChart, self-diffed (both sides = the same chart).
// A faithful harness must report maxΔ=0 / 0 issues / 0% pixel here.
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { runChartDiff } from "./chart-geom-lib.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
const cDir = path.join(root, "tests/visual/cloudscape-ref/dist-chart");
const r = await runChartDiff({
  label: "Phase0-selfcheck",
  root,
  pDir: cDir,
  pPath: "/index.html",
  cDir,
  pPort: 5981,
  cPort: 5982,
  sel: "svg",
  outBase: "chart-phase0",
});
const ok = !r.gd.fatal && r.gd.maxDelta === 0 && r.gd.issues.length === 0 && r.mm === 0;
console.log(ok ? "\nHARNESS VALID — identical chart ⇒ 0 geom / 0 pixel" : "\nHARNESS BROKEN — self-diff nonzero");
process.exit(ok ? 0 : 1);

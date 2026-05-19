// Phase-1 end-to-end geometry gate: the assembled Parascape BarChart
// vs the real Cloudscape BarChart (byte-identical config). Numeric SVG-
// geometry diff + pixel backstop via the Phase-0-validated chart-geom
// core. Phase-1a/1b proved the math byte-faithful, so faithful
// structural assembly ⇒ matching geometry.
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { runChartDiff } from "./chart-geom-lib.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
await runChartDiff({
  label: "BarChart",
  root,
  pDir: path.join(root, "dist"),
  pPath: "/tests/visual/chart-fixture/chart.html",
  cDir: path.join(root, "tests/visual/cloudscape-ref/dist-chart"),
  pPort: 5991,
  cPort: 5992,
  sel: "svg",
  tol: 0.5,
  outBase: "chart-bar",
});

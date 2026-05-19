// Phase-1 end-to-end geometry gate: the assembled Parascape PieChart
// vs the real Cloudscape PieChart (byte-identical config). Numeric SVG-
// geometry diff + pixel backstop via the Phase-0-validated chart-geom
// core. Phase-1a/1b proved the math byte-faithful, so faithful
// structural assembly ⇒ matching geometry.
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { runChartDiff } from "./chart-geom-lib.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
await runChartDiff({
  label: "PieChart",
  root,
  pDir: path.join(root, "dist"),
  pPath: "/tests/visual/pie-fixture/pie.html",
  cDir: path.join(root, "tests/visual/cloudscape-ref/dist-pie"),
  pPort: 5985,
  cPort: 5986,
  sel: "svg",
  tol: 0.5,
  outBase: "pie",
});

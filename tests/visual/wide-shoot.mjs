// Wide-breakpoint parity diff. The 520px box matrix can only verify
// container-query components at their narrowest breakpoint; this wide
// column trips the responsive paths: Wizard desktop two-pane (≥688px),
// Cards multi-column list-grid (≥768px), the AttributeEditor wide grid
// (xs breakpoint). Same proof standard as box-shoot — whole-fixture
// pixel diff via the shared shoot-lib core.
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { runDiff } from "./shoot-lib.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
await runDiff({
  label: "Wide",
  root,
  pDir: path.join(root, "dist"),
  pPath: "/tests/visual/wide-fixture/wide.html",
  cDir: path.join(root, "tests/visual/cloudscape-ref/dist-box-wide"),
  pPort: 5413,
  cPort: 5414,
  viewport: { width: 1400, height: 900 },
  outBase: "wide",
});

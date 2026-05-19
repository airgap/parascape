// Box-primitive parity diff: Parascape .pui matrix vs the REAL
// @cloudscape-design/components matrix (identical content/props), the
// fixed 520px column. Parity is by construction (same tag + same vendored
// hashed classes + Cloudscape's own scoped.css) — expect the ~0.02% AA
// floor; residual localizes real deltas. Shared core in shoot-lib.mjs;
// wide-shoot.mjs is the wide-breakpoint sibling.
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { runDiff } from "./shoot-lib.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
await runDiff({
  label: "Box",
  root,
  pDir: path.join(root, "dist"),
  pPath: "/tests/visual/box-fixture/box.html",
  cDir: path.join(root, "tests/visual/cloudscape-ref/dist-box"),
  pPort: 5411,
  cPort: 5412,
  viewport: { width: 640, height: 900 },
  outBase: "box",
});

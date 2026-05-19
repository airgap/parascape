// Dedicated open-state pixel-diff for <CollectionPreferences>. Its
// content lives in a portaled/fixed Modal that can't be diffed inline,
// so (like popover-shoot) this clicks the trigger button on BOTH sides
// — the modal is opened the faithful way, no fixture-only prop — then
// screenshots the modal DIALOG element's own bbox (position-
// independent; runtime modal positioning is the documented-omitted
// overlay scope). Same vendored-hash + Cloudscape-own-CSS construction
// as the matrix harnesses ⇒ expect the ≤0.02% AA floor.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import * as fs from "node:fs";

const require = createRequire(import.meta.url);
const pw = "/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules";
const { chromium } = require(pw + "/playwright");
const pixelmatch =
  require(path.join(process.cwd(), "node_modules/pixelmatch")).default ??
  require(path.join(process.cwd(), "node_modules/pixelmatch"));
const { PNG } = require(path.join(process.cwd(), "node_modules/pngjs"));
const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
const outDir = path.join(root, "tests/visual/__screenshots__");
fs.mkdirSync(outDir, { recursive: true });

const serve = (dir, port) =>
  Bun.serve({
    port,
    fetch(req) {
      let p = new URL(req.url).pathname;
      if (p === "/") p = "/index.html";
      const f = path.join(dir, p);
      if (!fs.existsSync(f)) return new Response("404", { status: 404 });
      const ct = p.endsWith(".js") ? "text/javascript" : p.endsWith(".css") ? "text/css" : "text/html";
      return new Response(fs.readFileSync(f), { headers: { "content-type": ct } });
    },
  });

async function shootDialog(browser, url) {
  const page = await browser.newPage({
    viewport: { width: 900, height: 760 },
    deviceScaleFactor: 1,
  });
  await page.addInitScript(() => {
    const s = document.createElement("style");
    s.textContent = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;
    document.documentElement.appendChild(s);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.click('[class*="awsui_trigger-button"]');
  const dialog = page.locator('[class*="awsui_dialog"]').first();
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const buf = await dialog.screenshot();
  await page.close();
  return PNG.sync.read(buf);
}

const sP = serve(path.join(root, "dist"), 5941);
const sC = serve(path.join(root, "tests/visual/cloudscape-ref/dist-cp"), 5942);
let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: "chrome" });
}
const P = await shootDialog(browser, "http://localhost:5941/tests/visual/cp-fixture/cp.html");
const C = await shootDialog(browser, "http://localhost:5942/");
await browser.close();
sP.stop();
sC.stop();

fs.writeFileSync(path.join(outDir, "cp.parascape.png"), PNG.sync.write(P));
fs.writeFileSync(path.join(outDir, "cp.cloudscape.png"), PNG.sync.write(C));
const w = Math.min(P.width, C.width);
const h = Math.min(P.height, C.height);
const crop = src => {
  const o = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) src.data.copy(o.data, y * w * 4, y * src.width * 4, y * src.width * 4 + w * 4);
  return o;
};
const diff = new PNG({ width: w, height: h });
const mm = pixelmatch(crop(P).data, crop(C).data, diff.data, w, h, { threshold: 0.1 });
fs.writeFileSync(path.join(outDir, "cp.diff.png"), PNG.sync.write(diff));
console.log(`Parascape dialog : ${P.width}x${P.height}`);
console.log(`Cloudscape dialog: ${C.width}x${C.height}`);
console.log(`dialog mismatch: ${mm}px = ${((mm / (w * h)) * 100).toFixed(2)}% of ${w}x${h}`);

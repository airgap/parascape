// Dedicated open-state pixel-diff for <Popover>. Portaled,
// runtime-positioned overlays can't be diffed in the inline #matrix
// harness, so this compares the popover BODY element's OWN bounding
// box on each side (position-independent — runtime viewport
// positioning is the documented-omitted scope). Parascape renders the
// body inline+open; the real Cloudscape <Popover> is opened by
// clicking its trigger (Playwright), then both body elements are
// screenshot to their own bbox and pixelmatched.
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

async function shootBody(browser, url, { clickTrigger }) {
  const page = await browser.newPage({ viewport: { width: 640, height: 720 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    const s = document.createElement("style");
    s.textContent = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;
    document.documentElement.appendChild(s);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  if (clickTrigger) {
    await page.click('[class*="awsui_trigger"]');
  }
  const body = page.locator('[class*="awsui_body"]').first();
  await body.waitFor({ state: "visible", timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const buf = await body.screenshot();
  await page.close();
  return PNG.sync.read(buf);
}

const sP = serve(path.join(root, "dist"), 5931);
const sC = serve(path.join(root, "tests/visual/cloudscape-ref/dist-popover"), 5932);
let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: "chrome" });
}
const P = await shootBody(browser, "http://localhost:5931/tests/visual/popover-fixture/popover.html", {
  clickTrigger: false,
});
const C = await shootBody(browser, "http://localhost:5932/", { clickTrigger: true });
await browser.close();
sP.stop();
sC.stop();

fs.writeFileSync(path.join(outDir, "popover.parascape.png"), PNG.sync.write(P));
fs.writeFileSync(path.join(outDir, "popover.cloudscape.png"), PNG.sync.write(C));
const w = Math.min(P.width, C.width);
const h = Math.min(P.height, C.height);
const crop = src => {
  const o = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) src.data.copy(o.data, y * w * 4, y * src.width * 4, y * src.width * 4 + w * 4);
  return o;
};
const diff = new PNG({ width: w, height: h });
const mm = pixelmatch(crop(P).data, crop(C).data, diff.data, w, h, { threshold: 0.1 });
fs.writeFileSync(path.join(outDir, "popover.diff.png"), PNG.sync.write(diff));
console.log(`Parascape body: ${P.width}x${P.height}`);
console.log(`Cloudscape body: ${C.width}x${C.height}`);
console.log(`body mismatch: ${mm}px = ${((mm / (w * h)) * 100).toFixed(2)}% of ${w}x${h}`);

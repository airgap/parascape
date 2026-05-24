// Shared parity-diff core for the visual harnesses. box-shoot.mjs (520px
// column) and wide-shoot.mjs (wide column — exercises container-query
// breakpoints: Wizard desktop ≥688, Cards multi-column ≥768, the
// AttributeEditor wide grid) both call runDiff() with their own config so
// the proof standard (whole-fixture pixel diff) is identical at both widths.
import { createRequire } from "node:module";
import * as path from "node:path";
import * as fs from "node:fs";

const require = createRequire(import.meta.url);
const pw = "/raid/Parascape/node_modules";
const { chromium } = require(pw + "/playwright");
const pixelmatch =
  require(path.join(process.cwd(), "node_modules/pixelmatch")).default ??
  require(path.join(process.cwd(), "node_modules/pixelmatch"));
const { PNG } = require(path.join(process.cwd(), "node_modules/pngjs"));

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

async function shoot(browser, url, out, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    const s = document.createElement("style");
    s.textContent = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;
    document.documentElement.appendChild(s);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("#matrix");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  await page.locator("#matrix").screenshot({ path: out });
  await page.close();
}

/**
 * @param {object} o
 * @param {string} o.label        e.g. "Box" / "Wide"
 * @param {string} o.root         repo root
 * @param {string} o.pDir         Parascape served dir (the vite `dist`)
 * @param {string} o.pPath        path under pDir to the fixture html
 * @param {string} o.cDir         Cloudscape ref served dir
 * @param {number} o.pPort        Parascape server port
 * @param {number} o.cPort        Cloudscape server port
 * @param {{width:number,height:number}} o.viewport
 * @param {string} o.outBase      screenshot/diff filename base
 */
export async function runDiff(o) {
  const outDir = path.join(o.root, "tests/visual/__screenshots__");
  fs.mkdirSync(outDir, { recursive: true });
  const sP = serve(o.pDir, o.pPort);
  const sC = serve(o.cDir, o.cPort);
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    browser = await chromium.launch({ channel: "chrome" });
  }
  const pImg = path.join(outDir, `${o.outBase}.parascape.png`);
  const cImg = path.join(outDir, `${o.outBase}.cloudscape.png`);
  await shoot(browser, `http://localhost:${o.pPort}${o.pPath}`, pImg, o.viewport);
  await shoot(browser, `http://localhost:${o.cPort}/`, cImg, o.viewport);
  await browser.close();
  sP.stop();
  sC.stop();

  const a = PNG.sync.read(fs.readFileSync(pImg));
  const b = PNG.sync.read(fs.readFileSync(cImg));
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const crop = src => {
    const c = new PNG({ width: w, height: h });
    for (let y = 0; y < h; y++) src.data.copy(c.data, y * w * 4, y * src.width * 4, y * src.width * 4 + w * 4);
    return c;
  };
  const diff = new PNG({ width: w, height: h });
  const mm = pixelmatch(crop(a).data, crop(b).data, diff.data, w, h, { threshold: 0.1 });
  fs.writeFileSync(path.join(outDir, `${o.outBase}.diff.png`), PNG.sync.write(diff));
  console.log(`Parascape ${o.label} : ${a.width}x${a.height}`);
  console.log(`Cloudscape ${o.label}: ${b.width}x${b.height}`);
  console.log(`mismatch: ${mm}px = ${((mm / (w * h)) * 100).toFixed(2)}% of ${w}x${h}`);
  return { mm, w, h, pw: a.width, ph: a.height, cw: b.width, ch: b.height };
}

// Deterministic pixel-diff harness: Parascape (.pui → Svelte) vs the
// REAL @cloudscape-design/components <Table> (unmodified dependency).
//
// Pinned hard for stable pixels: fixed viewport+DPR, animations/caret
// off, fonts settled, built (not dev) output. Produces both goldens +
// a diff image + a mismatch ratio.
//
// HONEST framing: this measures port fidelity over time. It will NOT be
// ~0% today — Parascape's components reference approximated token names
// while real Cloudscape uses its own (hashed) token system, so the diff
// is large by construction until the components are ported to consume
// Cloudscape's actual tokens. The number is the porting scoreboard.
//
// Run (after both dists are built): bun tests/visual/shoot.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import * as fs from "node:fs";

const require = createRequire(import.meta.url);
const pwBase = "/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules";
const { chromium } = require(pwBase + "/playwright");
const pixelmatch =
  require(path.join(process.cwd(), "node_modules/pixelmatch")).default ??
  require(path.join(process.cwd(), "node_modules/pixelmatch"));
const { PNG } = require(path.join(process.cwd(), "node_modules/pngjs"));

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
const outDir = path.join(root, "tests/visual/__screenshots__");
fs.mkdirSync(outDir, { recursive: true });

function serve(dir, port) {
  return Bun.serve({
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
}

async function shoot(browser, url, selector, outName) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    const s = document.createElement("style");
    s.textContent = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;
    document.documentElement.appendChild(s);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const out = path.join(outDir, outName);
  await page.locator(selector).first().screenshot({ path: out });
  await page.close();
  return out;
}

const parascapeDist = path.join(root, "dist");
const refDist = path.join(root, "tests/visual/cloudscape-ref/dist");
for (const [d, label] of [
  [parascapeDist, "Parascape"],
  [refDist, "Cloudscape ref"],
]) {
  if (!fs.existsSync(path.join(d, "index.html"))) {
    console.error(`${label} dist missing (${d}) — build it first`);
    process.exit(2);
  }
}

const sP = serve(parascapeDist, 5401);
const sC = serve(refDist, 5402);
let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  console.warn(`pinned Chromium unavailable (${e.message.split("\n")[0]}); system Chrome`);
  browser = await chromium.launch({ channel: "chrome" });
}

const pImg = await shoot(browser, "http://localhost:5401/", '[class*="awsui_root"]', "table.parascape.png");
// Cloudscape Table's outer container — class is hashed (awsui_root_*).
const cImg = await shoot(browser, "http://localhost:5402/", '[class*="awsui_root"]', "table.cloudscape.png");
await browser.close();
sP.stop();
sC.stop();

// Pixel diff (normalize to the smaller common box; cross-impl sizes differ).
const a = PNG.sync.read(fs.readFileSync(pImg));
const b = PNG.sync.read(fs.readFileSync(cImg));
const w = Math.min(a.width, b.width);
const h = Math.min(a.height, b.height);
const crop = src => {
  const o = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) src.data.copy(o.data, y * w * 4, y * src.width * 4 + 0, y * src.width * 4 + w * 4);
  return o;
};
const A = crop(a);
const B = crop(b);
const diff = new PNG({ width: w, height: h });
const mismatched = pixelmatch(A.data, B.data, diff.data, w, h, { threshold: 0.1 });
const diffOut = path.join(outDir, "table.diff.png");
fs.writeFileSync(diffOut, PNG.sync.write(diff));
const ratio = ((mismatched / (w * h)) * 100).toFixed(2);

console.log(`Parascape : ${pImg} (${a.width}x${a.height})`);
console.log(`Cloudscape: ${cImg} (${b.width}x${b.height})`);
console.log(`diff image: ${diffOut} (compared ${w}x${h})`);
console.log(`mismatch  : ${mismatched} px = ${ratio}% of compared region`);
console.log(
  `\nHarness OK. ${ratio}% is the port-fidelity scoreboard — expected high now (token systems differ), shrinks as components adopt real Cloudscape tokens.`,
);
process.exit(0);

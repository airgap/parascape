// Computed box-model diagnostic for the Link-band residual
// (matrix diff localized to a single ~40px slice at y=2320). Same
// technique as input-diag/table-diag: compare corresponding Link
// elements Parascape vs real Cloudscape, print only the DIFFS.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import * as fs from "node:fs";

const require = createRequire(import.meta.url);
const pw = "/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules";
const { chromium } = require(pw + "/playwright");
const root = path.resolve(fileURLToPath(import.meta.url), "../../..");

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

const PROPS = [
  "boxSizing",
  "display",
  "width",
  "height",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "borderBottomWidth",
  "borderBottomColor",
  "borderBottomStyle",
  "color",
  "fontSize",
  "fontFamily",
  "lineHeight",
  "fontWeight",
  "textDecorationLine",
  "textDecorationColor",
  "textDecorationThickness",
  "textUnderlineOffset",
  "letterSpacing",
  "outlineWidth",
  "cursor",
];
// nth-of-type within the matrix; vendored hashes identical both sides.
const TARGETS = {
  "link-anchor(1)": 'a[class*="awsui_link"][href]',
  "link-button": 'a[class*="awsui_link"][role="button"]',
  "link-primary": 'a[class*="awsui_variant-primary"]',
  "link-info": 'a[class*="awsui_variant-info"]',
  "link-external-wrap": '[class*="awsui_icon-wrapper"]',
  "link-fs-heading-m": 'a[class*="awsui_font-size-heading-m"]',
};

async function probe(browser, url) {
  const page = await browser.newPage({ viewport: { width: 640, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("#matrix");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  return page.evaluate(
    ({ props, targets }) => {
      const out = {};
      for (const [label, sel] of Object.entries(targets)) {
        let el;
        try {
          el = document.querySelector(sel);
        } catch {
          el = null;
        }
        if (!el) {
          out[label] = { __missing: true };
          continue;
        }
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const o = { __w: r.width.toFixed(2), __h: r.height.toFixed(2) };
        for (const p of props) o[p] = cs[p];
        out[label] = o;
      }
      return out;
    },
    { props: PROPS, targets: TARGETS },
  );
}

const sP = serve(path.join(root, "dist"), 5485);
const sC = serve(path.join(root, "tests/visual/cloudscape-ref/dist-box"), 5486);
let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: "chrome" });
}
const P = await probe(browser, "http://localhost:5485/tests/visual/box-fixture/box.html");
const C = await probe(browser, "http://localhost:5486/");
await browser.close();
sP.stop();
sC.stop();

for (const label of Object.keys(TARGETS)) {
  const p = P[label],
    c = C[label];
  if (p?.__missing || c?.__missing) {
    console.log(`\n[${label}]  MISSING  P=${!!p?.__missing} C=${!!c?.__missing}`);
    continue;
  }
  const diffs = Object.keys(p).filter(k => p[k] !== c[k]);
  if (diffs.length === 0) {
    console.log(`\n[${label}]  identical`);
    continue;
  }
  console.log(`\n[${label}]  DIFFS:`);
  for (const k of diffs) console.log(`  ${k}:  ${JSON.stringify(p[k])}  vs  ${JSON.stringify(c[k])}`);
}

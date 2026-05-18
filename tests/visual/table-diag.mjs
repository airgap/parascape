// Stage-5 computed box-model diagnostic for the Table 0.87% residual
// (uniform horizontal text offset). Same proven technique as hr-diag.
// Compares the box model of corresponding Table elements Parascape vs
// real Cloudscape and prints only the DIFFS.
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
  "paddingInlineStart",
  "paddingInlineEnd",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopWidth",
  "borderBottomWidth",
  "borderSpacing",
  "borderCollapse",
  "tableLayout",
  "fontSize",
  "fontFamily",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "fontWeight",
];
// element label -> selector (vendored classes are identical hashes both sides)
const TARGETS = {
  table: "table",
  wrapper: '[class*="awsui_wrapper"]',
  "header-cell(2)": "thead th:nth-child(2)",
  "header-cell-content": 'thead th:nth-child(2) [class*="header-cell-content"]',
  "body-cell(2,1)": "tbody tr:first-child td:nth-child(2)",
  "body-cell-content": 'tbody tr:first-child td:nth-child(2) [class*="body-cell-content"]',
  "selection-td": "tbody tr:first-child td:first-child",
};

async function probe(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("tbody tr", { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  return page.evaluate(
    ({ props, targets }) => {
      const out = {};
      for (const [label, sel] of Object.entries(targets)) {
        const el = document.querySelector(sel);
        if (!el) {
          out[label] = { __missing: true };
          continue;
        }
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const o = { __x: r.x.toFixed(2), __w: r.width.toFixed(2) };
        for (const p of props) o[p] = cs[p];
        out[label] = o;
      }
      return out;
    },
    { props: PROPS, targets: TARGETS },
  );
}

const sP = serve(path.join(root, "dist"), 5491);
const sC = serve(path.join(root, "tests/visual/cloudscape-ref/dist"), 5492);
let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: "chrome" });
}
const P = await probe(browser, "http://localhost:5491/");
const C = await probe(browser, "http://localhost:5492/");
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

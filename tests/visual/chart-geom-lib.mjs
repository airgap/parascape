// Chart verification core. Structural class-mapping (the 60 prior
// ports' recipe) does NOT apply to charts: the chart body is computed
// SVG geometry (path d=, rect/line coords, g transforms, text x/y) from
// the vendored d3-scale/d3-shape math, not class-driven CSS. So this
// harness diffs the SVG GEOMETRY numerically (every element's geom
// attrs, tolerance-compared) and keeps a pixel-diff of the <svg> bbox
// as backstop. Phase-0 proved the vendored d3-scale is byte-faithful,
// so a faithful structural port ⇒ identical numbers ⇒ ~0 geom delta.
import { createRequire } from "node:module";
import * as path from "node:path";
import * as fs from "node:fs";

const require = createRequire(import.meta.url);
const pw = "/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules";
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

// Pull every geometry-bearing attribute off every element under the
// chart <svg>, in document order. Numbers are parsed out of compound
// attrs (d, transform, points) so they can be tolerance-compared.
const EXTRACT = () => {
  const svg = document.querySelector("#stage svg, #matrix svg, svg");
  if (!svg) return { __nosvg: true };
  const ATTRS = [
    "d",
    "x",
    "y",
    "width",
    "height",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "x1",
    "y1",
    "x2",
    "y2",
    "points",
    "transform",
    "transform-origin",
    "offset",
    "stop-color",
    "stop-opacity",
  ];
  const out = [];
  const walk = el => {
    const rec = { t: el.tagName.toLowerCase() };
    for (const a of ATTRS) if (el.hasAttribute(a)) rec[a] = el.getAttribute(a);
    if (el.tagName.toLowerCase() === "text") rec.txt = el.textContent.trim();
    out.push(rec);
    for (const c of el.children) walk(c);
  };
  walk(svg);
  const r = svg.getBoundingClientRect();
  return { box: { w: Math.round(r.width), h: Math.round(r.height) }, els: out };
};

const nums = s => (s == null ? [] : (String(s).match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number));

function geomDiff(P, C, tol = 0.5) {
  if (P.__nosvg || C.__nosvg) return { fatal: "no <svg> on " + (P.__nosvg ? "Parascape" : "Cloudscape") };
  const issues = [];
  let maxDelta = 0;
  const n = Math.max(P.els.length, C.els.length);
  if (P.els.length !== C.els.length) issues.push(`element count: P=${P.els.length} C=${C.els.length}`);
  for (let i = 0; i < n; i++) {
    const a = P.els[i] || {};
    const b = C.els[i] || {};
    if (a.t !== b.t) {
      issues.push(`#${i} tag P=${a.t} C=${b.t}`);
      continue;
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (k === "t") continue;
      if (k === "txt" || k === "stop-color") {
        if (a[k] !== b[k]) issues.push(`#${i} ${a.t}.${k} P=${JSON.stringify(a[k])} C=${JSON.stringify(b[k])}`);
        continue;
      }
      const na = nums(a[k]);
      const nb = nums(b[k]);
      if (na.length !== nb.length) {
        issues.push(`#${i} ${a.t}.${k} shape P=${a[k]} C=${b[k]}`);
        continue;
      }
      for (let j = 0; j < na.length; j++) {
        const d = Math.abs(na[j] - nb[j]);
        if (d > maxDelta) maxDelta = d;
        if (d > tol) issues.push(`#${i} ${a.t}.${k}[${j}] Δ=${d.toFixed(3)} P=${na[j]} C=${nb[j]}`);
      }
    }
  }
  return { maxDelta, issues };
}

async function shoot(browser, url, sel) {
  const page = await browser.newPage({ viewport: { width: 900, height: 760 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    const s = document.createElement("style");
    s.textContent = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;
    document.documentElement.appendChild(s);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("svg", { timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const geom = await page.evaluate(EXTRACT);
  const loc = page.locator(sel).first();
  const png = PNG.sync.read(await loc.screenshot());
  await page.close();
  return { geom, png };
}

export async function runChartDiff(o) {
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
  const sel = o.sel || "svg";
  const P = await shoot(browser, `http://localhost:${o.pPort}${o.pPath}`, sel);
  const C = await shoot(browser, `http://localhost:${o.cPort}/`, sel);
  await browser.close();
  sP.stop();
  sC.stop();

  const gd = geomDiff(P.geom, C.geom, o.tol ?? 0.5);
  const a = P.png;
  const b = C.png;
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
  fs.writeFileSync(path.join(outDir, `${o.outBase}.parascape.png`), PNG.sync.write(a));
  fs.writeFileSync(path.join(outDir, `${o.outBase}.cloudscape.png`), PNG.sync.write(b));

  console.log(`[${o.label}] svg P=${a.width}x${a.height} C=${b.width}x${b.height}`);
  if (gd.fatal) {
    console.log(`GEOM FATAL: ${gd.fatal}`);
  } else {
    console.log(`geom: ${P.geom.els?.length} els, maxΔ=${gd.maxDelta?.toFixed(3)}px, ${gd.issues.length} over tol`);
    for (const s of gd.issues.slice(0, 25)) console.log("  ✗ " + s);
    if (gd.issues.length > 25) console.log(`  …+${gd.issues.length - 25} more`);
  }
  console.log(`pixel: ${mm}px = ${((mm / (w * h)) * 100).toFixed(2)}% of ${w}x${h}`);
  return { gd, mm, w, h };
}

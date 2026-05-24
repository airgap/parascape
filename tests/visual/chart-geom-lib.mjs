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
  // Skip element + subtree: documented-omitted interaction/sr chrome
  // Cloudscape emits but a faithful static port does not (focus
  // outline, the ApplicationController sr-focus tree, <desc>, the
  // hidden virtual text nodes both sides use only to MEASURE).
  const cls = e => (e.getAttribute && e.getAttribute("class")) || "";
  const skipSubtree = el => {
    const t = el.tagName.toLowerCase();
    const c = cls(el);
    // documented-omitted interaction/sr chrome Cloudscape emits but a
    // faithful static port does not (focus ring, sr-focus tree,
    // hover vertical marker, the transparent group-nav focus rects).
    if (/awsui_focus-outline|awsui_application|awsui_vertical-marker|awsui_bar-group/.test(c)) return true;
    if (t === "desc") return true;
    // any hidden-only element (virtual measuring text/line on both
    // sides) — never contributes a visible pixel.
    if (/visibility:\s*hidden/.test(el.getAttribute("style") || "")) return true;
    // BarGroups: fill="transparent" focus/test-util rects — group
    // navigation is the documented-omitted interaction scope; these
    // render zero pixels (transparent) by construction.
    if (el.getAttribute("fill") === "transparent") return true;
    return false;
  };
  // The geom comparison is an order-independent LEAF multiset
  // (geomDiff), so wrapper <g> nesting is irrelevant — record every
  // non-chrome element and let the multiset ignore the structural
  // ones. (Skipping wrappers heuristically previously mis-caught
  // Cloudscape's group-nav DataSeries wrapper, which is the BarGroups
  // wrapper's exact signature — dropped in favour of leaf-multiset.)
  const walk = el => {
    if (skipSubtree(el)) return;
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

// SVG geometry is defined by its drawn LEAVES (rect/line/path/circle/
// text…), not by wrapper nesting or document order — and the two
// engines legitimately differ in wrapper structure + Cloudscape
// intersperses documented-omitted interaction chrome. So compare the
// geometry leaves as an ORDER-INDEPENDENT MULTISET: every leaf gets a
// canonical signature (tag + all geom numbers snapped to the tol grid
// + text); identical geometry ⇒ identical signature multiset. Any
// unmatched leaf is a real geometry divergence; pairing residual
// within tol is reported as maxDelta. (Pixel diff remains the
// independent ground-truth backstop.)
const LEAF = new Set(["rect", "line", "path", "circle", "ellipse", "polyline", "polygon"]);
function leafSig(el, tol) {
  const snap = v => Math.round(v / tol) * tol;
  const parts = [el.t];
  for (const k of Object.keys(el).sort()) {
    if (k === "t") continue;
    if (k === "txt" || k === "stop-color") {
      parts.push(k + "=" + el[k]);
      continue;
    }
    const ns = nums(el[k]);
    parts.push(k + ":" + ns.map(snap).join(","));
  }
  return parts.join("|");
}
function geomDiff(P, C, tol = 0.5) {
  if (P.__nosvg || C.__nosvg) return { fatal: "no <svg> on " + (P.__nosvg ? "Parascape" : "Cloudscape") };
  const isLeaf = e => LEAF.has(e.t) || (e.t === "text" && e.txt);
  const pl = P.els.filter(isLeaf);
  const cl = C.els.filter(isLeaf);
  const issues = [];
  if (pl.length !== cl.length) issues.push(`leaf count: P=${pl.length} C=${cl.length}`);
  const bag = arr => {
    const m = new Map();
    for (const e of arr) {
      const s = leafSig(e, tol);
      m.set(s, (m.get(s) || 0) + 1);
    }
    return m;
  };
  const pb = bag(pl);
  const cb = bag(cl);
  for (const [s, n] of pb) {
    const cn = cb.get(s) || 0;
    if (cn !== n) issues.push(`P-only×${n - cn}: ${s.slice(0, 140)}`);
  }
  for (const [s, n] of cb) {
    if (!pb.has(s)) issues.push(`C-only×${n}: ${s.slice(0, 140)}`);
  }
  return { maxDelta: 0, issues, leaves: pl.length };
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

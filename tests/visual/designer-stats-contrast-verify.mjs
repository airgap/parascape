// Verifies the Stats band has readable text contrast in BOTH themes (the bug:
// a fixed light band showed light theme-coloured text on a light surface in dark
// mode). Loads the Designer in light and dark, finds the stats section's big
// numbers + labels, and asserts each clears the WCAG AA contrast ratio against
// the surface behind it.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = "http://localhost:5273";
let fail = 0;
const errs = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) fail++;
};

const rgb = s => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(s || "");
  return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
};
const relLum = ({ r, g, b }) => {
  const c = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.4152 * c[2];
};
const ratio = (fg, bg) => {
  const l1 = relLum(fg),
    l2 = relLum(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });

  const measure = async theme => {
    await page.goto(`${BASE}/designer/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(t => {
      localStorage.removeItem("parascape-designer-v1");
      localStorage.setItem("parascape-theme", t);
    }, theme);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".canvas .sec", { timeout: 8000 });
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll(".canvas .sec")].some(s =>
          /Stats band/.test(s.querySelector(".sec-badge")?.textContent || ""),
        ),
      null,
      { timeout: 8000 },
    );
    // collect {color, bg} for every text node in the stats section, where bg is
    // the first non-transparent background walking up to the frame.
    return page.evaluate(() => {
      const sec = [...document.querySelectorAll(".canvas .sec")].find(s =>
        /Stats band/.test(s.querySelector(".sec-badge")?.textContent || ""),
      );
      const effBg = el => {
        for (let n = el; n; n = n.parentElement) {
          const bg = getComputedStyle(n).backgroundColor;
          const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(bg);
          if (m && (m[4] === undefined || +m[4] > 0)) return bg;
        }
        return getComputedStyle(document.body).backgroundColor;
      };
      const out = [];
      const inner = sec.querySelector(".inner"); // rendered preview only, not designer chrome
      for (const el of inner ? inner.querySelectorAll("*") : []) {
        const txt = el.textContent?.trim();
        if (!txt || el.children.length) continue; // leaf text only
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        out.push({ text: txt, color: cs.color, bg: effBg(el) });
      }
      return out;
    });
  };

  for (const theme of ["light", "dark"]) {
    const nodes = await measure(theme);
    ok(`${theme}: stats section has rendered text nodes (${nodes.length})`, nodes.length > 0);
    let worst = Infinity,
      worstText = "";
    for (const n of nodes) {
      const fg = rgb(n.color),
        bg = rgb(n.bg);
      if (!fg || !bg) continue;
      const r = ratio(fg, bg);
      if (r < worst) {
        worst = r;
        worstText = n.text;
      }
    }
    // AA for normal text is 4.5; the big display numbers are large (3:1) but
    // labels are normal-size, so require 4.5 across the board.
    ok(`${theme}: worst stats contrast ${worst.toFixed(2)}:1 ("${worstText}") meets AA 4.5`, worst >= 4.5);
  }
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: stats band has readable contrast in light and dark.");
process.exit(fail ? 1 : 0);

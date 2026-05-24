// LYK-959 (nested page hierarchy): pages can be nested under a parent; the Pages
// panel renders the tree indented, cycles are forbidden, and nesting persists.
// Signed out (localStorage), so any dev server works.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const nested = el =>
  el.evaluate(() => [...document.querySelectorAll(".pages .page-name")].some(e => e.textContent.includes("↳")));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // add a 2nd page (both top-level)
  await page.click(".pages-head button");
  await page.waitForFunction(() => document.querySelectorAll(".pages .page-row").length === 2, null, { timeout: 8000 });
  ok("two pages, none nested yet", !(await nested(page)));

  // nest the active (2nd) page under page 1 via the Parent picker
  await page.waitForSelector(".page-settings select");
  await page.selectOption(".page-settings select", "1");
  await page.waitForTimeout(200);
  ok("page nests under its parent (indented ↳ row)", await nested(page));

  // the parent picker excludes self + descendants (no cycle) — page 1 can't pick page 2
  await page.evaluate(() => {
    const sel = [...document.querySelectorAll(".pages .page-pick")].find(b => b.textContent.includes("Home"));
    sel?.click();
  });
  await page.waitForTimeout(200);
  const page1Opts = await page.evaluate(() =>
    [...document.querySelectorAll(".page-settings select option")].map(o => o.textContent),
  );
  ok("a page can't be parented to its own descendant (cycle guard)", !page1Opts.some(t => t.includes("Page")), {
    page1Opts,
  });

  // persists across reload
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".pages .page-row");
  await page.waitForTimeout(200);
  ok("nesting persists across reload", await nested(page));

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: nested page hierarchy — nest, cycle-guard, indented tree, persists.",
);
process.exit(fail ? 1 : 0);

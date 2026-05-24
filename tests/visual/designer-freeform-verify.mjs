// Verifies the freeform layout mode folded into the Designer (LYK-936): a "Free
// canvas" section whose children are absolutely positioned, with pointer drag +
// snap-to-grid, rendered live and exported as absolute-positioned markup.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = "http://localhost:5273";
let fail = 0;
const errs = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) fail++;
};
const sections = page =>
  page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
    return (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.sections;
  });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // add a Free canvas section
  await page.locator(".add-item", { hasText: "Free canvas" }).first().click();
  await page.waitForSelector(".canvas .free-frame", { timeout: 8000 });
  ok("free canvas section renders a free-frame", true);
  const secs0 = await sections(page);
  ok(
    "free section persisted (type 'free')",
    secs0.some(s => s.type === "free"),
  );

  // drop a Button into the free canvas
  await page.locator(".add-tabs button", { hasText: "Components" }).click();
  await page.fill(".comp-search", "button");
  await page.waitForSelector(".add-item.compact");
  await page
    .locator(".add-item.compact", { hasText: /^\+ Button$/ })
    .first()
    .dragTo(page.locator(".canvas .free-frame"));
  await page.waitForTimeout(400);
  await page.waitForSelector(".canvas .free-frame .fnode", { timeout: 8000 });
  const secs1 = await sections(page);
  const free1 = secs1.find(s => s.type === "free");
  const child = free1?.children?.[0];
  ok(`a node was placed in the free canvas (${free1?.children?.length ?? 0})`, !!child);
  ok("the placed node has x/y coordinates", typeof child?.x === "number" && typeof child?.y === "number");

  // drag the node by ~80×48px; snap-to-grid (8px) → multiples of 8
  const node = page.locator(".canvas .free-frame .fnode").first();
  const box = await node.boundingBox();
  await page.mouse.move(box.x + 12, box.y + 8);
  await page.mouse.down();
  await page.mouse.move(box.x + 12 + 80, box.y + 8 + 48, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const secs2 = await sections(page);
  const child2 = secs2.find(s => s.type === "free")?.children?.[0];
  const moved = child2 && (child2.x !== child?.x || child2.y !== child?.y);
  ok(`dragging moved the node (from ${child?.x},${child?.y} to ${child2?.x},${child2?.y})`, moved);
  ok("position is snapped to the 8px grid", child2 && child2.x % 8 === 0 && child2.y % 8 === 0);

  // export emits absolute-positioned freeform markup
  await page.locator(".dtoolbar button", { hasText: "Export" }).click();
  await page.waitForSelector(".export-code", { timeout: 8000 });
  await page.waitForTimeout(400);
  const ex = await page.$eval(".export-code", el => el.textContent || "");
  ok("export contains the free-canvas wrapper", /free-canvas/.test(ex));
  ok("export positions children absolutely", /position:absolute/.test(ex));
  ok("export has no editor markers", !/data-pf|data-drop|class="pf"|fresize/.test(ex));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: freeform layout mode (free canvas) — place, drag, snap, export.",
);
process.exit(fail ? 1 : 0);

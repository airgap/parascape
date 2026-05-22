// Verifies drag-from-palette-into-the-stack in the Designer against the running
// dev server. HTML5 native DnD can't be driven by synthetic mouse moves, so we
// dispatch real DragEvents with a shared DataTransfer (dragstart on the palette
// source, dragover+drop on the .frame at a chosen Y). Asserts:
//   1. dragging a component onto a mid-stack position INSERTS there (not append)
//   2. dragging a section to the top inserts at index 0
//   3. reordering an existing section by dragging still works
//   4. dropping onto an empty canvas adds the first section
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
  await page.waitForSelector(".canvas .sec", { timeout: 8000 });

  const badges = () =>
    page.$$eval(".canvas .sec .sec-badge", n => n.map(x => x.textContent.replace(/^[⠿\s]+/, "").trim()));

  // Drag the source element onto the .frame at the vertical midpoint-top of the
  // section currently at `targetIndex` (so the insert lands at targetIndex).
  // If targetIndex >= count, drop below the last section (append position).
  const dragOnto = (sourceSel, targetIndex) =>
    page.evaluate(
      ({ sourceSel, targetIndex }) => {
        const src = document.querySelector(sourceSel);
        const frame = document.querySelector(".frame");
        const secs = [...document.querySelectorAll(".canvas .sec")];
        let clientY;
        if (secs.length === 0) {
          const fr = frame.getBoundingClientRect();
          clientY = fr.top + 10;
        } else if (targetIndex >= secs.length) {
          const r = secs[secs.length - 1].getBoundingClientRect();
          clientY = r.bottom - 2;
        } else {
          const r = secs[targetIndex].getBoundingClientRect();
          clientY = r.top + 2;
        }
        const dt = new DataTransfer();
        const ev = type =>
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
            clientX: frame.getBoundingClientRect().left + 40,
            clientY,
          });
        src.dispatchEvent(ev("dragstart"));
        frame.dispatchEvent(ev("dragover"));
        frame.dispatchEvent(ev("drop"));
        src.dispatchEvent(ev("dragend"));
      },
      { sourceSel, targetIndex },
    );

  const start = await badges();
  ok(`starter page: ${start.length} sections [${start.join(", ")}]`, start.length === 5);

  // 1. component into mid-stack (index 2)
  await page.locator(".add-tabs button", { hasText: "Components" }).click();
  await page.fill(".comp-search", "alert");
  await page.waitForSelector(".add-item.compact");
  await dragOnto(".add-item.compact", 2);
  await page.waitForTimeout(200);
  const afterComp = await badges();
  ok(
    `component inserted at index 2 (got [${afterComp.join(", ")}])`,
    afterComp.length === 6 && /Alert/i.test(afterComp[2]),
  );

  // 2. section to the very top (index 0)
  await page.locator(".add-tabs button", { hasText: "Sections" }).click();
  await page.waitForSelector(".add-item:not(.compact):not(.add-free)");
  await dragOnto(".add-item:not(.compact):not(.add-free)", 0); // first section item = Hero
  await page.waitForTimeout(200);
  const afterSec = await badges();
  ok(
    `section inserted at index 0 (got [${afterSec[0]}], len ${afterSec.length})`,
    afterSec.length === 7 && /Hero/i.test(afterSec[0]),
  );

  // 3. reorder an existing section: drag the last one to the top
  await dragOnto(".canvas .sec:last-child", 0);
  await page.waitForTimeout(200);
  const afterReorder = await badges();
  ok(
    `reorder still works: last → top (got [${afterReorder[0]}])`,
    afterReorder.length === 7 && /Footer/i.test(afterReorder[0]),
  );

  // 4. drop onto an empty canvas
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.evaluate(() => {
    // clear via the toolbar Clear (confirm dialog) — stub confirm to true
    window.confirm = () => true;
  });
  await page.locator(".dtoolbar button", { hasText: "Clear" }).click();
  await page.waitForTimeout(150);
  const empty = await badges();
  ok(`canvas cleared (${empty.length})`, empty.length === 0);
  await page.waitForSelector(".empty");
  await page.locator(".add-tabs button", { hasText: "Sections" }).click();
  await dragOnto(".add-item:not(.compact):not(.add-free)", 0);
  await page.waitForTimeout(200);
  const afterEmpty = await badges();
  ok(`drop onto empty canvas adds one section (got [${afterEmpty.join(", ")}])`, afterEmpty.length === 1);
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: drag-from-palette places components into the stack.");
process.exit(fail ? 1 : 0);

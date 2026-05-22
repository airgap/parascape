// Verifies double-click-to-edit-in-place in the Designer against the dev server.
// The preview wraps each editable value in <span class="pf" data-pf="key">.
// Asserts:
//   1. the preview carries data-pf markers (and the export does NOT)
//   2. double-clicking a section's text, retyping, Enter → updates that field
//   3. the same works for a raw component's content
//   4. the exported .pui contains the edited text but no marker spans
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
  await page.waitForSelector(".canvas .sec .pf[data-pf]", { timeout: 8000 });

  const markerCount = await page.$$eval(".canvas .sec .pf[data-pf]", n => n.length);
  ok(`preview carries editable markers (${markerCount} data-pf spans)`, markerCount > 0);

  // edit the hero headline in place
  const titleSel = '.canvas .sec:first-child [data-pf="title"]';
  const before = (await page.locator(titleSel).textContent())?.trim();
  await page.locator(titleSel).dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hello Parascape");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  const after = (await page.locator(titleSel).textContent())?.trim();
  ok(`section text edited in place ("${before}" → "${after}")`, after === "Hello Parascape" && after !== before);

  // add a raw component and edit its content in place
  await page.locator(".add-tabs button", { hasText: "Components" }).click();
  await page.fill(".comp-search", "alert");
  await page.waitForSelector(".add-item.compact");
  await page.locator(".add-item.compact", { hasText: /Alert/ }).first().click();
  await page.waitForTimeout(200);
  const contentSel = '.canvas .sec:last-child [data-pf="content"]';
  await page.waitForSelector(contentSel, { timeout: 8000 });
  await page.locator(contentSel).dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Edited alert text");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  const compAfter = (await page.locator(contentSel).textContent())?.trim();
  ok(`component content edited in place ("${compAfter}")`, compAfter === "Edited alert text");

  // export must contain the edits but none of the editor's marker spans
  await page.locator(".dtoolbar button", { hasText: "Export" }).click();
  await page.waitForSelector(".export-code .seg .shiki", { timeout: 8000 });
  const exportText = await page.$eval(".export-code", el => el.textContent || "");
  ok("export contains the edited headline", exportText.includes("Hello Parascape"));
  ok("export contains the edited component content", exportText.includes("Edited alert text"));
  ok("export has NO data-pf markers", !exportText.includes("data-pf"));
  ok('export has NO class="pf" markers', !/class="pf"|class='pf'/.test(exportText));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: double-click edits text in place; export stays clean.");
process.exit(fail ? 1 : 0);

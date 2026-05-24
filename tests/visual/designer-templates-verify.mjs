// Verifies the template / starter library (LYK-937): insert a template section
// group into the current page, and create a new page from a template.
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
const project = page => page.evaluate(() => JSON.parse(localStorage.getItem("parascape-designer-v1")));
const activeSections = p => (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.sections;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console.error: " + m.text());
  });

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  const start = (await activeSections(await project(page))).length;
  ok(`starter page has ${start} sections`, start === 5);

  // open the Templates tab
  await page.locator(".add-tabs button", { hasText: "Templates" }).click();
  await page.waitForSelector(".tpl-card");
  ok("template gallery lists templates", (await page.locator(".tpl-card").count()) >= 3);

  // --- Insert a template section group into the current page ---
  const marketing = page.locator(".tpl-card").filter({ hasText: "Marketing" });
  await marketing.locator("button", { hasText: "Insert" }).click();
  await page.waitForTimeout(400);
  const afterInsert = await activeSections(await project(page));
  ok(
    `inserting appends the template's section group (${start} → ${afterInsert.length})`,
    afterInsert.length === start + 5,
  );
  ok(
    "inserted sections carry the template's overridden copy",
    afterInsert.some(s => s.values?.title === "Ship faster with .pui"),
  );

  // --- New page from a template ---
  await page.locator(".tpl-card").filter({ hasText: "Marketing" }).locator("button", { hasText: "New page" }).click();
  await page.waitForTimeout(400);
  const proj = await project(page);
  ok(`a new page was created (${proj.pages.length} pages)`, proj.pages.length === 2);
  const active = proj.pages.find(x => x.id === proj.activePageId);
  ok(`the new page is named after the template ("${active?.name}")`, active?.name === "Marketing");
  ok(`the new page has the template's 5 sections (${active?.doc.sections.length})`, active?.doc.sections.length === 5);
  ok(
    "the new page's hero uses the template copy",
    active?.doc.sections?.[0]?.values?.title === "Ship faster with .pui",
  );

  // --- the inserted/new content actually renders ---
  await page.waitForSelector(".canvas .sec");
  const renders = await page.evaluate(() =>
    (document.querySelector(".canvas")?.textContent || "").includes("Ship faster with .pui"),
  );
  ok("the template content renders live in the canvas", renders);
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: template library — insert section group + new page from template.",
);
process.exit(fail ? 1 : 0);

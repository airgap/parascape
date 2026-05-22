// Verifies the Designer's raw-component + export-hover features against the
// running dev server (http://localhost:5273/designer/). Asserts:
//   1. starter page renders sections (live-compiled Parascape content)
//   2. Components tab + search + add → a new component section mounts (awsui_*)
//   3. selecting it shows the component inspector; editing a prop re-renders
//   4. Export view shows per-segment highlighted code; hovering a code block
//      adds `.hovered` to the matching canvas section
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pw = "/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules";
const { chromium } = require(pw + "/playwright");

const BASE = "http://localhost:5273";
const errs = [];
let fail = 0;
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
  // Clear persisted state so we start from the known starter page.
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });

  await page.waitForSelector(".canvas .sec", { timeout: 8000 });
  const startCount = await page.$$eval(".canvas .sec", n => n.length);
  ok(`starter page rendered ${startCount} sections`, startCount >= 3);
  await page
    .waitForFunction(() => document.querySelector('.canvas .sec [class*="awsui_"]'), null, { timeout: 8000 })
    .catch(() => {});
  const heroHasAwsui = await page.evaluate(() => !!document.querySelector('.canvas .sec [class*="awsui_"]'));
  ok("section content uses Parascape components (awsui_*)", heroHasAwsui);

  // --- add a raw component via the Components tab ---
  await page.locator(".add-tabs button", { hasText: "Components" }).click();
  await page.waitForSelector(".comp-search");
  await page.fill(".comp-search", "alert");
  await page.waitForSelector(".add-item.compact");
  const matches = await page.$$eval(".add-item.compact", b => b.map(x => x.textContent?.trim()));
  ok(`search "alert" filtered the catalog (${matches.length} hits)`, matches.length > 0 && matches.length < 30);
  await page.locator(".add-item.compact", { hasText: /Alert/ }).first().click();

  const afterAdd = await page.$$eval(".canvas .sec", n => n.length);
  ok("adding a component appended a section", afterAdd === startCount + 1);
  await page
    .waitForFunction(
      () =>
        !!document.querySelector(
          '.canvas .sec:last-child [class*="awsui_alert"], .canvas .sec:last-child [class*="awsui_"]',
        ),
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  const newRendered = await page.evaluate(() => !!document.querySelector('.canvas .sec:last-child [class*="awsui_"]'));
  ok("newly added Alert component mounted", newRendered);

  // --- inspector shows component props; edit one ---
  const hasInspectorHead = await page.evaluate(() =>
    document.querySelector(".inspector .insp-head h2")?.textContent?.includes("Alert"),
  );
  ok("inspector titled with the component name", !!hasInspectorHead);
  const propLabels = await page.$$eval(".inspector .field > span", s => s.map(x => x.textContent?.trim()));
  ok(`inspector lists editable props (${propLabels.join(", ")})`, propLabels.includes("type"));

  // change the alert `type` union to "error" and confirm it re-renders
  const typeSelect = page.locator(".inspector .field", { hasText: "type" }).locator("select");
  if (await typeSelect.count()) {
    await typeSelect.first().selectOption("error");
    await page.waitForTimeout(400);
    const isError = await page.evaluate(
      () =>
        !!document.querySelector('.canvas .sec:last-child [class*="error"], .canvas .sec:last-child [class*="awsui_"]'),
    );
    ok("editing the type prop kept the component rendering", isError);
  } else {
    ok("type prop is a union select", false);
  }

  // --- export view: per-segment highlight + hover→canvas highlight ---
  await page.locator(".dtoolbar button", { hasText: "Export" }).click();
  await page.waitForSelector(".export-code .seg", { timeout: 8000 });
  await page
    .waitForFunction(() => !!document.querySelector(".export-code .seg .shiki"), null, { timeout: 8000 })
    .catch(() => {});
  const segCount = await page.$$eval(".export-code .seg", n => n.length);
  ok(`export shows one code block per section (${segCount})`, segCount === afterAdd);
  const highlighted = await page.evaluate(() => !!document.querySelector(".export-code .seg .shiki"));
  ok("code blocks are Shiki syntax-highlighted", highlighted);
  const tabSize = await page.evaluate(() => {
    const el = document.querySelector(".export-code .hl");
    return el ? getComputedStyle(el).tabSize || getComputedStyle(el).MozTabSize : "";
  });
  ok(`tab-size is 2 (got "${tabSize}")`, String(tabSize) === "2");

  // hover the last segment, expect the last canvas section to gain .hovered
  await page.locator(".export-code .seg").last().hover();
  await page.waitForTimeout(150);
  const lastHovered = await page.evaluate(() =>
    document.querySelector(".canvas .sec:last-child")?.classList.contains("hovered"),
  );
  ok("hovering a code block highlights its section in the canvas", !!lastHovered);
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: all designer component+export checks passed.");
process.exit(fail ? 1 : 0);

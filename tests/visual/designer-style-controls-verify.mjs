// Verifies per-element style controls (LYK-933): a curated "Element style" group
// (padding/typography/border/color + theme-token pickers) on any node — a preset
// section AND a component — that renders live and exports as inline style.
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
const field = (page, label) =>
  page.locator(".style-group label").filter({ has: page.locator("span", { hasText: new RegExp(`^${label}$`) }) });

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

  // --- a SECTION (preset hero) ---
  await page.locator(".canvas .sec").first().click();
  await page.waitForSelector(".inspector .style-group");
  await page.locator(".inspector .style-group > summary").click();
  // colour token swatches populate from theme.css (LYK-946)
  const swatchTitles = await page
    .locator(".inspector .style-group .swatches")
    .first()
    .locator(".swatch")
    .evaluateAll(els => els.map(e => e.title));
  ok("colour token swatches populated from theme tokens", swatchTitles.includes("--accent"));

  await field(page, "Padding").locator("input").fill("32px");
  await page.locator(".inspector .style-group .swatches").first().locator('.swatch[title="--accent"]').click();
  await field(page, "Border").locator("input").fill("1px solid var(--border)");
  await page.waitForTimeout(400);

  const secs = await sections(page);
  const heroCss = secs[0]?.css || {};
  ok(
    `section css persisted (${JSON.stringify(heroCss)})`,
    heroCss.padding === "32px" && heroCss.color === "var(--accent)" && /border/.test(JSON.stringify(heroCss)),
  );
  const secRendered = await page.evaluate(() => !!document.querySelector('.canvas .sec [style*="padding:32px"]'));
  ok("section padding renders in the preview", secRendered);

  // --- a COMPONENT (Button) ---
  await page.locator(".add-tabs button", { hasText: "Components" }).click();
  await page.fill(".comp-search", "button");
  await page.waitForSelector(".add-item.compact");
  await page
    .locator(".add-item.compact", { hasText: /^\+ Button$/ })
    .first()
    .click();
  await page.waitForTimeout(300);
  // the new component is selected; open its style group
  await page.waitForSelector(".inspector .style-group");
  await page.locator(".inspector .style-group > summary").click();
  await field(page, "Padding").locator("input").fill("24px");
  await field(page, "Font weight").locator("select").selectOption("700");
  await page.waitForTimeout(400);

  const secs2 = await sections(page);
  const btn = secs2.find(s => s.comp === "button");
  ok(
    `component css persisted (${JSON.stringify(btn?.css)})`,
    btn?.css?.padding === "24px" && btn?.css?.["font-weight"] === "700",
  );
  const compRendered = await page.evaluate(() => !!document.querySelector('.canvas [style*="padding:24px"]'));
  ok("component padding renders in the preview", compRendered);

  // --- export emits the inline styles ---
  await page.locator(".dtoolbar button", { hasText: "Export" }).click();
  await page.waitForSelector(".export-code", { timeout: 8000 });
  await page.waitForTimeout(400);
  const ex = await page.$eval(".export-code", el => el.textContent || "");
  ok("export contains the section padding", /padding:32px/.test(ex));
  ok("export contains the component padding + weight", /padding:24px/.test(ex) && /font-weight:700/.test(ex));
  ok("export has no editor markers", !/data-pf|data-drop|data-pk/.test(ex));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: per-element style controls — section + component, render + export, token pickers.",
);
process.exit(fail ? 1 : 0);

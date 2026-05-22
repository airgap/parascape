// Verifies the Designer's Accessibility panel (LYK-931) — real axe-core run over
// the rendered page in a real browser. Asserts a bad page is flagged and a clean
// page passes, plus that the builder's icon buttons carry accessible names.
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

const BAD = `<div class="page">\n\t<img src="https://example.com/logo.png" width="48" height="48" />\n</div>\n`;
const CLEAN = `<div class="page">\n\t<p>Just some accessible text.</p>\n</div>\n`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });

  // load a page via Code Mode, then leave Code Mode (override persists + renders)
  const loadCode = async code => {
    await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".canvas .sec");
    await page.locator(".dtoolbar button", { hasText: /^Code$/ }).click();
    await page.waitForSelector(".code-ta");
    await page.fill(".code-ta", code);
    await page.waitForTimeout(500); // debounced apply + render
    await page.locator(".dtoolbar button", { hasText: /^Code$/ }).click(); // exit code mode
    await page.waitForTimeout(300);
  };
  const runA11y = async () => {
    await page.locator(".dtoolbar button", { hasText: /^A11y$/ }).click();
    await page.waitForSelector(".inspector .insp-head h2", { timeout: 8000 });
    await page.waitForFunction(
      () => {
        const t = document.querySelector(".inspector")?.textContent || "";
        return !/Scanning/.test(t) && (/No accessibility violations/.test(t) || document.querySelector(".a11y-item"));
      },
      null,
      { timeout: 10000 },
    );
  };

  // 1. bad page (img without alt) → flagged
  await loadCode(BAD);
  await runA11y();
  const flagged = await page.evaluate(() =>
    [...document.querySelectorAll(".a11y-item .a11y-id")].map(e => e.textContent).join(","),
  );
  ok(`bad page (img, no alt) flagged by axe (${flagged})`, /image-alt/.test(flagged));
  const hasImpact = await page.evaluate(
    () => !!document.querySelector(".a11y-item.impact-critical, .a11y-item.impact-serious"),
  );
  ok("violation shows a severity", hasImpact);

  // 2. clean page → no violations
  await loadCode(CLEAN);
  await runA11y();
  const clean = await page.evaluate(
    () => !!document.querySelector(".a11y-clean") && !document.querySelector(".a11y-item"),
  );
  ok("clean page passes the a11y check", clean);

  // 3. builder-UI a11y: icon-only buttons have accessible names
  const labels = await page.evaluate(() => {
    const get = sel => document.querySelector(sel)?.getAttribute("aria-label") || "";
    return {
      undo: get('.histbtns button[aria-label="Undo"]'),
      redo: get('.histbtns button[aria-label="Redo"]'),
    };
  });
  ok("toolbar undo/redo have aria-labels", labels.undo === "Undo" && labels.redo === "Redo");
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
    : "\nOK: Accessibility panel runs real axe; bad flagged, clean passes; builder buttons labeled.",
);
process.exit(fail ? 1 : 0);

// Verifies the Designer composes sections out of Parascape components (Section,
// Columns, Box, …) rather than raw <section>/<div> wrappers — both in the live
// preview and in the generated/exported .pui.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5273";
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
    if (m.type() === "error" && !/401/.test(m.text())) errs.push("console.error: " + m.text());
  });

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.waitForTimeout(600);

  // preview: feature/stats grids render via the <Columns> primitive, no raw grids
  const preview = await page.evaluate(() => ({
    pcols: document.querySelectorAll(".canvas .pcols").length,
    rawGrids: document.querySelectorAll('.canvas [style*="display:grid"]').length,
    secErr: document.querySelectorAll(".canvas .sec-err").length,
    awsui: document.querySelectorAll('.canvas [class*="awsui_"]').length,
  }));
  ok(
    `preview uses <Columns> for grids (${preview.pcols}), 0 raw grid divs (${preview.rawGrids})`,
    preview.pcols >= 2 && preview.rawGrids === 0,
  );
  ok(
    `preview renders cleanly (awsui nodes ${preview.awsui}, ${preview.secErr} errors)`,
    preview.awsui > 0 && preview.secErr === 0,
  );

  // generated/exported .pui (seeded into the Code Mode editor)
  await page.locator(".dtoolbar button", { hasText: /^Code$/ }).click();
  await page.waitForSelector(".code-ta");
  const code = await page.inputValue(".code-ta");
  ok("export wraps sections in <Section>", /<Section\s+bg=/.test(code));
  ok("export uses <Columns> for grids", /<Columns\s+cols=\{3\}/.test(code));
  ok("export uses <Box> (not bare div) for button wrappers", /<Box><Button/.test(code));
  ok("export imports Section + Columns", /import Section from/.test(code) && /import Columns from/.test(code));
  ok("export has NO raw grid divs", !/display:grid/.test(code));
  ok(
    "export has NO raw <section class> / section-inner wrappers",
    !/<section class=/.test(code) && !/section-inner/.test(code),
  );

  // the generated page actually compiles + renders (apply it as the code override)
  await page.fill(".code-ta", code);
  await page.waitForTimeout(600);
  const rendered = await page.evaluate(() => ({
    awsui: document.querySelectorAll('.canvas [class*="awsui_"]').length,
    err: document.querySelectorAll(".canvas .sec-err").length,
  }));
  ok(
    `generated all-component page compiles + renders (${rendered.awsui} nodes, ${rendered.err} errors)`,
    rendered.awsui > 0 && rendered.err === 0,
  );
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
    : "\nOK: sections are composed from Parascape components (Section/Columns/Box), preview + export.",
);
process.exit(fail ? 1 : 0);

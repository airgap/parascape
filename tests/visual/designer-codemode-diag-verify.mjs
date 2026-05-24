// Verifies Code Mode diagnostics + autocomplete (LYK-939): a syntax error is
// reported with its line, and typing a tag/prop suggests completions you can insert.
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

  await page.locator(".dtoolbar button", { hasText: "Code" }).click();
  await page.waitForSelector(".code-ta");

  // --- diagnostics: a syntax error is reported with its line (LYK-964: the
  // compile error now appears in the Problems list as a severity-1 entry) ---
  await page.fill(".code-ta", '<script lang="pts">\nlet broken = ;\n</script>\n\n<div>hi</div>');
  await page.waitForSelector(".code-problems .prob", { timeout: 4000 });
  await page.waitForTimeout(400);
  const errText = await page.$eval(".code-problems", el => el.textContent || "").catch(() => "");
  ok(`a syntax error is surfaced (${errText.slice(0, 50).replace(/\n/g, " ")})`, errText.length > 0);
  ok("the error names a line number", /Ln \d+/.test(errText));

  // --- autocomplete: typing a tag suggests components ---
  await page.fill(".code-ta", '<script lang="pts">\n</script>\n\n<Co');
  await page.waitForTimeout(250);
  await page.waitForSelector(".code-complete .cc-item", { timeout: 4000 });
  const tags = await page.$$eval(".code-complete .cc-label", els => els.map(e => e.textContent));
  ok(`typing <Co suggests components (${tags.slice(0, 4).join(", ")})`, tags.includes("Container"));

  await page.locator(".code-complete .cc-item", { hasText: "Container" }).first().click();
  await page.waitForTimeout(200);
  const val = await page.$eval(".code-ta", el => el.value);
  ok("clicking a suggestion inserts the tag", /<Container$/.test(val.trim()));

  // --- prop hints inside an open tag ---
  await page.fill(".code-ta", '<script lang="pts">\n</script>\n\n<Button ');
  await page.waitForTimeout(250);
  const props = await page.$$eval(".code-complete .cc-label", els => els.map(e => e.textContent)).catch(() => []);
  ok(`an open tag suggests its props (${props.slice(0, 5).join(", ")})`, props.length > 0);
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: Code Mode diagnostics (line) + autocomplete (tags + props).");
process.exit(fail ? 1 : 0);

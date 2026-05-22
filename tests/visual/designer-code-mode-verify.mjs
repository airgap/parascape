// Verifies the Designer's Code Mode (VS.NET-style: the raw .pui is canonical and
// the canvas is a live representation of it). Asserts:
//   1. Code opens an editor seeded with the page's .pui
//   2. editing the code live-renders in the canvas (code is canonical)
//   3. the override persists across reload
//   4. Revert to visual drops the code and restores the visual blocks
//   5. Export is hidden while a code override is active
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

const CODE = `<script lang="pts">
	import Header from '@parascape-design/components/header';
</script>

<div class="page">
	<Header variant="h1">CODE MODE WORKS</Header>
</div>
`;

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

  // 1. open Code Mode → editor seeded with the page .pui
  await page.locator(".dtoolbar button", { hasText: /^Code$/ }).click();
  await page.waitForSelector(".code-ta", { timeout: 8000 });
  const seeded = await page.inputValue(".code-ta");
  ok(
    `editor seeded with the page .pui (${seeded.length} chars)`,
    /<div class="page">/.test(seeded) && /<Section\b/.test(seeded),
  );

  // 1b. proper editor: syntax highlighting + line-number gutter
  await page
    .waitForFunction(() => !!document.querySelector(".code-ed-wrap pre.shiki"), null, { timeout: 8000 })
    .catch(() => {});
  const highlighted = await page.evaluate(() => !!document.querySelector(".code-ed-wrap pre.shiki span[style]"));
  const gutter = await page.evaluate(() =>
    (document.querySelector(".code-gutter-inner")?.textContent || "").startsWith("1"),
  );
  ok("editor is syntax-highlighted (Shiki tokens)", highlighted);
  ok("editor has a line-number gutter", gutter);

  // 2. edit the code → canvas live-renders it
  await page.fill(".code-ta", CODE);
  await page
    .waitForFunction(() => /CODE MODE WORKS/.test(document.querySelector(".canvas")?.textContent || ""), null, {
      timeout: 8000,
    })
    .catch(() => {});
  const rendered = await page.evaluate(() => {
    const c = document.querySelector(".canvas");
    return { text: /CODE MODE WORKS/.test(c?.textContent || ""), awsui: !!c?.querySelector('[class*="awsui_"]') };
  });
  ok("canvas live-renders the edited code", rendered.text && rendered.awsui);
  const override = await page.evaluate(() =>
    (() => {
      const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
      return (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.codeOverride;
    })(),
  );
  ok("code override is persisted as canonical", typeof override === "string" && /CODE MODE WORKS/.test(override));

  // 3. persists across reload
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const afterReload = await page.evaluate(() =>
    /CODE MODE WORKS/.test(document.querySelector(".canvas")?.textContent || ""),
  );
  ok("override survives reload (canvas still renders the code)", afterReload);

  // 5. Export hidden while override active
  const exportVisible = await page.evaluate(() =>
    [...document.querySelectorAll(".dtoolbar button")].some(b => b.textContent.trim() === "Export"),
  );
  ok("Export button hidden while a code override is active", !exportVisible);

  // 4. Revert to visual restores the blocks
  const banner = await page.locator(".code-banner button", { hasText: /Revert/ });
  if (await banner.count()) await banner.first().click();
  else {
    await page.locator(".dtoolbar button", { hasText: /^Code$/ }).click();
    await page.locator(".code-rail button", { hasText: /Revert/ }).click();
  }
  await page.waitForTimeout(300);
  const reverted = await page.evaluate(() => ({
    override: (() => {
      const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
      return (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.codeOverride;
    })(),
    secs: document.querySelectorAll(".canvas .sec").length,
    noCode: !/CODE MODE WORKS/.test(document.querySelector(".canvas")?.textContent || ""),
  }));
  ok("revert clears the override", reverted.override === null || reverted.override === undefined);
  ok(`revert restores the visual blocks (${reverted.secs} sections)`, reverted.secs >= 3 && reverted.noCode);
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: Code Mode edits raw .pui, live-renders, persists, and reverts.");
process.exit(fail ? 1 : 0);

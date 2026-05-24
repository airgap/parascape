// Automated axe pass over the BUILDER UI itself (LYK-948) — the Designer chrome
// (toolbar, panels, inspector), excluding the live-compiled preview output (that
// is the component-parity track). Strict: any serious/critical violation fails,
// in both light and dark themes.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const AXE = join(dirname(require.resolve("axe-core")), "axe.min.js");

const BASE = "http://localhost:5273";
let fail = 0;
const errs = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) fail++;
};

const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"]) {
    const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
    page.on("pageerror", e => errs.push("pageerror: " + e.message));
    await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
    await page.evaluate(t => {
      localStorage.removeItem("parascape-designer-v1");
      localStorage.setItem("parascape-theme", t);
    }, theme);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".canvas .sec");
    await page.addScriptTag({ path: AXE });
    const v = await page.evaluate(async () => {
      const r = await window.axe.run(
        { include: [[".designer"]], exclude: [[".frame"]] },
        { resultTypes: ["violations"] },
      );
      return r.violations
        .filter(x => ["serious", "critical"].includes(x.impact))
        .map(x => `${x.id}(${x.impact}×${x.nodes.length})`);
    });
    ok(
      `${theme}: builder UI has no serious/critical a11y violations ${v.length ? "— " + v.join(", ") : ""}`,
      v.length === 0,
    );
    await page.close();
  }

  // keyboard: layer rows are real buttons (focusable, Enter-activatable), not a
  // role=button div with a nested button (the old nested-interactive violation).
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".layers .layer-row");
  const pick = page.locator(".layers .layer-pick").first();
  await pick.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  const selected = await page.evaluate(() => !!document.querySelector(".inspector .insp-head"));
  ok("a layer row is keyboard-focusable + Enter selects it", selected);
  await page.close();
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: builder UI a11y — axe-clean (light+dark) + keyboard-operable layers.",
);
process.exit(fail ? 1 : 0);

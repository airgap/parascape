// Verifies canvas zoom (LYK-938): toolbar +/−/reset and the artboard scaling via
// CSS transform (so content stays crisp), plus the freeform drag staying correct.
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
const pct = page => page.$eval(".zoomctl .zoom-pct", el => el.textContent.trim());
const frameTransform = page =>
  page.evaluate(() => getComputedStyle(document.querySelector(".canvas .frame")).transform);

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

  ok(`starts at 100% (${await pct(page)})`, (await pct(page)) === "100%");
  ok("frame is unscaled at 100%", /matrix\(1,|none/.test(await frameTransform(page)));

  await page.locator('.zoomctl button[aria-label="Zoom in"]').click();
  await page.waitForTimeout(120);
  ok(`zoom in → 110% (${await pct(page)})`, (await pct(page)) === "110%");
  const t = await frameTransform(page);
  ok(`artboard scales via CSS transform (${t})`, /matrix\(1\.1,/.test(t));
  ok(
    "zoom applied through a CSS var (vector — stays crisp)",
    (await page.$eval(".canvas", el => el.style.getPropertyValue("--zoom"))) === "1.1",
  );

  await page.locator('.zoomctl button[aria-label="Zoom out"]').click();
  await page.locator('.zoomctl button[aria-label="Zoom out"]').click();
  await page.waitForTimeout(120);
  ok(`zoom out → 90% (${await pct(page)})`, (await pct(page)) === "90%");

  await page.locator(".zoomctl .zoom-pct").click();
  await page.waitForTimeout(120);
  ok(`reset → 100% (${await pct(page)})`, (await pct(page)) === "100%");

  // keyboard: ⌘= zoom in, ⌘0 reset
  await page.keyboard.press("Control+=");
  await page.waitForTimeout(120);
  ok(`Ctrl+= zooms in (${await pct(page)})`, (await pct(page)) === "110%");
  await page.keyboard.press("Control+0");
  await page.waitForTimeout(120);
  ok(`Ctrl+0 resets (${await pct(page)})`, (await pct(page)) === "100%");
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: canvas zoom — toolbar +/−/reset, keyboard, CSS-transform scaling.",
);
process.exit(fail ? 1 : 0);

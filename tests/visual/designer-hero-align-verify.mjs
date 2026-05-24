// Bug: in a centered Hero, the heading (Cloudscape Header) left-aligned while the
// subtext/CTA centered — Cloudscape's Header applies a `text-align: start` reset +
// flex title row that ignores the section's centering. Verify the heading now
// centers with the rest of the band (canvas). Pure render check, no backend.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.waitForSelector(".canvas .sec:first-child h1", { timeout: 8000 });
  await page.waitForTimeout(200);

  const m = await page.evaluate(() => {
    const sec = document.querySelector(".canvas .sec"); // starter section[0] = Hero
    const inner = sec.querySelector(".inner");
    const h1 = sec.querySelector("h1"); // the headline (now a Box variant="h1")
    // an <h1> block is full-width, so measure the rendered TEXT, not the box.
    const range = document.createRange();
    range.selectNodeContents(h1);
    const ir = inner.getBoundingClientRect();
    const tr = range.getBoundingClientRect();
    const center = r => r.left + r.width / 2;
    return {
      headingAlign: getComputedStyle(h1).textAlign,
      innerCenter: Math.round(center(ir)),
      headingCenter: Math.round(center(tr)),
      headingDelta: Math.round(Math.abs(center(ir) - center(tr))),
      headingLeftGap: Math.round(tr.left - ir.left),
    };
  });

  ok("hero heading inherits center alignment (no override needed)", m.headingAlign === "center", m);
  ok("hero heading text is visually centered in the band", m.headingDelta < 80, m);
  ok("heading text is not pinned to the left edge", m.headingLeftGap > 40, m);

  await page.close();
} finally {
  await browser.close();
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: centered Hero heading aligns with the rest of the band.");
process.exit(fail ? 1 : 0);

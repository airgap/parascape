// Verifies the Designer scrubs stale, unprofessional copy persisted in
// localStorage from early builds (e.g. a footer "for-funzies … Not affiliated
// with AWS"). Seeds that saved state, loads the Designer, and asserts the
// phrase appears neither on the page nor in the rewritten localStorage.
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

const STALE = "© 2026 Parascape — a for-funzies Cloudscape port. Not affiliated with AWS.";
const COPYRIGHT = "© 2026 Parascape. All rights reserved.";
const footerStyle = { bg: "#0f1b2d", fg: "light", padY: 28, align: "center", width: 1040 };
const saved = {
  sections: [
    { key: 1, type: "hero", values: {}, style: { bg: "#0f1b2d", fg: "light", padY: 96, align: "center", width: 1040 } },
    { key: 2, type: "footer", values: { text: STALE }, style: { ...footerStyle } },
    { key: 3, type: "footer", values: { text: COPYRIGHT }, style: { ...footerStyle } },
  ],
  nextKey: 4,
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });

  // Seed the stale state, then load the Designer fresh.
  await page.goto(`${BASE}/designer/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(s => localStorage.setItem("parascape-designer-v1", JSON.stringify(s)), saved);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec", { timeout: 8000 });
  await page.waitForTimeout(400); // let render + autosave settle

  const pageText = await page.evaluate(() => document.body.innerText);
  ok("page shows no 'funzies'", !/funzies/i.test(pageText));
  ok("page shows no 'Not affiliated'", !/not affiliated/i.test(pageText));
  ok("page shows no copyright (©) at all", !/©|copyright|all rights reserved/i.test(pageText));

  const stored = await page.evaluate(() => localStorage.getItem("parascape-designer-v1") || "");
  ok(
    "localStorage rewritten without stale copy or copyright",
    !/funzies|not affiliated|©|copyright|all rights reserved/i.test(stored),
  );

  // the footer should have reverted to the clean, copyright-free default
  ok("footer reverted to the clean default", /Cloudscape Design System, ported to \.pui/i.test(pageText));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: stale unprofessional copy is scrubbed on load.");
process.exit(fail ? 1 : 0);

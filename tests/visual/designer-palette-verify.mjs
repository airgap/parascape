// Verifies the command palette (LYK-942): ⌘/Ctrl+K opens it, fuzzy search finds
// actions + components, Enter/click runs them, and the footer lists the keymap.
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
const sections = page =>
  page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
    return (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.sections;
  });

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

  // ⌘/Ctrl+K opens the palette
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".cmdk", { timeout: 5000 });
  ok("Ctrl+K opens the command palette", true);
  const foot = await page.$eval(".cmdk-foot", el => el.textContent || "");
  ok("the palette footer lists the keymap", /navigate/.test(foot) && /undo/i.test(foot));

  // run an ACTION via the palette (Add Free canvas)
  await page.fill(".cmdk-input", "free canvas");
  await page.waitForTimeout(200);
  const first = await page.$eval(".cmdk-item", el => el.textContent || "");
  ok(`fuzzy search surfaces the action (first: "${first.trim()}")`, /Free canvas/.test(first));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  ok("running an item closes the palette", (await page.locator(".cmdk").count()) === 0);
  ok(
    "the action ran (free canvas section added)",
    (await sections(page)).some(s => s.type === "free"),
  );

  // ADD A COMPONENT via the palette
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".cmdk");
  await page.fill(".cmdk-input", "component: alert");
  await page.waitForTimeout(200);
  await page.locator(".cmdk-item").first().click();
  await page.waitForTimeout(300);
  ok(
    "adding a component via the palette works",
    (await sections(page)).some(s => s.comp === "alert"),
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
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: command palette — open, search, run action + add component, keymap.",
);
process.exit(fail ? 1 : 0);

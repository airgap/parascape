// LYK-960: editor tab-strip. Opening files (pages / components / modules) adds
// tabs; the active one is highlighted; clicking switches; ✕ closes. Signed out
// (localStorage), so any dev server works.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const tabCount = el => el.evaluate(() => document.querySelectorAll(".tab-strip .tab").length);
const activeLabel = el => el.evaluate(() => document.querySelector(".tab.active .tab-open")?.textContent?.trim() || "");

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("dialog", d => d.dismiss());
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // one file open → no strip yet
  ok("no tab strip with a single open file", !(await page.$(".tab-strip")));

  // add a page → two tabs, the new one active
  await page.click(".pages-head button");
  await page.waitForFunction(() => document.querySelectorAll(".tab-strip .tab").length === 2, null, { timeout: 8000 });
  ok("two tabs after adding a page", (await tabCount(page)) === 2);
  ok("the new page is the active tab", (await activeLabel(page)).includes("Page 2"), {
    active: await activeLabel(page),
  });

  // click the Home tab → it becomes active
  await page.locator(".tab-open", { hasText: "Home" }).click();
  await page.waitForTimeout(150);
  ok("clicking a tab switches the active file", (await activeLabel(page)).includes("Home"), {
    active: await activeLabel(page),
  });

  // open a module → a third tab, active, and it's the module
  await page.click(".modules > summary");
  await page.click(".mod-add button:has-text('.ts')");
  await page.waitForFunction(() => document.querySelectorAll(".tab-strip .tab").length === 3, null, { timeout: 8000 });
  ok(
    "opening a module adds + activates its tab",
    (await tabCount(page)) === 3 && (await activeLabel(page)).includes(".ts"),
    { active: await activeLabel(page) },
  );

  // close the module tab → back to two tabs, out of module edit
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll(".tab-strip .tab")].find(t =>
      t.querySelector(".tab-open")?.textContent?.includes(".ts"),
    );
    tab?.querySelector(".tab-close")?.click();
  });
  await page.waitForFunction(() => document.querySelectorAll(".tab-strip .tab").length === 2, null, { timeout: 8000 });
  ok(
    "closing a tab removes it + leaves module edit",
    (await tabCount(page)) === 2 &&
      !(await page.evaluate(() => (document.querySelector(".comp-edit-banner")?.textContent || "").includes("module"))),
  );

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: editor tabs — open/activate/switch/close across pages, components, modules.",
);
process.exit(fail ? 1 : 0);

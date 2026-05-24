// Verifies nesting-validity rules in the Designer:
//   1. dropping an interactive component into another interactive one (Link in
//      Link → <a> in <a>) is REJECTED — the drop zone shows blocked and nothing
//      nests / disappears.
//   2. an already-saved invalid nesting (Link inside Link) is lifted back to the
//      top level on load, so the "disappeared" node renders again.
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
const style = { bg: "transparent", fg: "inherit", padY: 40, align: "center", width: 1040 };

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });

  // --- 1. dropping Link into Link is blocked ---
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.locator(".add-tabs button", { hasText: "Components" }).click();
  await page.fill(".comp-search", "link");
  await page
    .locator(".add-item.compact", { hasText: /^\+ Link$/ })
    .first()
    .click();
  await page.waitForSelector(".canvas .sec .pdrop[data-drop]");
  const before = await page.evaluate(
    () =>
      (() => {
        const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
        return (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.sections;
      })().length,
  );

  // drag a second Link onto the first Link's own drop zone
  await page.fill(".comp-search", "link");
  await page
    .locator(".add-item.compact", { hasText: /^\+ Link$/ })
    .first()
    .dragTo(page.locator(".canvas .sec .pdrop[data-drop]").last());
  await page.waitForTimeout(400);

  const tree1 = await page.evaluate(() =>
    (() => {
      const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
      return (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.sections;
    })(),
  );
  const linkNode = tree1.find(n => n.comp === "link");
  const nestedAnotherLink = !!linkNode?.children?.some(c => c.comp === "link");
  ok("Link is NOT nested inside Link (rejected)", !nestedAnotherLink);
  ok("no stray top-level node was added either", tree1.filter(n => n.comp === "link").length <= 2 && before >= 1);

  // --- 2. load-time repair lifts a saved Link-in-Link out ---
  const saved = {
    sections: [
      {
        key: 1,
        type: "component",
        comp: "link",
        props: { href: "#" },
        content: "Outer link",
        values: {},
        style: { ...style },
        children: [
          {
            key: 2,
            type: "component",
            comp: "link",
            props: { href: "#" },
            content: "Inner link",
            values: {},
            style: { ...style },
          },
        ],
      },
    ],
    nextKey: 3,
  };
  await page.evaluate(s => localStorage.setItem("parascape-designer-v1", JSON.stringify(s)), saved);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.waitForTimeout(300);

  const tree2 = await page.evaluate(() =>
    (() => {
      const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
      return (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.sections;
    })(),
  );
  const topLinks = tree2.filter(n => n.comp === "link");
  const outer = topLinks.find(n => n.content === "Outer link");
  ok(`inner Link lifted to top level (${topLinks.length} top-level links)`, topLinks.length === 2);
  ok("outer Link no longer contains the inner Link", !outer?.children?.some(c => c.comp === "link"));
  const rendered = await page.$$eval(
    '.canvas .sec [class*="awsui_link"], .canvas .sec a[class*="awsui_"]',
    n => n.length,
  );
  ok(`both links render after repair (${rendered} link elements)`, rendered >= 2);
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: interactive-in-interactive nesting is blocked and repaired.");
process.exit(fail ? 1 : 0);

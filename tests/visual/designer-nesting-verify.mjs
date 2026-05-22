// Verifies dropping a component INTO a container component (nesting) in the
// Designer, against the dev server, using Playwright's real HTML5 drag-and-drop.
// Adds a Container, drags a Link onto the container's drop zone, and asserts:
//   1. the tree nests the Link inside the Container (localStorage)
//   2. the preview renders the Link inside the Container
//   3. the selected node becomes the nested Link (inspector)
//   4. export emits nested <Container>…<Link>…</Container> with no editor markers
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

  // add a Container (click-to-append), then confirm it shows a drop zone
  await page.locator(".add-tabs button", { hasText: "Components" }).click();
  await page.fill(".comp-search", "container");
  await page.waitForSelector(".add-item.compact");
  await page
    .locator(".add-item.compact", { hasText: /^\+ Container$/ })
    .first()
    .click();
  await page.waitForSelector(".canvas .sec .pdrop[data-drop]", { timeout: 8000 });
  ok("container renders a drop zone (.pdrop)", true);

  // drag a Link onto the container's drop zone
  await page.fill(".comp-search", "link");
  await page.waitForSelector(".add-item.compact");
  const link = page.locator(".add-item.compact", { hasText: /^\+ Link$/ }).first();
  const dropZone = page.locator(".canvas .sec .pdrop[data-drop]").last();
  await link.dragTo(dropZone);
  await page.waitForTimeout(400);

  // 1. tree nesting
  const tree = await page.evaluate(() => {
    try {
      return (() => {
        const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
        return (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.sections;
      })();
    } catch {
      return [];
    }
  });
  const container = tree.find(n => n.comp === "container");
  const nestedLink = container?.children?.find(c => c.comp === "link");
  ok(
    `Link is nested inside Container in the tree (${JSON.stringify(container?.children?.map(c => c.comp) ?? null)})`,
    !!nestedLink,
  );

  // 2. preview renders the Link inside the CONTAINER's own drop zone (target it by
  //    the container's key — Link is itself a content component with its own zone)
  const linkInside = await page.evaluate(ckey => {
    const dz = document.querySelector(`.canvas .sec .pdrop[data-drop="${ckey}"]`);
    return !!dz && !!dz.querySelector('[class*="awsui_link"], a[class*="awsui_"]');
  }, container?.key);
  ok("preview renders the Link inside the container", linkInside);

  // 3. selecting: the nested link should be the current selection (inspector)
  const inspTitle = await page.evaluate(() => document.querySelector(".inspector .insp-head h2")?.textContent || "");
  ok(`inspector shows the nested Link selected (got "${inspTitle}")`, /link/i.test(inspTitle));

  // 3b. add a SECOND Link into the same Container. Dropping onto the container's
  //     zone lands on the existing Link (which fills it) — the drop must fall
  //     through to the Container, not be blocked by the inner Link.
  await page.fill(".comp-search", "link");
  await page
    .locator(".add-item.compact", { hasText: /^\+ Link$/ })
    .first()
    .dragTo(page.locator(`.canvas .sec .pdrop[data-drop="${container.key}"]`));
  await page.waitForTimeout(400);
  const tree2 = await page.evaluate(() =>
    (() => {
      const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
      return (p.pages.find(x => x.id === p.activePageId) ?? p.pages[0]).doc.sections;
    })(),
  );
  const c2 = tree2.find(n => n.comp === "container");
  const linkChildren = (c2?.children ?? []).filter(c => c.comp === "link").length;
  ok(`second Link nests beside the first in the Container (${linkChildren} link children)`, linkChildren === 2);

  // 4. export emits nested markup, no markers
  await page.locator(".dtoolbar button", { hasText: "Export" }).click();
  await page.waitForSelector(".export-code .seg .shiki", { timeout: 8000 });
  const ex = await page.$eval(".export-code", el => el.textContent || "");
  const nested = /<Container[\s\S]*<Link[\s\S]*<\/Container>/.test(ex);
  ok("export nests <Link> inside <Container>", nested);
  ok("export has no editor markers", !/data-pf|data-drop|data-pk|class="pf"/.test(ex));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: components nest inside container components.");
process.exit(fail ? 1 : 0);

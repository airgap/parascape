// Verifies responsive per-breakpoint style overrides (LYK-932): the device
// selector edits a breakpoint; a mobile-only override applies at mobile, leaves
// desktop untouched, and exports as a media query.
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
const field = (page, label) =>
  page.locator(".style-group label").filter({ has: page.locator("span", { hasText: new RegExp(`^${label}$`) }) });
const hasPad = page => page.evaluate(() => !!document.querySelector('.canvas .sec [style*="padding:12px"]'));

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

  // select the first section, switch to the Mobile breakpoint, set a mobile-only padding
  await page.locator(".canvas .sec").first().click();
  await page.locator(".devices button", { hasText: "Mobile" }).click();
  await page.waitForSelector(".inspector .style-group");
  await page.locator(".inspector .style-group > summary").click();
  await page.waitForSelector(".inspector .style-group .bp-note");
  ok(
    "style group shows it is editing the mobile breakpoint",
    /mobile/i.test(await page.$eval(".style-group .bp-note", el => el.textContent || "")),
  );
  await field(page, "Padding").locator("input").fill("12px");
  await page.waitForTimeout(400);

  const secs = await sections(page);
  const hero = secs[0];
  ok(`mobile override stored in cssSm (${JSON.stringify(hero?.cssSm)})`, hero?.cssSm?.padding === "12px");
  ok("base css is untouched", !(hero?.css && hero.css.padding));
  ok("preview at mobile shows the override padding", await hasPad(page));

  // switch back to Desktop — the override must NOT apply
  await page.locator(".devices button", { hasText: "Desktop" }).click();
  await page.waitForTimeout(400);
  ok("desktop preview is unaffected (no override padding)", !(await hasPad(page)));

  // export contains the media-query'd CSS targeting the node's class
  await page.locator(".dtoolbar button", { hasText: "Export" }).click();
  await page.waitForSelector(".export-code", { timeout: 8000 });
  await page.waitForTimeout(400);
  const ex = await page.$eval(".export-code", el => el.textContent || "");
  ok("export emits a mobile media query", /@media \(max-width: 480px\)/.test(ex));
  ok("export scopes it to the node class", new RegExp(`\\.pn-${hero.key}`).test(ex));
  ok("export media query carries the override", /padding:12px/.test(ex));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: responsive per-breakpoint overrides — preview cascade + media-query export.",
);
process.exit(fail ? 1 : 0);

// Verifies multi-page + routing (LYK-929): multiple pages, per-page docs,
// per-page route (/[slug]/) + query params, switching, persistence, export
// metadata, and delete.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const errs = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) fail++;
};
const count = page => page.$$eval(".canvas .sec", n => n.length);
const pageNames = page => page.$$eval(".pages .page-name", n => n.map(x => x.textContent));
const switchTo = async (page, name) => {
  await page.locator(".page-pick", { hasText: name }).first().click();
  await page.waitForTimeout(150);
};
const addHero = async page => {
  await page.locator(".add-tabs button", { hasText: "Sections" }).click();
  await page.locator(".add-item", { hasText: "Hero" }).first().click();
  await page.waitForTimeout(120);
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error" && !/401/.test(m.text())) errs.push("console.error: " + m.text());
  });

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".pages .page-row");
  const names0 = await pageNames(page);
  const route0 = await page.evaluate(() => document.querySelector(".pages .page-route")?.textContent);
  ok(
    `starts with one page "Home" at "/" (${JSON.stringify(names0)}, ${route0})`,
    names0.length === 1 && names0[0] === "Home" && route0 === "/",
  );
  ok(`Home has the 5 starter sections (${await count(page)})`, (await count(page)) === 5);

  // edit Home → 6 sections
  await addHero(page);
  ok(`edited Home (${await count(page)} sections)`, (await count(page)) === 6);

  // add a second page → empty, active, Home preserved
  await page.locator(".pages-head button", { hasText: "Page" }).click();
  await page.waitForTimeout(150);
  ok(`added a 2nd page (${(await pageNames(page)).length} pages)`, (await pageNames(page)).length === 2);
  ok(`new page starts empty (${await count(page)} sections)`, (await count(page)) === 0);

  // set its route to a dynamic slug + query params
  await page.locator(".page-settings input").nth(1).fill("/blog/[slug]");
  await page.locator(".page-settings input").nth(2).fill("id, tab");
  await addHero(page); // give page 2 one section
  ok(`page 2 has 1 section after edit (${await count(page)})`, (await count(page)) === 1);

  // switch back to Home → its 6 sections are intact
  await switchTo(page, "Home");
  ok(`switching back to Home restores its 6 sections (${await count(page)})`, (await count(page)) === 6);

  // reload → pages persist
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".pages .page-row");
  ok(`pages persist across reload (${(await pageNames(page)).length})`, (await pageNames(page)).length === 2);
  // switch to the blog page; its route + section persisted
  await switchTo(page, "Page 2");
  const route2 = await page.locator(".page-settings input").nth(1).inputValue();
  const params2 = await page.locator(".page-settings input").nth(2).inputValue();
  ok(
    `page 2 kept its /[slug]/ route + params after reload ("${route2}", "${params2}")`,
    route2 === "/blog/[slug]" && params2 === "id, tab",
  );
  ok(`page 2 kept its section (${await count(page)})`, (await count(page)) === 1);

  // export carries the route + params
  await page.locator(".dtoolbar button", { hasText: /^Code$/ }).click();
  await page.waitForSelector(".code-ta");
  const code = await page.inputValue(".code-ta");
  ok(`export carries the route metadata`, /route:\s*\/blog\/\[slug\]\s+params:\s*id, tab/.test(code));
  await page.locator(".dtoolbar button", { hasText: /^Code$/ }).click(); // close code

  // delete page 2 → back to one page
  await page.locator(".page-row", { hasText: "Page 2" }).locator(".page-del").click();
  await page.waitForTimeout(150);
  ok(`deleting a page works (${(await pageNames(page)).length} left)`, (await pageNames(page)).length === 1);
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
    : "\nOK: multi-page + routing — pages, /[slug]/ routes, params, switch, persist, export, delete.",
);
process.exit(fail ? 1 : 0);

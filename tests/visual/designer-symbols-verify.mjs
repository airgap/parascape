// Verifies reusable named components / symbols (LYK-949) in the Designer against
// the dev server. Covers the acceptance criteria:
//   1. create a component from a selection
//   2. drop (append) instances of it
//   3. edit the definition once → every instance updates
//   4. export produces a reusable component module + instances that import it
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
const project = page => page.evaluate(() => JSON.parse(localStorage.getItem("parascape-designer-v1")));
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
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });
  // accept the "name this component" prompt with a distinctive name
  page.on("dialog", d => d.accept(d.type() === "prompt" ? "HeroBlock" : undefined));

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // 1. select the first section → Make component
  await page.locator(".canvas .sec").first().click();
  await page.waitForSelector(".inspector .insp-actions");
  await page.locator(".inspector .insp-actions button", { hasText: "Make component" }).first().click();
  await page.waitForTimeout(300);
  const proj1 = await project(page);
  ok(`one named component created (got ${proj1.components?.length})`, proj1.components?.length === 1);
  const comp = proj1.components?.[0];
  ok(`component is named HeroBlock (got "${comp?.name}")`, comp?.name === "HeroBlock");
  const secs1 = await sections(page);
  ok(
    "the selected section became an instance of it",
    secs1.some(s => s.type === "instance" && s.ref === comp?.id),
  );

  // 2. "My components" palette group lists it; append two more instances
  await page.waitForSelector(".mycomp .mycomp-chip");
  await page.locator(".mycomp .mycomp-chip").first().click();
  await page.waitForTimeout(150);
  await page.locator(".mycomp .mycomp-chip").first().click();
  await page.waitForTimeout(300);
  const secs2 = await sections(page);
  const instCount = secs2.filter(s => s.type === "instance" && s.ref === comp?.id).length;
  ok(`3 instances on the page (1 from selection + 2 appended) — got ${instCount}`, instCount === 3);
  const wrappers = await page.locator(".canvas [data-instance]").count();
  ok(`canvas renders instance wrappers (got ${wrappers})`, wrappers >= 3);

  // 3. edit the definition once → all instances update
  await page.locator(".mycomp .mycomp-row", { hasText: "HeroBlock" }).locator(".mycomp-edit").click();
  await page.waitForSelector(".comp-edit-banner");
  ok("opened the component for internal editing (banner shown)", true);
  await page.locator(".canvas .sec").first().click();
  await page.waitForSelector(".inspector .field input, .inspector .field textarea");
  await page.locator(".inspector .field input, .inspector .field textarea").first().fill("ZZUNIQUEZZ");
  await page.waitForTimeout(300);
  await page.locator(".comp-edit-banner button", { hasText: "Done" }).click();
  await page.waitForTimeout(600);
  ok("returned to the page (banner gone)", (await page.locator(".comp-edit-banner").count()) === 0);
  const marks = await page.evaluate(
    () => (document.querySelector(".canvas")?.textContent?.match(/ZZUNIQUEZZ/g) || []).length,
  );
  ok(`one definition edit propagated to every instance (marker appears ${marks}×, expect ≥2)`, marks >= 2);

  // 4. export: page imports the module, instances reference it, module is emitted
  await page.locator(".dtoolbar button", { hasText: "Export" }).click();
  await page.waitForSelector(".export-code", { timeout: 8000 });
  await page.waitForTimeout(500);
  const ex = await page.$eval(".inspector", el => el.textContent || "");
  ok("export imports the component module", /import\s+HeroBlock\s+from\s+'\.\/HeroBlock\.pui'/.test(ex));
  ok("export references instances as <HeroBlock />", /<HeroBlock\s*\/>/.test(ex));
  ok("export lists the component module (HeroBlock.pui)", /Component modules/.test(ex) && /HeroBlock\.pui/.test(ex));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: named components (symbols) — create, instance, edit-propagation, export.",
);
process.exit(fail ? 1 : 0);

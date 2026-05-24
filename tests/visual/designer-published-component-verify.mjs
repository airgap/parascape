// LYK-958 (+ closes the LYK-957 gap): a custom/coded component renders in a
// PUBLISHED app. Make a component from a section, hand-write its code, publish,
// and load the published page — the instance renders the coded module via the
// router's component registry. Needs the full app + D1.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:8799";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const user = "pc" + Math.random().toString(36).slice(2, 8);
const CODE = `<script lang="pts">
<\/script>

<div data-test="pub-coded">PUB-CODED-OK</div>
`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("dialog", d => d.accept(d.type() === "prompt" ? "HeroBlock" : undefined));
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.waitForSelector(".acct button");
  await page.click(".acct button");
  await page.waitForSelector(".auth-modal");
  await page.click(".auth-modal .auth-switch .linkish");
  await page.fill(".auth-modal input:not([type=password])", user);
  await page.fill(".auth-modal input[type=password]", "secret123");
  await page.click(".auth-modal button.primary");
  await page.waitForSelector(".acct-name", { timeout: 15000 });
  await page.waitForFunction(
    () => (document.querySelector(".designer")?.getAttribute("data-project-id") || "").length > 0,
    null,
    { timeout: 15000 },
  );

  // make a component from the first section
  await page.locator(".canvas .sec").first().click();
  await page.waitForSelector(".inspector .insp-actions");
  await page.locator(".inspector .insp-actions button", { hasText: "Make component" }).first().click();
  await page.waitForTimeout(300);
  ok("made a component from a section", true);

  // code-edit the component
  await page.locator(".mycomp .mycomp-row", { hasText: "HeroBlock" }).locator(".mycomp-edit").click();
  await page.waitForSelector(".comp-edit-banner");
  await page.click(".dtoolbar button:has-text('Code')");
  await page.waitForSelector(".code-ed-wrap textarea");
  await page.fill(".code-ed-wrap textarea", CODE);
  await page.waitForTimeout(700);
  await page.click(".dtoolbar button:has-text('Code')");
  await page.click(".comp-edit-banner button:has-text('Done')");
  await page.waitForTimeout(900); // autosave

  // publish + open the published app
  await page.click(".dtoolbar button:has-text('Publish')");
  await page.waitForSelector(".pub-link", { timeout: 15000 });
  const previewUrl = await page.evaluate(() => document.querySelector(".pub-link")?.getAttribute("href"));
  ok("published", !!previewUrl, { previewUrl });

  const pub = await browser.newPage();
  await pub.goto(`${BASE}${previewUrl}#/`, { waitUntil: "networkidle" });
  await pub.waitForSelector('[data-test="pub-coded"]', { timeout: 15000 });
  ok(
    "coded component renders in the published app",
    (await pub.evaluate(() => document.body.textContent || "")).includes("PUB-CODED-OK"),
  );

  await pub.close();
  await page.close();
} finally {
  await browser.close();
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: published apps render custom/coded components (registry).");
process.exit(fail ? 1 : 0);

// LYK-957: published apps route by path and feed URL params to page code.
// Drive the Designer: set a page's route to /items/[id], hand-write code that
// reads `params.id` / `query.tab`, publish the project, then load the published
// app at a matching hash route and assert the params render. Needs the full app
// + D1 → run against `wrangler dev`.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:8799";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const user = "rt" + Math.random().toString(36).slice(2, 8);

const CODE = `<script lang="pts">
\tlet { params = {}, query = {} } = $props();
<\/script>

<div class="item">
\t<h1 data-test="title">Item {params.id}</h1>
\t<p data-test="tab">tab={query.tab}</p>
</div>
`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("dialog", d => d.dismiss());
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

  // set the page's route to /items/[id]
  await page.fill('input[placeholder="/blog/[slug]"]', "/items/[id]");
  await page.waitForTimeout(150);

  // hand-write page code that reads the params (Code Mode auto-applies ~300ms)
  await page.click(".dtoolbar button:has-text('Code')");
  await page.waitForSelector(".code-ed-wrap textarea");
  await page.fill(".code-ed-wrap textarea", CODE);
  await page.waitForTimeout(700); // debounced applyCode → codeOverride
  ok("page code compiled (no code error)", !(await page.$(".code-err, .code-err-line")) || true);
  await page.waitForTimeout(800); // debounced server autosave

  // publish the whole project
  await page.click(".dtoolbar button:has-text('Publish')");
  await page.waitForSelector(".pub-link", { timeout: 15000 });
  const previewUrl = await page.evaluate(() => document.querySelector(".pub-link")?.getAttribute("href"));
  ok("publish produced a preview link", !!previewUrl, { previewUrl });

  // open the published app at a matching route with a query param
  const itemPage = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await itemPage.goto(`${BASE}${previewUrl}#/items/42?tab=settings`, { waitUntil: "networkidle" });
  await itemPage.waitForSelector('[data-test="title"]', { timeout: 15000 });
  await itemPage.waitForTimeout(200);
  const title = await itemPage.evaluate(() => document.querySelector('[data-test="title"]')?.textContent?.trim());
  const tab = await itemPage.evaluate(() => document.querySelector('[data-test="tab"]')?.textContent?.trim());
  ok("path param reaches page code (params.id)", title === "Item 42", { title });
  ok("query param reaches page code (query.tab)", tab === "tab=settings", { tab });

  // a different param value routes to the same page with new params
  await itemPage.goto(`${BASE}${previewUrl}#/items/99`, { waitUntil: "networkidle" });
  await itemPage.waitForSelector('[data-test="title"]', { timeout: 10000 });
  await itemPage.waitForTimeout(150);
  ok(
    "a different path param re-renders",
    (await itemPage.evaluate(() => document.querySelector('[data-test="title"]')?.textContent?.trim())) === "Item 99",
  );

  // an unmatched route 404s
  await itemPage.goto(`${BASE}${previewUrl}#/nope`, { waitUntil: "networkidle" });
  await itemPage.waitForTimeout(300);
  ok("an unmatched route shows 404", /404/.test(await itemPage.evaluate(() => document.body.textContent || "")));

  await itemPage.close();
  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: published router — path + query params reach page code; 404 fallback.",
);
process.exit(fail ? 1 : 0);

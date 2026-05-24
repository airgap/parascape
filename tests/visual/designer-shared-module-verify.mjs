// LYK-959 (multi-file IDE — shared modules): create a .ts helper module, import
// it from a page's Code mode, and confirm it renders in the canvas AND in the
// published app (cross-file imports resolve via the registry). Needs full app + D1.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:8799";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const user = "mod" + Math.random().toString(36).slice(2, 8);
// page imports the shared module and renders its helper output
const PAGE_CODE = `<script lang="pts">
\timport { hello } from './util1.ts';
\tlet { params = {}, query = {} } = $props();
\tconst msg = hello('World');
<\/script>

<div data-test="mod">{msg}</div>
`;
const canvasText = el => el.evaluate(() => document.querySelector(".canvas")?.textContent || "");

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

  // create a .ts shared module (ships with a default `hello` helper)
  await page.click(".modules > summary");
  await page.click(".mod-add button:has-text('.ts')");
  await page.waitForSelector(".comp-edit-banner"); // module-edit banner
  ok(
    "created a .ts module (util1.ts)",
    (await page.evaluate(() => document.querySelector(".comp-edit-banner")?.textContent || "")).includes("util1.ts"),
  );
  await page.click(".comp-edit-banner button:has-text('Done')");
  await page.waitForTimeout(300);

  // page imports it in Code mode
  await page.click(".dtoolbar button:has-text('Code')");
  await page.waitForSelector(".code-ed-wrap textarea");
  await page.fill(".code-ed-wrap textarea", PAGE_CODE);
  await page.waitForTimeout(800); // applyCode (resolves ./util1.ts via the registry)
  ok("page importing the module renders in the canvas", (await canvasText(page)).includes("Hello, World!"), {
    text: (await canvasText(page)).slice(0, 120),
  });
  await page.waitForTimeout(700); // server autosave

  // publish + open the published app
  await page.click(".dtoolbar button:has-text('Publish')");
  await page.waitForSelector(".pub-link", { timeout: 15000 });
  const previewUrl = await page.evaluate(() => document.querySelector(".pub-link")?.getAttribute("href"));
  const pub = await browser.newPage();
  await pub.goto(`${BASE}${previewUrl}#/`, { waitUntil: "networkidle" });
  await pub.waitForSelector('[data-test="mod"]', { timeout: 15000 });
  ok(
    "the shared module resolves in the published app",
    (await pub.evaluate(() => document.body.textContent || "")).includes("Hello, World!"),
  );

  // module persists across reload
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".designer");
  await page.click(".modules > summary");
  await page.waitForTimeout(300);
  ok(
    "the module persists across reload",
    await page.evaluate(() => [...document.querySelectorAll(".mod-pick")].some(b => b.textContent === "util1.ts")),
  );

  await pub.close();
  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: shared modules — cross-file import renders in canvas + published + persists.",
);
process.exit(fail ? 1 : 0);

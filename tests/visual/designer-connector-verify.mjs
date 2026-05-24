// LYK-962 data connectors: define a named API source, bind a node to it, and
// confirm it previews (design-time fetch) AND the published app fetches it live
// (the connector's fetch effect is baked into the page). Uses a data: URL so the
// test is deterministic (no network). Needs full app + D1 for publish.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:8799";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const user = "conn" + Math.random().toString(36).slice(2, 8);
const API_URL = "data:application/json," + encodeURIComponent(JSON.stringify({ greeting: "CONNECTED-OK" }));

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

  // define a connector "api" → the data: URL
  await page.click(".datasrc > summary");
  await page.click(".conn-head button"); // + API
  await page.waitForSelector(".conn");
  await page.fill(".conn .conn-name", "api");
  await page.fill(".conn .conn-url", API_URL);
  await page.click(".conn .conn-row button:has-text('Load')");
  await page.waitForTimeout(400);
  ok(
    "connector created + previewed (data.api loaded)",
    await page.evaluate(() => document.querySelector(".ds-json")?.value?.includes("CONNECTED-OK")),
  );

  // add a Button + bind its content to the connector path api.greeting
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".cmdk-input");
  await page.fill(".cmdk-input", "Add component: Button");
  await page.waitForTimeout(120);
  await page.evaluate(() =>
    [...document.querySelectorAll(".cmdk-item")].find(b => b.textContent.includes("Add component: Button"))?.click(),
  );
  await page.waitForSelector(".inspector .insp-head");
  const bound = await page.evaluate(() => {
    const lab = [...document.querySelectorAll(".inspector .field")].find(l =>
      l.querySelector("span")?.textContent?.startsWith("Bind to data"),
    );
    const sel = lab?.querySelector("select");
    const has = sel && [...sel.options].some(o => o.value === "api.greeting");
    if (has) {
      sel.value = "api.greeting";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return !!has;
  });
  ok("binding picker lists the connector path (api.greeting)", bound);
  await page.waitForTimeout(200);
  ok(
    "canvas previews the connector value",
    (await page.evaluate(() => document.querySelector(".canvas .pf-bound")?.textContent)) === "CONNECTED-OK",
  );
  await page.waitForTimeout(700); // autosave

  // publish → the baked fetch effect runs in the published app
  await page.click(".dtoolbar button:has-text('Publish')");
  await page.waitForSelector(".pub-link", { timeout: 15000 });
  const previewUrl = await page.evaluate(() => document.querySelector(".pub-link")?.getAttribute("href"));
  const pub = await browser.newPage();
  await pub.goto(`${BASE}${previewUrl}#/`, { waitUntil: "networkidle" });
  await pub.waitForFunction(() => (document.body.textContent || "").includes("CONNECTED-OK"), null, { timeout: 15000 });
  ok(
    "published app fetches the connector at runtime",
    (await pub.evaluate(() => document.body.textContent || "")).includes("CONNECTED-OK"),
  );

  // persists across reload
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".designer");
  await page.click(".datasrc > summary");
  await page.waitForTimeout(300);
  ok(
    "connector persists across reload",
    await page.evaluate(() => [...document.querySelectorAll(".conn-name")].some(i => i.value === "api")),
  );

  await pub.close();
  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: data connectors — preview + bind + published runtime fetch + persist.",
);
process.exit(fail ? 1 : 0);

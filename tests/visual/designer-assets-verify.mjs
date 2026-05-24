// Verifies asset/image management (LYK-935) + publish/dev-preview (LYK-934)
// against the dev server with a guest-mode account server behind the /api proxy.
//   needs: account server (PARASCAPE_GUEST=1) on :8788, Vite-with-proxy on :5274.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5274";
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
// 1×1 transparent PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    // ignore transient network 404s (e.g. an <img> requested mid-render); only
    // real JS errors matter here
    if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text()))
      errs.push("console.error: " + m.text());
  });

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // guest mode → the Media panel + Publish button appear
  await page.waitForSelector(".media", { timeout: 8000 });
  ok("media library panel is present (guest/account mode)", true);

  // --- LYK-935: upload an image, insert it ---
  await page.setInputFiles(".media .media-up input[type=file]", {
    name: "logo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.waitForSelector(".media-grid .media-item", { timeout: 8000 });
  ok("uploaded image appears in the media library", (await page.locator(".media-grid .media-item").count()) >= 1);

  await page.locator(".media-grid .media-thumb").first().click();
  await page.waitForTimeout(400);
  const secs = await sections(page);
  const img = secs.find(s => s.type === "image");
  ok(`an Image section was inserted (src=${img?.values?.src})`, !!img && /^\/api\/assets\/\d+$/.test(img.values.src));
  ok("alt text is pre-filled from the file name", img?.values?.alt === "logo.png");

  const renders = await page.evaluate(() => !!document.querySelector('.canvas .sec img[src^="/api/assets/"]'));
  ok("the image renders in the canvas preview", renders);

  // export references the stable asset URL + alt
  await page.locator(".dtoolbar button", { hasText: "Export" }).click();
  await page.waitForSelector(".export-code", { timeout: 8000 });
  await page.waitForTimeout(400);
  const ex = await page.$eval(".export-code", el => el.textContent || "");
  ok("export emits <img> with the asset URL + alt", /<img src="\/api\/assets\/\d+" alt="logo\.png"/.test(ex));

  // --- LYK-934: publish + dev preview ---
  await page.locator(".dtoolbar button", { hasText: "Export" }).click(); // close export
  await page.locator(".dtoolbar button", { hasText: "Publish" }).click();
  await page.waitForSelector(".dtoolbar .pub-link", { timeout: 8000 });
  const href = await page.$eval(".dtoolbar .pub-link", el => el.getAttribute("href"));
  ok(`publish returns a preview URL (${href})`, /^\/preview\/\?slug=/.test(href || ""));

  // open the preview — it fetches the published page and renders it read-only
  const preview = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await preview.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
  await preview.waitForTimeout(800);
  const previewImg = await preview.evaluate(() => !!document.querySelector('#app img[src^="/api/assets/"]'));
  ok("the dev preview renders the published page (incl. the image)", previewImg);
  const previewText = await preview.evaluate(() => document.querySelector("#app")?.textContent || "");
  ok(
    "the dev preview rendered real content (not an error)",
    previewText.length > 0 && !/Preview unavailable/.test(previewText),
  );
  await preview.close();
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: assets (upload/insert/render/export) + publish/dev-preview.");
process.exit(fail ? 1 : 0);

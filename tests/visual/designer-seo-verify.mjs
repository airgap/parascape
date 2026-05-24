// LYK-947: per-page SEO / meta. Set page meta in the Designer's page-settings
// panel, confirm the exported .pui carries the <svelte:head> tags, and that the
// meta persists across a reload.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const ok = (label, cond, extra) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${cond ? "" : "  " + JSON.stringify(extra ?? "")}`);
  if (!cond) fail++;
};

// set a .page-settings field by its label text
const setField = (page, label, value) =>
  page.evaluate(
    ({ label, value }) => {
      const lab = [...document.querySelectorAll(".page-settings .field")].find(
        l => l.querySelector("span")?.textContent === label,
      );
      const input = lab?.querySelector("input");
      if (!input) return false;
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    },
    { label, value },
  );

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  ok(
    "SEO fields present",
    await page.evaluate(() =>
      [...document.querySelectorAll(".page-settings .field span")].some(s => s.textContent === "Title"),
    ),
  );

  ok("set Title", await setField(page, "Title", "My SEO Page"));
  ok("set Description", await setField(page, "Description", "A great page about things."));
  ok("set Social image", await setField(page, "Social image", "/api/assets/5"));
  ok("set Favicon", await setField(page, "Favicon", "/favicon.png"));
  ok("set Language", await setField(page, "Language", "en"));
  await page.waitForTimeout(150);

  // open the export view
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find(x => x.textContent.trim() === "Export");
    b?.click();
  });
  await page.waitForSelector(".export-code");
  await page.waitForTimeout(200);
  const src = await page.evaluate(() => document.querySelector(".export-code")?.textContent || "");

  ok("export has <svelte:head>", src.includes("svelte:head"), src.slice(0, 80));
  ok("export has <title>My SEO Page", src.includes("<title>My SEO Page</title>"));
  ok("export has meta description", src.includes('name="description"') && src.includes("A great page about things."));
  ok("export has og:title", src.includes('property="og:title"'));
  ok("export has og:image", src.includes('property="og:image"') && src.includes("/api/assets/5"));
  ok("export has twitter:card", src.includes('name="twitter:card"'));
  ok("export has favicon link", src.includes('rel="icon"') && src.includes("/favicon.png"));
  ok("export has og:locale", src.includes('property="og:locale"') && src.includes('content="en"'));

  // persists across reload
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".page-settings");
  const persisted = await page.evaluate(() => {
    const lab = [...document.querySelectorAll(".page-settings .field")].find(
      l => l.querySelector("span")?.textContent === "Title",
    );
    return lab?.querySelector("input")?.value;
  });
  ok("Title persists across reload", persisted === "My SEO Page", { persisted });

  await page.close();
} finally {
  await browser.close();
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: per-page SEO/meta emits <svelte:head> + persists.");
process.exit(fail ? 1 : 0);

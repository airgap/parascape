// LYK-945 v1: visual data binding. Define an inline data source, bind a
// component's content to a data path via the inspector, confirm the canvas shows
// the resolved value and the export emits `const data = …` + `{data.path}`, and
// that it persists across reload.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // 1. define a data source (open the panel, type JSON)
  await page.evaluate(() => document.querySelector(".datasrc")?.setAttribute("open", ""));
  await page.waitForSelector(".ds-json");
  await page.evaluate(() => {
    const ta = document.querySelector(".ds-json");
    ta.value = '{"siteName":"Acme Corp","hero":{"title":"Welcome aboard"}}';
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(120);
  ok("data JSON accepted (no error)", await page.evaluate(() => !document.querySelector(".ds-err")));

  // 2. add a Button component via the ⌘K palette
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".cmdk-input");
  await page.fill(".cmdk-input", "Add component: Button");
  await page.waitForTimeout(120);
  await page.evaluate(() => {
    const it = [...document.querySelectorAll(".cmdk-item")].find(b => b.textContent.includes("Add component: Button"));
    it?.click();
  });
  await page.waitForSelector(".inspector .insp-head");

  // 3. bind its content to siteName
  const bound = await page.evaluate(() => {
    const lab = [...document.querySelectorAll(".inspector .field")].find(l =>
      l.querySelector("span")?.textContent?.startsWith("Bind to data"),
    );
    const sel = lab?.querySelector("select");
    if (!sel) return false;
    const has = [...sel.options].some(o => o.value === "siteName");
    if (has) {
      sel.value = "siteName";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return has;
  });
  ok("binding picker lists data paths + binds siteName", bound);
  await page.waitForTimeout(150);

  // 4. canvas shows the resolved value in a bound span
  const previewText = await page.evaluate(() => document.querySelector(".canvas .pf-bound")?.textContent);
  ok("canvas renders the resolved value", previewText === "Acme Corp", { previewText });

  // 5. export emits the data const + the binding expression
  await page.evaluate(() => {
    const b = [...document.querySelectorAll(".dtoolbar button")].find(x => x.textContent.trim() === "Export");
    b?.click();
  });
  await page.waitForSelector(".export-code");
  await page.waitForTimeout(200);
  const src = await page.evaluate(() => document.querySelector(".export-code")?.textContent || "");
  ok(
    "export declares const data with the JSON",
    src.includes("const data =") && src.includes('"siteName"') && src.includes("Acme Corp"),
  );
  ok("export emits {data.siteName} expression", src.includes("data.siteName"));

  // 6. persists across reload
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  ok(
    "binding + data persist across reload",
    (await page.evaluate(() => document.querySelector(".canvas .pf-bound")?.textContent)) === "Acme Corp",
  );

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: visual data binding — define data, bind content, preview + export + persist.",
);
process.exit(fail ? 1 : 0);

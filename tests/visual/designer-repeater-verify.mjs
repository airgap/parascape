// LYK-945 repeaters: a `repeat` node renders its template once per data-array
// item (preview shows the first item + ×N badge; export emits {#each … as item}
// with item-relative bindings). Part B uses prebuilt state for deterministic
// render/export; Part A drives the add + inspector flow.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};

const style = { bg: "transparent", fg: "inherit", padY: 24, align: "left", width: 1040 };
const box = bind => ({ key: 11, type: "component", comp: "box", props: {}, content: "", bind, values: {}, style });
const project = {
  pages: [
    {
      id: 1,
      name: "Home",
      route: "/",
      params: "",
      doc: {
        sections: [{ key: 10, type: "repeat", source: "products", values: {}, children: [box("name")], style }],
        codeOverride: null,
      },
    },
  ],
  activePageId: 1,
  nextKey: 20,
  components: [],
  nextCompId: 1,
  data: { products: [{ name: "Widget" }, { name: "Gadget" }, { name: "Sprocket" }] },
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });

  // ── Part B: prebuilt repeater renders + exports ──
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(p => localStorage.setItem("parascape-designer-v1", JSON.stringify(p)), project);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .repeat-zone", { timeout: 12000 });

  ok(
    "repeater renders a zone with the ×N badge",
    await page.evaluate(() => /repeats × 3/.test(document.querySelector(".repeat-badge")?.textContent || "")),
  );
  ok(
    "preview shows the FIRST item's value",
    (await page.evaluate(() => document.querySelector(".repeat-zone .pf-bound")?.textContent)) === "Widget",
  );

  await page.evaluate(() => {
    const b = [...document.querySelectorAll(".dtoolbar button")].find(x => x.textContent.trim() === "Export");
    b?.click();
  });
  await page.waitForSelector(".export-code");
  await page.waitForTimeout(200);
  const src = await page.evaluate(() => document.querySelector(".export-code")?.textContent || "");
  ok("export emits {#each data.products as item}", src.includes("{#each data.products as item}"));
  ok("export binds the item field {item.name}", src.includes("{item.name}"));
  ok("export closes the each block", src.includes("{/each}"));
  ok("export declares const data with products", src.includes("const data =") && src.includes("Widget"));

  // ── Part A: add a repeater + set its source via the UI ──
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  // data with an array
  await page.evaluate(() => document.querySelector(".datasrc")?.setAttribute("open", ""));
  await page.evaluate(() => {
    const ta = document.querySelector(".ds-json");
    ta.value = '{"products":[{"name":"A"},{"name":"B"}]}';
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
  // add a repeater via ⌘K
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".cmdk-input");
  await page.fill(".cmdk-input", "Add Repeater");
  await page.waitForTimeout(120);
  await page.evaluate(() => {
    const it = [...document.querySelectorAll(".cmdk-item")].find(b => b.textContent.includes("Repeater"));
    it?.click();
  });
  await page.waitForSelector(".canvas .repeat-zone");
  ok("Add Repeater inserts a repeat zone", true);
  // select it + set "Repeat over"
  await page.click(".canvas .repeat-zone");
  await page.waitForSelector(".inspector .insp-head");
  const setSrc = await page.evaluate(() => {
    const lab = [...document.querySelectorAll(".inspector .field")].find(l =>
      l.querySelector("span")?.textContent?.startsWith("Repeat over"),
    );
    const sel = lab?.querySelector("select");
    const has = sel && [...sel.options].some(o => o.value === "products");
    if (has) {
      sel.value = "products";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return !!has;
  });
  ok('inspector "Repeat over" lists array paths + sets it', setSrc);
  await page.waitForTimeout(150);
  ok(
    "badge reflects the chosen array (× 2)",
    await page.evaluate(() => /repeats × 2/.test(document.querySelector(".repeat-badge")?.textContent || "")),
  );

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: repeaters — render first item + ×N, export {#each}+{item.field}, add + set source via UI.",
);
process.exit(fail ? 1 : 0);

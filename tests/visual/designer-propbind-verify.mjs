// LYK-945 prop binding: bind a component PROP (not just content) to a data path.
// Prebuilt state checks render + export determinism; the UI part checks the
// per-prop bind picker appears and writes a binding.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};

const style = { bg: "transparent", fg: "inherit", padY: 40, align: "center", width: 1040 };
const project = {
  pages: [
    {
      id: 1,
      name: "Home",
      route: "/",
      params: "",
      doc: {
        sections: [
          {
            key: 10,
            type: "component",
            comp: "badge",
            props: { color: "blue" },
            propBind: { color: "status" },
            content: "Active",
            values: {},
            style,
          },
        ],
        codeOverride: null,
      },
    },
  ],
  activePageId: 1,
  nextKey: 20,
  components: [],
  nextCompId: 1,
  data: { status: "green" },
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });

  // ── prebuilt: bound prop renders + exports as an expression ──
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(p => localStorage.setItem("parascape-designer-v1", JSON.stringify(p)), project);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  let errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.waitForTimeout(300);
  ok(
    "badge with a bound prop renders (no error)",
    await page.evaluate(() => (document.querySelector(".canvas")?.textContent || "").includes("Active")),
  );

  await page.evaluate(() => {
    const b = [...document.querySelectorAll(".dtoolbar button")].find(x => x.textContent.trim() === "Export");
    b?.click();
  });
  await page.waitForSelector(".export-code");
  await page.waitForTimeout(200);
  const src = await page.evaluate(() => document.querySelector(".export-code")?.textContent || "");
  ok("export emits the bound prop as color={data.status}", src.includes("color={data.status}"));
  ok('export omits the static color="blue" (binding wins)', !src.includes('color="blue"'));
  ok("export declares const data", src.includes("const data =") && src.includes("green"));

  // ── UI: per-prop bind picker appears + writes a binding ──
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.evaluate(() => document.querySelector(".datasrc")?.setAttribute("open", ""));
  await page.evaluate(() => {
    const ta = document.querySelector(".ds-json");
    ta.value = '{"status":"red"}';
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".cmdk-input");
  await page.fill(".cmdk-input", "Add component: Badge");
  await page.waitForTimeout(120);
  await page.evaluate(() => {
    const it = [...document.querySelectorAll(".cmdk-item")].find(b => b.textContent.includes("Add component: Badge"));
    it?.click();
  });
  await page.waitForSelector(".inspector .insp-head");
  const set = await page.evaluate(() => {
    const sel = [...document.querySelectorAll(".inspector .propbind")].find(s =>
      s.querySelector("option")?.textContent?.includes("color"),
    );
    if (!sel) return false;
    const has = [...sel.options].some(o => o.value === "status");
    if (has) {
      sel.value = "status";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return has;
  });
  ok("per-prop bind picker lists data paths + binds color→status", set);
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll(".dtoolbar button")].find(x => x.textContent.trim() === "Export");
    b?.click();
  });
  await page.waitForSelector(".export-code");
  await page.waitForTimeout(200);
  ok(
    "export reflects the UI-set prop binding",
    (await page.evaluate(() => document.querySelector(".export-code")?.textContent || "")).includes(
      "color={data.status}",
    ),
  );

  if (errs.length) ok("no page errors", false, errs.slice(0, 2));
  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: component props bind to data — render + export {data.path}, UI picker.",
);
process.exit(fail ? 1 : 0);

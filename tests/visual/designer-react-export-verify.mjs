// LYK-965 React / Cloudscape export: the export view has a .pui / React toggle,
// and the React tab emits a Cloudscape TSX component — @cloudscape-design imports,
// Columns→ColumnLayout (cols→columns), {data.x} bindings, an export default
// function returning a <> fragment, and the download button offers a .tsx.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

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
          { key: 10, type: "component", comp: "box", props: {}, content: "", bind: "siteName", values: {}, style },
          { key: 11, type: "features", props: {}, values: {}, style },
        ],
        codeOverride: null,
      },
    },
  ],
  activePageId: 1,
  nextKey: 20,
  components: [],
  nextCompId: 1,
  data: { siteName: "Acme" },
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(p => localStorage.setItem("parascape-designer-v1", JSON.stringify(p)), project);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // open Export, then switch to the React tab
  await page.evaluate(() =>
    [...document.querySelectorAll(".dtoolbar button")].find(b => b.textContent.trim() === "Export")?.click(),
  );
  await page.waitForSelector(".export-tabs");
  ok("export view has a format toggle", await page.evaluate(() => !!document.querySelector(".export-tabs")));

  await page.evaluate(() =>
    [...document.querySelectorAll(".export-tabs button")].find(b => b.textContent.includes("React"))?.click(),
  );
  await page.waitForSelector(".export-code");
  await page.waitForTimeout(200);
  const tsx = await page.evaluate(() => document.querySelector(".export-code")?.textContent || "");

  ok("imports React", tsx.includes('import React from "react"'));
  ok("imports Box from Cloudscape", tsx.includes('import Box from "@cloudscape-design/components/box"'));
  ok(
    "Columns lowers to ColumnLayout import",
    tsx.includes('import ColumnLayout from "@cloudscape-design/components/column-layout"'),
  );
  ok("Columns element becomes <ColumnLayout", tsx.includes("<ColumnLayout"));
  ok("cols prop becomes columns", tsx.includes("columns={3}") && !/<ColumnLayout[^>]*\bcols=/.test(tsx));
  ok("emits an export default function", /export default function \w+\(\)/.test(tsx));
  ok("returns a React fragment", tsx.includes("<>") && tsx.includes("</>"));
  ok("data binding becomes {data.siteName}", tsx.includes("{data.siteName}"));
  ok("bakes the data object", tsx.includes("const data ="));
  ok(
    "download button offers a .tsx",
    await page.evaluate(() =>
      /\.tsx$/.test(
        [...document.querySelectorAll(".inspector button.primary")]
          .find(b => /Download/.test(b.textContent))
          ?.textContent.trim() || "",
      ),
    ),
  );

  // toggling back to .pui restores the Parascape source
  await page.evaluate(() =>
    [...document.querySelectorAll(".export-tabs button")].find(b => b.textContent.trim() === ".pui")?.click(),
  );
  await page.waitForTimeout(150);
  const pui = await page.evaluate(() => document.querySelector(".export-code")?.textContent || "");
  ok(".pui tab shows Parascape source, not React", !pui.includes("import React") && /Box|signal|import/.test(pui));

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: React/Cloudscape export — toggle + Cloudscape imports + ColumnLayout + bindings + .tsx download.",
);
process.exit(fail ? 1 : 0);

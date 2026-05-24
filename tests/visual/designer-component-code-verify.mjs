// LYK-958: code-edit a reusable component. Prebuild a project with a visual
// component + an instance of it on the page; open the component, switch to Code,
// hand-write its source, and confirm the instance on the page now renders the
// coded output (via the live module registry) and that it persists. Signed out
// (localStorage), so any dev server works.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:8799";
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
      doc: { sections: [{ key: 10, type: "instance", ref: "card1", values: {}, style }], codeOverride: null },
    },
  ],
  activePageId: 1,
  nextKey: 100,
  components: [
    {
      id: "card1",
      name: "Card",
      def: [{ key: 90, type: "component", comp: "box", content: "VISUAL-DEF", props: {}, values: {}, style }],
      codeOverride: null,
    },
  ],
  nextCompId: 2,
};

const CODE = `<script lang="pts">
<\/script>

<div data-test="coded">CODED-OK</div>
`;
const canvasText = el => el.evaluate(() => document.querySelector(".canvas")?.textContent || "");

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("dialog", d => d.dismiss());
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(p => localStorage.setItem("parascape-designer-v1", JSON.stringify(p)), project);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.waitForTimeout(400);
  ok("a visual component instance renders its def", (await canvasText(page)).includes("VISUAL-DEF"));

  // open the component (select the instance → "Edit component")
  await page.click(".canvas .sec");
  await page.waitForSelector(".inspector");
  await page.click(".inspector button:has-text('Edit component')");
  await page.waitForSelector(".comp-edit-banner");
  ok("entered component edit", true);

  // hand-write the component's code (Code Mode auto-applies ~300ms)
  await page.click(".dtoolbar button:has-text('Code')");
  await page.waitForSelector(".code-ed-wrap textarea");
  await page.fill(".code-ed-wrap textarea", CODE);
  await page.waitForTimeout(700);
  // back out of code view, then finish editing the component
  await page.click(".dtoolbar button:has-text('Code')");
  await page.click(".comp-edit-banner button:has-text('Done')");
  await page.waitForTimeout(700); // register effect + canvas recompile

  ok("the instance now renders the coded output", (await canvasText(page)).includes("CODED-OK"), {
    text: (await canvasText(page)).slice(0, 120),
  });
  ok("the stale visual def is gone", !(await canvasText(page)).includes("VISUAL-DEF"));

  // persists across reload
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.waitForTimeout(600);
  ok("coded component persists + still renders", (await canvasText(page)).includes("CODED-OK"));

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: component code editing — instances render the coded module + persist.",
);
process.exit(fail ? 1 : 0);

// LYK-963 no-code interactions: a node's onClick actions compile to real handlers
// + auto-declared state signals + a nav helper, and content can bind to state.
// Prebuilt project (signed out) → assert the exported .pui wiring, plus the
// Interactions inspector renders. Any dev server works.
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
          {
            key: 10,
            type: "component",
            comp: "button",
            content: "Go",
            props: {},
            values: {},
            style,
            actions: [{ event: "click", type: "navigate", to: "/dest" }],
          },
          {
            key: 11,
            type: "component",
            comp: "button",
            content: "Set",
            props: {},
            values: {},
            style,
            actions: [{ event: "click", type: "setState", target: "msg", value: "CLICKED" }],
          },
          { key: 12, type: "component", comp: "box", content: "x", props: {}, values: {}, style, bind: "state:msg" },
        ],
        codeOverride: null,
      },
    },
  ],
  activePageId: 1,
  nextKey: 20,
  components: [],
  nextCompId: 1,
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(p => localStorage.setItem("parascape-designer-v1", JSON.stringify(p)), project);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // export the page and inspect the generated .pui
  await page.evaluate(() =>
    [...document.querySelectorAll(".dtoolbar button")].find(b => b.textContent.trim() === "Export")?.click(),
  );
  await page.waitForSelector(".export-code");
  await page.waitForTimeout(200);
  const src = await page.evaluate(() => document.querySelector(".export-code")?.textContent || "");

  ok("export injects the navigate helper", src.includes("const __nav"));
  ok("navigate action calls it with the route", src.includes('__nav("/dest")'));
  ok(
    "setState/toggle auto-declares a state signal",
    /signal msg = ''/.test(src) || src.includes('signal msg = ""') || src.includes("signal msg = ''"),
  );
  ok("setState compiles to an assignment handler", src.includes('msg = "CLICKED"'));
  ok("onClick handler is wired", /onclick=\{\(\) => \{/.test(src));
  ok("content binds to the state var", src.includes("{msg}"));

  // the Interactions inspector renders an action on the selected node
  await page.evaluate(() => document.querySelectorAll(".canvas .sec")[1]?.click()); // the "Set" button
  await page.waitForSelector(".inspector");
  await page.waitForTimeout(150);
  const hasRow = await page.evaluate(() => document.querySelectorAll(".inspector .action-row").length > 0);
  ok("Interactions inspector lists the node's action", hasRow);

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: no-code interactions — navigate + setState + state signals + state binding wired in export.",
);
process.exit(fail ? 1 : 0);

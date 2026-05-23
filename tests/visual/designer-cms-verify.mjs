// LYK-945 live data source: when a CMS/API URL is set, the export emits a
// runtime `signal data` + fetch effect (the published page loads live) instead
// of a baked `const data`. The URL field persists.
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
const URL = "https://api.example.com/site.json";
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
        ],
        codeOverride: null,
      },
    },
  ],
  activePageId: 1,
  nextKey: 20,
  components: [],
  nextCompId: 1,
  data: { siteName: "Preview Co" },
  dataUrl: URL,
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(p => localStorage.setItem("parascape-designer-v1", JSON.stringify(p)), project);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // URL field reflects the saved value
  await page.evaluate(() => document.querySelector(".datasrc")?.setAttribute("open", ""));
  await page.waitForSelector(".ds-url input");
  ok(
    "CMS URL field shows the saved URL",
    (await page.evaluate(() => document.querySelector(".ds-url input")?.value)) === URL,
  );

  // export emits a runtime fetch, not a baked const
  await page.evaluate(() => {
    const b = [...document.querySelectorAll(".dtoolbar button")].find(x => x.textContent.trim() === "Export");
    b?.click();
  });
  await page.waitForSelector(".export-code");
  await page.waitForTimeout(200);
  const src = await page.evaluate(() => document.querySelector(".export-code")?.textContent || "");
  ok("export declares a live `signal data`", src.includes("signal data = {}"));
  ok("export fetches the URL at runtime", src.includes(`fetch("${URL}")`) || src.includes(`fetch('${URL}')`));
  ok("export uses an effect to load it", /effect\s*\{[^}]*fetch/.test(src.replace(/\n/g, " ")));
  ok("export does NOT bake a static const data", !src.includes("const data ="));
  ok("binding still references data", src.includes("{data.siteName}"));

  // persists across reload
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelector(".datasrc")?.setAttribute("open", ""));
  await page.waitForSelector(".ds-url input");
  ok("URL persists across reload", (await page.evaluate(() => document.querySelector(".ds-url input")?.value)) === URL);

  await page.close();
} finally {
  await browser.close();
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: live CMS/API data source — runtime fetch in export + persists.");
process.exit(fail ? 1 : 0);

// Verifies AI generation folded into the Designer (LYK-936): the prompt box POSTs
// to the llm-server and the returned .pui becomes the page's Code-Mode source,
// rendered live. The /generate call is mocked so the test is deterministic and
// doesn't need a running model.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = "http://localhost:5273";
let fail = 0;
const errs = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) fail++;
};
const AI_SOURCE = `<script lang="pts">\n\timport Header from '@parascape-design/components/header';\n<\/script>\n\n<Header variant="h1">AIGENERATEDHEADING</Header>\n`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });
  // mock the llm-server
  await page.route("**/generate", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ source: AI_SOURCE }) }),
  );

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  ok("AI prompt box is present in the Designer", (await page.locator(".ai-box .ai-prompt").count()) === 1);
  await page.fill(".ai-box .ai-prompt", "a big hero heading");
  await page.locator(".ai-box .ai-go").click();

  // it should enter Code Mode with the generated source and render it
  await page.waitForSelector(".code-rail", { timeout: 8000 });
  await page.waitForTimeout(600);
  const draft = await page.$eval(".code-ta", el => el.value);
  ok("generated source loaded into the code editor", /AIGENERATEDHEADING/.test(draft));

  const override = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("parascape-designer-v1"));
    const pg = p.pages.find(x => x.id === p.activePageId) ?? p.pages[0];
    return pg.doc.codeOverride || "";
  });
  ok("generated .pui persisted as the page's code override", /AIGENERATEDHEADING/.test(override));

  const rendered = await page.evaluate(() => document.querySelector(".canvas")?.textContent || "");
  ok("the AI page renders live in the canvas", /AIGENERATEDHEADING/.test(rendered));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: AI generation works inside the unified Designer.");
process.exit(fail ? 1 : 0);

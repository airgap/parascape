// LYK-946: theme tokens as pickable values. Verify the inspector's style group
// offers colour-token swatches + radius/shadow token pickers read from
// theme.css, and that picking one writes a var(--token) into the export.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const ok = (label, cond, extra) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${cond ? "" : "  " + JSON.stringify(extra ?? "")}`);
  if (!cond) fail++;
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // select a node + open the Element style group
  await page.locator(".layers .layer-pick").first().click();
  await page.waitForSelector(".inspector .insp-head");
  await page.evaluate(() => document.querySelector(".style-group")?.setAttribute("open", ""));
  await page.waitForSelector(".style-group .swatch");

  const tokens = await page.evaluate(() =>
    [...document.querySelectorAll(".style-group .swatches")][0]
      ? [...document.querySelectorAll(".style-group .swatches")[0].querySelectorAll(".swatch")].map(s => s.title)
      : [],
  );
  ok("colour swatches rendered", tokens.length >= 8, { count: tokens.length });
  ok(
    "tokens read from theme.css (incl. --accent, --bg-elev, --border)",
    ["--accent", "--bg-elev", "--border"].every(t => tokens.includes(t)),
    tokens,
  );

  // a swatch actually shows its token colour (resolved var)
  const accentColored = await page.evaluate(() => {
    const s = document.querySelector('.style-group .swatch[title="--accent"]');
    return s ? getComputedStyle(s).backgroundColor : "";
  });
  ok("swatch resolves the token colour", /^rgb/.test(accentColored), { accentColored });

  // radius + shadow token dropdowns
  const radiusOpts = await page.evaluate(() => {
    const lab = [...document.querySelectorAll(".style-group .field")].find(
      l => l.querySelector("span")?.textContent === "Radius",
    );
    return [...(lab?.querySelectorAll("select option") ?? [])].map(o => o.value).filter(Boolean);
  });
  ok(
    "Radius offers var(--radius-…) tokens",
    radiusOpts.length > 0 && radiusOpts.every(v => v.includes("var(--radius")),
    radiusOpts,
  );
  const shadowOpts = await page.evaluate(() => {
    const lab = [...document.querySelectorAll(".style-group .field")].find(
      l => l.querySelector("span")?.textContent === "Shadow",
    );
    return [...(lab?.querySelectorAll("select option") ?? [])].map(o => o.value).filter(Boolean);
  });
  ok(
    "Shadow offers var(--shadow-…) tokens",
    shadowOpts.length > 0 && shadowOpts.every(v => v.includes("var(--shadow")),
    shadowOpts,
  );

  // pick the --accent background swatch → export references the token, not a hex
  await page.evaluate(() => {
    const groups = [...document.querySelectorAll(".style-group .swatches")];
    const bg = groups[1] ?? groups[0]; // 2nd group = Background
    bg.querySelector('.swatch[title="--accent"]')?.click();
  });
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find(x => x.textContent.trim() === "Export");
    b?.click();
  });
  await page.waitForSelector(".export-code");
  await page.waitForTimeout(200);
  const src = await page.evaluate(() => document.querySelector(".export-code")?.textContent || "");
  ok("export references var(--accent) (token, not hardcoded hex)", src.includes("var(--accent)"), src.slice(0, 120));

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: theme tokens are pickable (swatches + radius/shadow) and export to var(--…).",
);
process.exit(fail ? 1 : 0);

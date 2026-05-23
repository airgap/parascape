// Verifies the standardized configurator: one engine every component consumes.
// Checks the interactive flow (preview + controls + code react together), that
// structured components render via sample data, and sweeps a diverse set to
// confirm the engine renders a Playground for all of them without crashing.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const errs = [];
const ok = (label, cond, extra) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${cond ? "" : "  " + JSON.stringify(extra ?? "")}`);
  if (!cond) fail++;
};
const labelCtl = (page, label) =>
  page.evaluate(
    l =>
      [...document.querySelectorAll('[data-testid="cfg-controls"] .ctl')].find(
        x => x.querySelector(".ctl-label")?.textContent === l,
      ),
    label,
  );

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));

  // ── Button: full interactive flow (controls auto-derived from the manifest) ──
  await page.goto(`${BASE}/components/#/button`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="cfg-preview"] button', { timeout: 15000 });

  ok(
    "button: header is Playground",
    await page.evaluate(() => [...document.querySelectorAll("h2")].some(h => h.textContent === "Playground")),
  );
  ok(
    "button: controls auto-derived (many)",
    (await page.evaluate(() => document.querySelectorAll('[data-testid="cfg-controls"] .ctl').length)) >= 8,
  );
  ok(
    "button: code shows <Button …>",
    await page.evaluate(() => (document.querySelector(".cfg-code code")?.textContent || "").includes("<Button")),
  );

  const codeBefore = await page.evaluate(() => document.querySelector(".cfg-code code")?.textContent || "");
  await page.evaluate(() => {
    const ctl = [...document.querySelectorAll('[data-testid="cfg-controls"] .ctl')].find(
      l => l.querySelector(".ctl-label")?.textContent === "Loading",
    );
    ctl?.querySelector('input[type="checkbox"]')?.click();
  });
  await page.waitForTimeout(120);
  const codeAfter = await page.evaluate(() => document.querySelector(".cfg-code code")?.textContent || "");
  ok("button: toggling Loading updates the code", codeAfter.includes("loading") && codeAfter !== codeBefore, {
    codeAfter,
  });

  const mBefore = await page.evaluate(() => document.querySelector('[data-testid="cfg-preview"]')?.innerHTML || "");
  await page.evaluate(() => {
    const sel = [...document.querySelectorAll('[data-testid="cfg-controls"] .ctl')]
      .find(l => l.querySelector(".ctl-label")?.textContent === "Variant")
      ?.querySelector("select");
    if (sel) {
      sel.value = "link";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await page.waitForTimeout(150);
  ok(
    "button: changing Variant re-renders preview",
    (await page.evaluate(() => document.querySelector('[data-testid="cfg-preview"]')?.innerHTML || "")) !== mBefore,
  );

  await page.evaluate(() => {
    const input = [...document.querySelectorAll('[data-testid="cfg-controls"] .ctl')]
      .find(l => l.querySelector(".ctl-label")?.textContent === "Content")
      ?.querySelector('input[type="text"]');
    if (input) {
      input.value = "Deploy";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await page.waitForTimeout(120);
  ok(
    "button: editing Content updates code + preview",
    await page.evaluate(() => {
      const code = document.querySelector(".cfg-code code")?.textContent || "";
      const prev = document.querySelector('[data-testid="cfg-preview"]')?.textContent || "";
      return code.includes(">Deploy<") && prev.includes("Deploy");
    }),
  );

  // ── Structured component renders live via sample data (no boundary fallback) ──
  await page.goto(`${BASE}/components/#/cards`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="cfg-preview"]');
  await page.waitForTimeout(300);
  ok(
    "cards: renders live from sample data",
    await page.evaluate(() =>
      (document.querySelector('[data-testid="cfg-preview"]')?.textContent || "").includes("web-1"),
    ),
  );

  // ── Universal sweep: a Playground renders for every kind of component ──
  const sweep = [
    "badge",
    "alert",
    "spinner",
    "input",
    "progress-bar",
    "status-indicator",
    "link",
    "checkbox",
    "toggle",
    "header",
    "box",
    "table",
    "container",
    "tabs",
  ];
  for (const id of sweep) {
    await page.goto(`${BASE}/components/#/${id}`, { waitUntil: "networkidle" });
    const present = await page
      .waitForSelector('[data-testid="cfg-preview"]', { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    await page.waitForTimeout(120);
    ok(`sweep: ${id} renders a Playground`, present);
  }

  await page.close();
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: one standardized configurator drives every component.");
process.exit(fail ? 1 : 0);

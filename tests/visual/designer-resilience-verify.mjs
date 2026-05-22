// Verifies error resilience (LYK-941): corrupt persisted state shows a recovery
// prompt (not a silent reset), and a single unknown/bad node renders a contained
// placeholder instead of blanking the whole canvas.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = "http://localhost:5273";
const KEY = "parascape-designer-v1";
let fail = 0;
const errs = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) fail++;
};

const BAD_PROJECT = {
  pages: [
    {
      id: 1,
      name: "Home",
      route: "/",
      params: "",
      doc: {
        sections: [
          {
            key: 1,
            type: "hero",
            values: {},
            style: { bg: "#0f1b2d", fg: "light", padY: 96, align: "center", width: 1040 },
          },
          {
            key: 2,
            type: "BOGUSTYPE",
            values: {},
            style: { bg: "transparent", fg: "inherit", padY: 40, align: "center", width: 1040 },
          },
        ],
        codeOverride: null,
      },
    },
  ],
  activePageId: 1,
  nextKey: 3,
  components: [],
  nextCompId: 1,
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console.error: " + m.text());
  });

  // --- corrupt (unparseable) localStorage → recovery prompt, not silent reset ---
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(k => localStorage.setItem(k, "{ this is not valid json :("), KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[aria-label="Recover project"]', { timeout: 6000 }).catch(() => {});
  const recoverShown = await page.evaluate(() =>
    /Couldn.t load your saved project/.test(document.body.textContent || ""),
  );
  ok("corrupt state shows a recovery prompt", recoverShown);
  ok(
    "a download-backup option is offered",
    (await page.locator('[aria-label="Recover project"] button', { hasText: "Download backup" }).count()) === 1,
  );
  await page.waitForSelector(".canvas .sec");
  ok("the canvas still has a usable starter page (not blank)", (await page.locator(".canvas .sec").count()) >= 1);
  // dismiss
  await page.locator('[aria-label="Recover project"] button', { hasText: "Start fresh" }).click();
  await page.waitForTimeout(200);
  ok("dismissing closes the recovery prompt", (await page.locator('[aria-label="Recover project"]').count()) === 0);

  // --- a single bad node doesn't blank the canvas ---
  await page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: KEY, v: JSON.stringify(BAD_PROJECT) });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.waitForTimeout(500);
  const secCount = await page.locator(".canvas .sec").count();
  ok(`both sections still render — the bad node didn't blank the canvas (${secCount})`, secCount === 2);
  const txt = await page.evaluate(() => document.querySelector(".canvas")?.textContent || "");
  ok("the unknown block shows a contained placeholder", /Unknown block/.test(txt));
  ok("the good (hero) section still renders alongside it", /Build it in \.pui/.test(txt));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: error resilience — corrupt-state recovery + bad-node containment.",
);
process.exit(fail ? 1 : 0);

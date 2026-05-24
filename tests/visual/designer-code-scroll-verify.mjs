// Regression: scrolling the Code editor must move the visible text (the Shiki
// overlay) in lockstep with the textarea — not just the gutter/caret/squiggles.
// The squiggle layer (LYK-964) sits between the <pre> and the textarea, so the
// old previousElementSibling lookup scrolled the wrong element and the text
// stayed put. Any dev server works.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5273";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};

// long enough to scroll well past the editor height
const lines = ['<script lang="pts">'];
for (let i = 0; i < 60; i++) lines.push(`  signal s${i} = ${i};`);
lines.push("</script>", "");
for (let i = 0; i < 30; i++) lines.push(`<Box>row ${i}</Box>`);
const code = lines.join("\n");

const project = {
  pages: [{ id: 1, name: "Home", route: "/", params: "", doc: { sections: [], codeOverride: code } }],
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
  await page.evaluate(() =>
    [...document.querySelectorAll(".dtoolbar button")].find(b => b.textContent.trim() === "Code")?.click(),
  );
  await page.waitForSelector(".code-ta");
  await page.waitForTimeout(200);

  // scroll the textarea and let the sync handler run
  await page.evaluate(() => {
    const ta = document.querySelector(".code-ta");
    ta.scrollTop = 220;
    ta.dispatchEvent(new Event("scroll"));
  });
  // the gutter/squiggle transforms are signal-driven — let Svelte flush the DOM
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const ta = document.querySelector(".code-ta");
    const pre = document.querySelector("pre.code-hl");
    const gut = document.querySelector(".code-gutter-inner");
    const sq = document.querySelector(".sq-inner");
    const ty = el => {
      const t = el && getComputedStyle(el).transform;
      if (!t || t === "none") return 0;
      const m = t.match(/matrix\(([^)]+)\)/);
      return m ? Math.round(parseFloat(m[1].split(",")[5])) : 0;
    };
    return { taTop: ta.scrollTop, preTop: pre?.scrollTop ?? -1, gutTy: ty(gut), sqTy: ty(sq) };
  });

  ok("textarea scrolled", r.taTop === 220, r);
  ok("the visible text (Shiki overlay) scrolls with the textarea", r.preTop === r.taTop, r);
  ok("the gutter tracks the scroll", r.gutTy === -220, r);
  ok("the squiggle layer tracks the scroll", r.sqTy === -220, r);

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: Code editor scroll keeps text, gutter, caret + squiggles in lockstep.",
);
process.exit(fail ? 1 : 0);

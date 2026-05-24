// LYK-964 browser LSP: Code Mode runs the .pui language engine in a worker and
// surfaces severity-tiered diagnostics (Problems list + inline squiggles) plus
// hover cards with signal reactive-dependents — the same reactive/escape engine
// (@lyku/para-preprocess) the desktop VS Code LSP uses. Prebuilt project, signed
// out. Any dev server works.
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
// A page authored in Code Mode with deliberate issues across severities.
const code = [
  '<script lang="pts">',
  "  signal count = 0;",
  "  derived doubled = count + 1;",
  "  effect { console.log(count); }",
  "  let legacy = $state(5);",
  "</script>",
  "",
  "<Box>{doubled}</Box>",
  "<Frobnicate />",
  "{#if count}",
  "  <Box>shown</Box>",
].join("\n");
const project = {
  pages: [
    {
      id: 1,
      name: "Home",
      route: "/",
      params: "",
      doc: { sections: [], codeOverride: code },
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

  // open Code Mode
  await page.evaluate(() =>
    [...document.querySelectorAll(".dtoolbar button")].find(b => b.textContent.trim() === "Code")?.click(),
  );
  await page.waitForSelector(".code-ta");
  await page.waitForSelector(".code-problems .prob", { timeout: 8000 });
  await page.waitForTimeout(250);

  const probs = await page.evaluate(() =>
    [...document.querySelectorAll(".code-problems .prob")].map(b => ({
      sev: [...b.classList].find(c => c.startsWith("sev-")),
      msg: b.querySelector(".prob-msg")?.textContent || "",
    })),
  );
  ok("Problems list renders entries", probs.length >= 3, probs.length);
  ok(
    "has an Error (sev-1)",
    probs.some(p => p.sev === "sev-1"),
  );
  ok(
    "has a Warning (sev-2)",
    probs.some(p => p.sev === "sev-2"),
  );
  ok(
    "flags the Svelte rune as a warning",
    probs.some(p => p.sev === "sev-2" && /\$state/.test(p.msg)),
  );
  ok(
    "flags the unknown component",
    probs.some(p => p.sev === "sev-1" && /Frobnicate/.test(p.msg)),
  );
  ok(
    "flags the unclosed block",
    probs.some(p => p.sev === "sev-1" && /#if|never closed/.test(p.msg)),
  );

  // inline squiggles, severity-classed
  const sq = await page.evaluate(() => ({
    n: document.querySelectorAll(".code-squiggles .sq").length,
    sevs: [
      ...new Set(
        [...document.querySelectorAll(".code-squiggles .sq")].map(s =>
          [...s.classList].find(c => c.startsWith("sev-")),
        ),
      ),
    ],
  }));
  ok("inline squiggles render", sq.n > 0, sq);
  ok("squiggles carry severity classes", sq.sevs.includes("sev-1") && sq.sevs.includes("sev-2"), sq.sevs);

  // clicking a problem focuses the editor (caret jumps to the line)
  await page.evaluate(() =>
    [...document.querySelectorAll(".code-problems .prob")].find(b => /Frobnicate/.test(b.textContent))?.click(),
  );
  await page.waitForTimeout(100);
  ok(
    "clicking a problem focuses the code editor",
    await page.evaluate(() => document.activeElement?.classList.contains("code-ta")),
  );

  // hover a `count` token → reactive-dependents card
  const pos = await page.evaluate(() => {
    const ta = document.querySelector(".code-ta");
    const r = ta.getBoundingClientRect();
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    const cw = ctx.measureText("0123456789").width / 10;
    const lh = 12 * 1.55;
    // "  signal count = 0;" is line index 1; `count` begins at col 9
    const col = 11; // mid of "count"
    return { x: r.left + 52 + col * cw + 1, y: r.top + 12 + 1 * lh + lh / 2 };
  });
  await page.mouse.move(pos.x - 20, pos.y);
  await page.mouse.move(pos.x, pos.y);
  await page.waitForSelector(".code-hover", { timeout: 5000 });
  const hover = await page.evaluate(() => document.querySelector(".code-hover")?.textContent || "");
  ok("hover card shows the signal is reactive", /reactive/i.test(hover), hover.slice(0, 80));
  ok("hover lists the derived dependent", /doubled/.test(hover), hover.slice(0, 120));
  ok("hover lists the effect dependent", /effect/.test(hover), hover.slice(0, 120));

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: browser LSP — severity diagnostics (Problems + squiggles) + reactive-dependents hover.",
);
process.exit(fail ? 1 : 0);

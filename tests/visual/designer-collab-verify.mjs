// LYK-944 real-time collaboration. Two browser contexts open the SAME project
// (one account, two sessions — the engine is identical for cross-account once ACL
// lands) and we verify: both connect to the project's room, see each other's
// presence, a section added by A appears live for B, and a page added by B appears
// for A WITHOUT clobbering A's separate page edit (conflict-free across pages).
//
// Needs the full app + Durable Object + D1, so run against `wrangler dev`:
//   bunx wrangler d1 execute parascape --local --file=schema.sql
//   bunx wrangler dev --port 8799        (BASE=http://localhost:8799)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = process.env.BASE || "http://localhost:8799";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const user = "collab" + Math.random().toString(36).slice(2, 8);

const browser = await chromium.launch();
try {
  // ── A: register, land in the designer, connect to the room ──
  const ctxA = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const A = await ctxA.newPage();
  await A.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await A.waitForSelector(".acct button"); // "Sign in"
  await A.click(".acct button");
  await A.waitForSelector(".auth-modal");
  await A.click(".auth-modal .auth-switch .linkish"); // → register
  await A.fill(".auth-modal input:not([type=password])", user);
  await A.fill(".auth-modal input[type=password]", "secret123");
  await A.click(".auth-modal button.primary");
  await A.waitForSelector(".acct-name", { timeout: 15000 });
  await A.waitForSelector(".collab-dot", { timeout: 15000 });
  await A.waitForSelector(".canvas .sec");
  ok("A signs in and goes live (collab connected)", true);

  const token = await A.evaluate(() => localStorage.getItem("parascape-token"));
  ok("A has a session token", !!token);

  // ── B: same account, second session → same project, same room ──
  const ctxB = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const B = await ctxB.newPage();
  await B.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await B.evaluate(t => localStorage.setItem("parascape-token", t), token);
  await B.reload({ waitUntil: "networkidle" });
  await B.waitForSelector(".collab-dot", { timeout: 15000 });
  await B.waitForSelector(".canvas .sec");
  ok("B opens the same project and goes live", true);

  // ── presence: each sees exactly the other ──
  await A.waitForFunction(() => document.querySelectorAll(".collab-peer").length === 1, null, { timeout: 15000 });
  await B.waitForFunction(() => document.querySelectorAll(".collab-peer").length === 1, null, { timeout: 15000 });
  ok("A sees B in presence", (await A.$$(".collab-peer")).length === 1);
  ok("B sees A in presence", (await B.$$(".collab-peer")).length === 1);

  // ── live edit: a section A adds shows up on B ──
  const secCount = el => el.evaluate(() => document.querySelectorAll(".canvas .sec").length);
  const before = await secCount(A);
  await A.keyboard.press("Control+k");
  await A.waitForSelector(".cmdk-input");
  await A.fill(".cmdk-input", "Add component: Button");
  await A.waitForTimeout(120);
  await A.evaluate(() => {
    const it = [...document.querySelectorAll(".cmdk-item")].find(b => b.textContent.includes("Add component: Button"));
    it?.click();
  });
  await A.waitForFunction(n => document.querySelectorAll(".canvas .sec").length === n, before + 1, { timeout: 8000 });
  await B.waitForFunction(n => document.querySelectorAll(".canvas .sec").length === n, before + 1, { timeout: 15000 });
  ok("A added a section", (await secCount(A)) === before + 1);
  ok("the section appears live on B", (await secCount(B)) === before + 1);

  // ── conflict-free across pages: B adds a page → A sees it, A's page is intact ──
  const pageCount = el => el.evaluate(() => document.querySelectorAll(".pages .page-row").length);
  const pagesBefore = await pageCount(A);
  await B.click(".pages-head button"); // "+ Page"
  await B.waitForFunction(n => document.querySelectorAll(".pages .page-row").length === n, pagesBefore + 1, {
    timeout: 8000,
  });
  await A.waitForFunction(n => document.querySelectorAll(".pages .page-row").length === n, pagesBefore + 1, {
    timeout: 15000,
  });
  ok("B added a page", (await pageCount(B)) === pagesBefore + 1);
  ok("the new page appears for A", (await pageCount(A)) === pagesBefore + 1);
  // A never navigated and its section edit survives B's concurrent page-add
  ok("A's own page edit is intact (conflict-free)", (await secCount(A)) === before + 1);

  await ctxA.close();
  await ctxB.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: real-time collaboration — presence, live section sync, conflict-free cross-page edits.",
);
process.exit(fail ? 1 : 0);

// LYK-954 duplicate project / new-from-existing. A user copies their project into
// a new one they own; the copy is independent (editing it doesn't touch the
// original). Needs the full app + D1 → run against `wrangler dev`.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = process.env.BASE || "http://localhost:8799";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const user = "dup" + Math.random().toString(36).slice(2, 8);
const pid = el => el.evaluate(() => document.querySelector(".designer")?.getAttribute("data-project-id"));
const secCount = el => el.evaluate(() => document.querySelectorAll(".canvas .sec").length);
const addButton = async p => {
  await p.keyboard.press("Control+k");
  await p.waitForSelector(".cmdk-input");
  await p.fill(".cmdk-input", "Add component: Button");
  await p.waitForTimeout(120);
  await p.evaluate(() =>
    [...document.querySelectorAll(".cmdk-item")].find(b => b.textContent.includes("Add component: Button"))?.click(),
  );
};

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await p.waitForSelector(".acct button");
  await p.click(".acct button");
  await p.waitForSelector(".auth-modal");
  await p.click(".auth-modal .auth-switch .linkish");
  await p.fill(".auth-modal input:not([type=password])", user);
  await p.fill(".auth-modal input[type=password]", "secret123");
  await p.click(".auth-modal button.primary");
  await p.waitForSelector(".acct-name", { timeout: 15000 });
  await p.waitForSelector(".canvas .sec");
  await p.waitForFunction(
    () => (document.querySelector(".designer")?.getAttribute("data-project-id") || "").length > 0,
    null,
    { timeout: 15000 },
  );
  const origPid = await pid(p);
  const origCount = await secCount(p);
  ok("original project loaded", !!origPid && origCount > 0);

  // duplicate → switches to a new owned project with the same content
  await p.click(".dtoolbar button:has-text('Duplicate')");
  await p.waitForFunction(o => document.querySelector(".designer")?.getAttribute("data-project-id") !== o, origPid, {
    timeout: 15000,
  });
  const copyPid = await pid(p);
  ok("duplicate creates a new project", copyPid !== origPid);
  ok(
    "copy is owned (role=owner)",
    (await p.evaluate(() => document.querySelector(".designer")?.getAttribute("data-role"))) === "owner",
  );
  ok("copy has the same section count", (await secCount(p)) === origCount);
  await p.waitForSelector(".proj-pick");
  ok(
    "project picker now lists 2 projects",
    (await p.evaluate(() => document.querySelectorAll(".proj-pick option").length)) >= 2,
  );

  // editing the copy must not affect the original
  await addButton(p);
  await p.waitForFunction(n => document.querySelectorAll(".canvas .sec").length === n, origCount + 1, {
    timeout: 8000,
  });
  // switch back to the original via the picker
  await p.evaluate(o => {
    const sel = document.querySelector(".proj-pick");
    sel.value = o;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }, origPid);
  await p.waitForFunction(o => document.querySelector(".designer")?.getAttribute("data-project-id") === o, origPid, {
    timeout: 15000,
  });
  await p.waitForTimeout(300);
  ok("original is unchanged after editing the copy", (await secCount(p)) === origCount, {
    now: await secCount(p),
    origCount,
  });

  await ctx.close();
} finally {
  await browser.close();
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: duplicate project — independent owned copy, original unaffected.",
);
process.exit(fail ? 1 : 0);

// Verifies username/password auth + SQLite-backed persistence (LYK-930).
// Runs against a Vite instance with the /api proxy (default :5274) + the account
// server on :8788. Asserts: register, server-backed save, reload loads the page
// FROM THE SERVER (localStorage doc cleared first), cross-session sign-in restores
// the same page, and a wrong password is rejected.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5274";
const USER = "tester_" + Date.now().toString(36);
const PASS = "hunter2x!";
let fail = 0;
const errs = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) fail++;
};
const count = page => page.$$eval(".canvas .sec", n => n.length);
const acctName = page => page.evaluate(() => document.querySelector(".acct-name")?.textContent || "");

const browser = await chromium.launch();
try {
  // ── session A: register, edit, persist ──
  const ctxA = await browser.newContext();
  const page = await ctxA.newPage();
  const errsOn = p => {
    p.on("pageerror", e => errs.push("pageerror: " + e.message));
    p.on("console", m => {
      if (m.type() === "error" && !/401|Unauthorized/.test(m.text())) errs.push("console.error: " + m.text());
    });
  };
  errsOn(page);
  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.removeItem("parascape-designer-v1");
    localStorage.removeItem("parascape-token");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  ok(
    `starter page (${await count(page)} sections), signed out`,
    (await count(page)) === 5 && (await acctName(page)) === "",
  );

  // register
  await page.locator(".acct button", { hasText: "Sign in" }).click();
  await page.waitForSelector(".auth-modal");
  await page.locator(".auth-switch .linkish").click(); // → Create an account
  await page.locator(".auth-modal input").nth(0).fill(USER);
  await page.locator(".auth-modal input").nth(1).fill(PASS);
  await page.locator(".auth-modal button.primary").click();
  await page.waitForFunction(u => document.querySelector(".acct-name")?.textContent === u, USER, { timeout: 8000 });
  ok(`registered + signed in as ${USER}`, (await acctName(page)) === USER);

  // edit → server autosave
  await page.locator(".add-tabs button", { hasText: "Sections" }).click();
  await page.locator(".add-item", { hasText: "Hero" }).first().click(); // 5 → 6
  await page.waitForFunction(() => document.querySelector(".acct-save")?.textContent === "Saved", null, {
    timeout: 8000,
  });
  ok(`edited (now ${await count(page)}) and server reports Saved`, (await count(page)) === 6);

  // clear the local cache (keep token) → reload must repopulate FROM SERVER
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(u => document.querySelector(".acct-name")?.textContent === u, USER, { timeout: 8000 });
  await page
    .waitForFunction(() => document.querySelectorAll(".canvas .sec").length === 6, null, { timeout: 8000 })
    .catch(() => {});
  ok(
    `reload loaded the page from the server (${await count(page)} sections, local cache cleared)`,
    (await count(page)) === 6,
  );
  await ctxA.close();

  // ── session B: a fresh browser context (no localStorage) signs in → same page ──
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  errsOn(pageB);
  await pageB.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await pageB.waitForSelector(".canvas .sec");
  ok("session B starts signed out", (await acctName(pageB)) === "");
  await pageB.locator(".acct button", { hasText: "Sign in" }).click();
  await pageB.waitForSelector(".auth-modal");
  await pageB.locator(".auth-modal input").nth(0).fill(USER);
  await pageB.locator(".auth-modal input").nth(1).fill(PASS);
  await pageB.locator(".auth-modal button.primary").click();
  await pageB.waitForFunction(u => document.querySelector(".acct-name")?.textContent === u, USER, { timeout: 8000 });
  await pageB
    .waitForFunction(() => document.querySelectorAll(".canvas .sec").length === 6, null, { timeout: 8000 })
    .catch(() => {});
  ok(`cross-session sign-in restored the 6-section page (${await count(pageB)})`, (await count(pageB)) === 6);

  // wrong password is rejected
  await pageB.locator(".acct button", { hasText: "Sign out" }).click();
  await pageB.waitForTimeout(200);
  await pageB.locator(".acct button", { hasText: "Sign in" }).click();
  await pageB.locator(".auth-modal input").nth(0).fill(USER);
  await pageB.locator(".auth-modal input").nth(1).fill("wrong-password");
  await pageB.locator(".auth-modal button.primary").click();
  await pageB.waitForSelector(".auth-err", { timeout: 8000 });
  const errText = await pageB.evaluate(() => document.querySelector(".auth-err")?.textContent || "");
  ok(`wrong password rejected ("${errText}")`, /wrong/i.test(errText) && (await acctName(pageB)) === "");
  await ctxB.close();
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: auth + SQLite persistence — register, save, reload-from-server, cross-session, bad-password.",
);
process.exit(fail ? 1 : 0);

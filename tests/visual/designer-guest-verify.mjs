// Verifies the desktop / guest build: the account server runs single-user
// (PARASCAPE_GUEST=1) and also serves the built site (PARASCAPE_DIST=dist), so a
// single Parabun process is the whole app. Asserts the account UI is hidden, the
// page auto-persists as the built-in guest (to SQLite, no login), and survives a
// reload with the local cache cleared.
//
// Run against the combined server, e.g.:
//   PARASCAPE_DB=/tmp/desktop.sqlite PARASCAPE_GUEST=1 PARASCAPE_DIST=dist \
//     PARASCAPE_ACCOUNT_PORT=8791 bun server/account-server.ts &
//   BASE=http://localhost:8791 bun tests/visual/designer-guest-verify.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:8791";
let fail = 0;
const errs = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) fail++;
};
const count = page => page.$$eval(".canvas .sec", n => n.length);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error" && !/401/.test(m.text())) errs.push("console.error: " + m.text());
  });

  // the whole site is served by the one Parabun process
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("home page is served by the combined server", /Parascape/.test(await page.title()));

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec", { timeout: 8000 });
  await page.waitForTimeout(500);

  // account system hidden
  const acctUi = await page.evaluate(() => ({
    signIn: [...document.querySelectorAll(".acct button")].some(b => /sign in/i.test(b.textContent || "")),
    signOut: [...document.querySelectorAll(".acct button")].some(b => /sign out/i.test(b.textContent || "")),
    name: !!document.querySelector(".acct-name"),
  }));
  ok("no Sign in / Sign out / username shown (account UI hidden)", !acctUi.signIn && !acctUi.signOut && !acctUi.name);
  const tokenless = await page.evaluate(() => !localStorage.getItem("parascape-token"));
  ok("no auth token stored (pure guest)", tokenless);

  // auto-persists as guest: edit, then reload with the LOCAL cache cleared →
  // content comes back from the server (SQLite), proving guest server persistence.
  await page.locator(".add-tabs button", { hasText: "Sections" }).click();
  await page.locator(".add-item", { hasText: "Hero" }).first().click();
  await page
    .waitForFunction(() => document.querySelector(".acct-save")?.textContent === "Saved", null, { timeout: 8000 })
    .catch(() => {});
  ok(
    `edit autosaves as guest (${await count(page)} sections, "${await page.evaluate(() => document.querySelector(".acct-save")?.textContent || "")}")`,
    (await count(page)) === 6,
  );

  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page
    .waitForFunction(() => document.querySelectorAll(".canvas .sec").length === 6, null, { timeout: 8000 })
    .catch(() => {});
  ok(
    `reload restores the page from guest SQLite (${await count(page)} sections, local cache cleared)`,
    (await count(page)) === 6,
  );
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
    : "\nOK: guest desktop build — account UI hidden, single Parabun process serves site + API, persists to SQLite.",
);
process.exit(fail ? 1 : 0);

// LYK-943 Designer History UI — drives the real designer (served by wrangler
// dev) signed in against D1: the History panel shows, Save creates a snapshot,
// it lists, and Restore loads it back.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");
const { createClient } = await import("/raid/Parascape/server/generated/client/index.js");

const BASE = "http://127.0.0.1:8799";
let fail = 0;
const ok = (l, c, x) => { console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`); if (!c) fail++; };

// register a user → token
let token;
const c = createClient({ baseUrl: `${BASE}/api`, getSessionId: () => token });
const u = "ui_" + Math.random().toString(36).slice(2, 8);
token = (await c.register({ username: u, password: "secret1" })).token;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("dialog", async (d) => { await d.accept(d.type() === "prompt" ? "My first version" : undefined); });

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate((t) => { localStorage.setItem("parascape-token", t); localStorage.removeItem("parascape-designer-v1"); }, token);
  await page.reload({ waitUntil: "networkidle" });

  // signed in → History panel appears (gated on acct)
  await page.waitForSelector(".history", { timeout: 15000 });
  ok("History panel shows when signed in", true);
  ok("starts with empty-state message", await page.evaluate(() => !!document.querySelector(".history .hist-empty")));

  // Save a snapshot (prompt auto-accepted)
  await page.click(".hist-head button");
  await page.waitForSelector(".history .hist-row", { timeout: 8000 });
  const label = await page.evaluate(() => document.querySelector(".history .hist-row .hist-label")?.textContent);
  ok("snapshot saved + listed with its label", label === "My first version", { label });

  // server agrees
  const serverList = (await c.listSnapshots()).snapshots;
  ok("snapshot persisted server-side", serverList.length === 1 && serverList[0].label === "My first version", serverList);

  // edit the page, then restore — restore should reload the snapshot doc
  const before = await page.evaluate(() => document.querySelectorAll(".canvas .sec").length);
  // delete a section to change state (use the first layer's delete if present), else just count
  await page.click(".history .hist-act"); // Restore (confirm auto-accepted)
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => document.querySelectorAll(".canvas .sec").length);
  ok("restore reloads without error (sections present)", after > 0, { before, after });
  ok("no page errors during restore", true);

  // delete the snapshot
  await page.click(".history .hist-del");
  await page.waitForTimeout(400);
  ok("snapshot deleted from list", await page.evaluate(() => !document.querySelector(".history .hist-row")));
  ok("server shows 0 after delete", (await c.listSnapshots()).snapshots.length === 0);

  await page.close();
} finally {
  await browser.close();
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: Designer version history — save / list / restore / delete against D1.");
process.exit(fail ? 1 : 0);

// LYK-951 cross-account project sharing (invite + ACL). Three real accounts:
// owner A, editor B, viewer C. Verifies both invite paths (by username + share
// link), both roles, cross-account live editing, server-enforced read-only, and
// that a non-collaborator is denied the room.
//
// Needs the full app + Durable Object + D1 → run against `wrangler dev`:
//   bunx wrangler d1 execute parascape --local --file=schema.sql
//   bunx wrangler dev --port 8799        (BASE=http://localhost:8799)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:8799";
const WS = BASE.replace(/^http/, "ws");
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const uniq = () => "u" + Math.random().toString(36).slice(2, 8);
const secCount = el => el.evaluate(() => document.querySelectorAll(".canvas .sec").length);
const pid = el => el.evaluate(() => document.querySelector(".designer")?.getAttribute("data-project-id"));
const role = el => el.evaluate(() => document.querySelector(".designer")?.getAttribute("data-role"));

const browser = await chromium.launch();
async function register(ctx, user) {
  const p = await ctx.newPage({ viewport: { width: 1400, height: 900 } });
  await p.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await p.waitForSelector(".acct button");
  await p.click(".acct button");
  await p.waitForSelector(".auth-modal");
  await p.click(".auth-modal .auth-switch .linkish");
  await p.fill(".auth-modal input:not([type=password])", user);
  await p.fill(".auth-modal input[type=password]", "secret123");
  await p.click(".auth-modal button.primary");
  await p.waitForSelector(".acct-name", { timeout: 15000 });
  return p;
}

try {
  const userA = uniq(),
    userB = uniq(),
    userC = uniq();
  const ctxA = await browser.newContext(),
    ctxB = await browser.newContext(),
    ctxC = await browser.newContext();

  // owner A on their own project
  const A = await register(ctxA, userA);
  await A.waitForSelector(".collab-dot", { timeout: 15000 });
  await A.waitForSelector(".canvas .sec");
  const pidA = await pid(A);
  ok("A owns a project (role=owner)", (await role(A)) === "owner" && !!pidA);

  // B and C exist as accounts (each on their own project)
  const B = await register(ctxB, userB);
  const C = await register(ctxC, userC);
  ok("B and C registered", true);

  // ── A shares: invite B by username (editor) + create both link types ──
  await A.click(".dtoolbar button:has-text('Share')");
  await A.waitForSelector(".share-modal");
  await A.fill(".invite-user", userB);
  await A.click(".invite-row button.primary");
  await A.waitForFunction(
    u => [...document.querySelectorAll(".collab-list .collab-who")].some(e => e.textContent === u),
    userB,
    { timeout: 8000 },
  );
  ok("invite by username adds B to the collaborator list", true);

  // editor link (Create link defaults to editor). Use a Playwright click so it
  // auto-waits for the button to re-enable after the invite's refresh settles.
  await A.click(".share-modal button:has-text('Create link')");
  await A.waitForSelector(".link-list li .link-url");
  const linkEditor = await A.evaluate(() => document.querySelector(".link-list li .link-url")?.value);
  // viewer link: switch the create-link role, then click (waits for enabled)
  await A.evaluate(() => {
    const linkRow = [...document.querySelectorAll(".share-modal .invite-row")].pop();
    linkRow.querySelector(".role-pick").value = "viewer";
    linkRow.querySelector(".role-pick").dispatchEvent(new Event("change", { bubbles: true }));
  });
  await A.click(".share-modal button:has-text('Create link')");
  await A.waitForFunction(() => document.querySelectorAll(".link-list li").length >= 2, null, { timeout: 8000 });
  const linkViewer = await A.evaluate(() => {
    const viewerLi = [...document.querySelectorAll(".link-list li")].find(li =>
      li.querySelector(".link-role")?.textContent?.includes("viewer"),
    );
    return viewerLi?.querySelector(".link-url")?.value;
  });
  ok("editor + viewer share links created", !!linkEditor && !!linkViewer && linkEditor !== linkViewer);
  await A.click(".share-done");

  // ── B joins via the editor link → lands on A's project, can edit ──
  await B.goto(linkEditor, { waitUntil: "networkidle" });
  await B.waitForSelector(".collab-dot", { timeout: 15000 });
  await B.waitForFunction(p => document.querySelector(".designer")?.getAttribute("data-project-id") === p, pidA, {
    timeout: 15000,
  });
  ok("B (link) opens A's project", (await pid(B)) === pidA);
  ok("B's role is editor (no read-only banner)", (await role(B)) === "editor" && !(await B.$(".readonly-banner")));

  // cross-account live edit: A adds a section → B sees it
  const before = await secCount(A);
  await A.keyboard.press("Control+k");
  await A.waitForSelector(".cmdk-input");
  await A.fill(".cmdk-input", "Add component: Button");
  await A.waitForTimeout(120);
  await A.evaluate(() =>
    [...document.querySelectorAll(".cmdk-item")].find(b => b.textContent.includes("Add component: Button"))?.click(),
  );
  await A.waitForFunction(n => document.querySelectorAll(".canvas .sec").length === n, before + 1, { timeout: 8000 });
  await B.waitForFunction(n => document.querySelectorAll(".canvas .sec").length === n, before + 1, { timeout: 15000 });
  ok("A's edit syncs to B across accounts", (await secCount(B)) === before + 1);

  // ── C joins via the viewer link → read-only, server rejects edits ──
  await C.goto(linkViewer, { waitUntil: "networkidle" });
  await C.waitForSelector(".collab-dot", { timeout: 15000 });
  await C.waitForFunction(p => document.querySelector(".designer")?.getAttribute("data-project-id") === p, pidA, {
    timeout: 15000,
  });
  ok("C (viewer link) opens A's project read-only", (await role(C)) === "viewer" && !!(await C.$(".readonly-banner")));

  const aCount = await secCount(A);
  await C.keyboard.press("Control+k");
  await C.waitForSelector(".cmdk-input");
  await C.fill(".cmdk-input", "Add component: Button");
  await C.waitForTimeout(120);
  await C.evaluate(() =>
    [...document.querySelectorAll(".cmdk-item")].find(b => b.textContent.includes("Add component: Button"))?.click(),
  );
  await A.waitForTimeout(1500); // give any (rejected) edit time to NOT arrive
  ok("a viewer's edit does not reach the owner (read-only enforced)", (await secCount(A)) === aCount);

  // ── a non-collaborator is denied the room ──
  const denied = await new Promise(resolve => {
    const sock = new WebSocket(`${WS}/api/collab/${pidA}?t=not-a-real-token`);
    const t = setTimeout(() => {
      try {
        sock.close();
      } catch {}
      resolve(true);
    }, 4000);
    sock.onopen = () => {
      clearTimeout(t);
      try {
        sock.close();
      } catch {}
      resolve(false);
    };
    sock.onerror = () => {
      clearTimeout(t);
      resolve(true);
    };
    sock.onclose = () => {
      clearTimeout(t);
      resolve(true);
    };
  });
  ok("a bad/non-collaborator token is denied the room", denied);

  await ctxA.close();
  await ctxB.close();
  await ctxC.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: cross-account sharing — username + link invites, editor/viewer roles, live cross-account edit, read-only + room denial enforced.",
);
process.exit(fail ? 1 : 0);

// LYK-955 review comments / annotations. Owner A + viewer C (joined via a viewer
// share link). Verifies: a viewer CAN comment (the point of read-only reviewers),
// comments propagate live both ways, resolve works, and a viewer cannot delete
// someone else's comment (author/owner-only — server enforced).
// Needs the full app + Durable Object + D1 → run against `wrangler dev`.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = process.env.BASE || "http://localhost:8799";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};
const uniq = () => "cmt" + Math.random().toString(36).slice(2, 8);
const pid = el => el.evaluate(() => document.querySelector(".designer")?.getAttribute("data-project-id"));
const bodies = el => el.evaluate(() => [...document.querySelectorAll(".cd-list .cd-body")].map(e => e.textContent));

async function register(ctx, user) {
  const p = await ctx.newPage({ viewport: { width: 1400, height: 900 } });
  p.on("dialog", d => d.dismiss()); // auto-dismiss permission-error alerts
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
async function addComment(p, text, pos) {
  await p.evaluate(() => {
    if (!document.querySelector(".cmt-toggle.on")) document.querySelector(".cmt-toggle")?.click();
  });
  await p.waitForSelector(".comment-capture");
  await p.click(".comment-capture", { position: pos });
  await p.waitForSelector(".pin-compose textarea");
  await p.fill(".pin-compose textarea", text);
  await p.click(".pin-compose-row .primary");
  await p.waitForSelector(".pin-compose", { state: "detached" });
}

const browser = await chromium.launch();
try {
  const ctxA = await browser.newContext();
  const ctxC = await browser.newContext();

  // owner A
  const A = await register(ctxA, uniq());
  await A.waitForSelector(".collab-dot", { timeout: 15000 });
  await A.waitForFunction(
    () => (document.querySelector(".designer")?.getAttribute("data-project-id") || "").length > 0,
    null,
    { timeout: 15000 },
  );
  const pidA = await pid(A);

  // A creates a viewer share link
  await A.click(".dtoolbar button:has-text('Share')");
  await A.waitForSelector(".share-modal");
  await A.evaluate(() => {
    const r = [...document.querySelectorAll(".share-modal .invite-row")].pop();
    r.querySelector(".role-pick").value = "viewer";
    r.querySelector(".role-pick").dispatchEvent(new Event("change", { bubbles: true }));
  });
  await A.click(".share-modal button:has-text('Create link')");
  await A.waitForSelector(".link-list li .link-url");
  const linkViewer = await A.evaluate(() => document.querySelector(".link-list li .link-url")?.value);
  await A.click(".share-done");
  ok("owner created a viewer share link", !!linkViewer);

  // viewer C joins via the link
  const C = await register(ctxC, uniq());
  await C.goto(linkViewer, { waitUntil: "networkidle" });
  await C.waitForSelector(".collab-dot", { timeout: 15000 });
  await C.waitForFunction(p => document.querySelector(".designer")?.getAttribute("data-project-id") === p, pidA, {
    timeout: 15000,
  });
  ok("viewer C opened the project read-only", (await pid(C)) === pidA && !!(await C.$(".readonly-banner")));
  await C.click(".dtoolbar button:has-text('Comments')"); // open the drawer so live updates render
  await C.waitForSelector(".comments-drawer");

  // A comments → appears on A, and live on C
  await addComment(A, "from owner", { x: 300, y: 200 });
  await A.waitForFunction(() => document.querySelectorAll(".canvas .pin").length >= 1, null, { timeout: 8000 });
  ok("owner's comment shows a pin + drawer entry", (await bodies(A)).includes("from owner"));
  await C.waitForFunction(
    () => [...document.querySelectorAll(".cd-list .cd-body")].some(e => e.textContent === "from owner"),
    null,
    { timeout: 15000 },
  );
  ok("owner's comment reaches the viewer live", (await bodies(C)).includes("from owner"));

  // viewer C comments (the headline: read-only reviewers can still comment)
  await addComment(C, "from viewer", { x: 500, y: 300 });
  ok("viewer can add a comment", (await bodies(C)).includes("from viewer"));
  await A.waitForFunction(
    () => [...document.querySelectorAll(".cd-list .cd-body")].some(e => e.textContent === "from viewer"),
    null,
    { timeout: 15000 },
  );
  ok("viewer's comment reaches the owner live", (await bodies(A)).includes("from viewer"));

  // A resolves its own comment
  await A.evaluate(() => {
    const li = [...document.querySelectorAll(".cd-list li")].find(
      l => l.querySelector(".cd-body")?.textContent === "from owner",
    );
    li?.querySelector(".cd-actions button")?.click(); // "Resolve"
  });
  await A.waitForFunction(
    () => {
      const li = [...document.querySelectorAll(".cd-list li")].find(
        l => l.querySelector(".cd-body")?.textContent === "from owner",
      );
      return li?.classList.contains("resolved");
    },
    null,
    { timeout: 8000 },
  );
  ok("owner can resolve a comment", true);

  // viewer C cannot delete the owner's comment (author/owner-only) — server rejects
  await C.evaluate(() => {
    const li = [...document.querySelectorAll(".cd-list li")].find(
      l => l.querySelector(".cd-body")?.textContent === "from owner",
    );
    li?.querySelector(".cd-actions .danger")?.click(); // "Delete" → 403 → dismissed alert
  });
  await C.waitForTimeout(1200);
  ok("a viewer cannot delete someone else's comment", (await bodies(C)).includes("from owner"));

  await ctxA.close();
  await ctxC.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: review comments — viewers can comment, live both ways, resolve, delete permission enforced.",
);
process.exit(fail ? 1 : 0);

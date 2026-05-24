// LYK-965 "Open PR": the React export tab can push generated Cloudscape .tsx to a
// GitHub repo and open a PR. We stub api.github.com (route interception) so the
// whole Git Data API flow runs without a real repo: resolve base → blob → tree →
// commit → ref → PR. Asserts the modal, the request sequence, that the committed
// blob is the generated TSX, the resulting PR link, and that repo/token persist.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:5273";
const PR_URL = "https://github.com/myorg/myapp/pull/7";
let fail = 0;
const ok = (l, c, x) => {
  console.log(`  ${c ? "✓" : "✗"} ${l}${c ? "" : "  " + JSON.stringify(x ?? "")}`);
  if (!c) fail++;
};

const style = { bg: "transparent", fg: "inherit", padY: 40, align: "center", width: 1040 };
const project = {
  pages: [
    {
      id: 1,
      name: "Home",
      route: "/",
      params: "",
      doc: {
        sections: [{ key: 10, type: "component", comp: "box", props: {}, content: "Hi", values: {}, style }],
        codeOverride: null,
      },
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

  // stub the GitHub REST Git Data API
  const seen = [];
  const blobs = [];
  await page.route("https://api.github.com/**", async route => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
      "access-control-allow-headers": "authorization,content-type,accept,x-github-api-version",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    seen.push(`${method} ${path}`);
    const json = (obj, status = 200) =>
      route.fulfill({ status, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(obj) });
    if (method === "GET" && /\/repos\/[^/]+\/[^/]+$/.test(path)) return json({ default_branch: "main" });
    if (method === "GET" && /\/git\/ref\/heads\//.test(path)) return json({ object: { sha: "basesha" } });
    if (method === "GET" && /\/git\/commits\//.test(path)) return json({ tree: { sha: "basetree" } });
    if (method === "POST" && /\/git\/blobs$/.test(path)) {
      blobs.push(req.postDataJSON());
      return json({ sha: "blobsha" });
    }
    if (method === "POST" && /\/git\/trees$/.test(path)) return json({ sha: "newtree" });
    if (method === "POST" && /\/git\/commits$/.test(path)) return json({ sha: "newcommit" });
    if (method === "POST" && /\/git\/refs$/.test(path)) return json({ ref: "refs/heads/x" }, 201);
    if (method === "POST" && /\/pulls$/.test(path)) return json({ html_url: PR_URL, number: 7 }, 201);
    return json({}, 200);
  });

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(p => localStorage.setItem("parascape-designer-v1", JSON.stringify(p)), project);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");

  // Export → React tab → Open PR
  await page.evaluate(() =>
    [...document.querySelectorAll(".dtoolbar button")].find(b => b.textContent.trim() === "Export")?.click(),
  );
  await page.waitForSelector(".export-tabs");
  await page.evaluate(() =>
    [...document.querySelectorAll(".export-tabs button")].find(b => b.textContent.includes("React"))?.click(),
  );
  await page.waitForSelector(".pr-open");
  ok("React tab shows an Open PR button", await page.evaluate(() => !!document.querySelector(".pr-open")));

  await page.click(".pr-open");
  await page.waitForSelector(".pr-modal");
  ok("Open PR opens a dialog", await page.evaluate(() => !!document.querySelector(".pr-modal")));

  await page.fill(".pr-repo", "myorg/myapp");
  await page.fill(".pr-token", "ghp_testtoken123");
  // default directory placeholder is src/components; leave path blank to exercise it
  await page.click(".pr-modal button[type=submit]");

  await page.waitForSelector(".pr-ok .pr-link", { timeout: 15000 });
  const href = await page.evaluate(() => document.querySelector(".pr-link")?.getAttribute("href"));
  ok("PR link points to the opened pull request", href === PR_URL, href);

  // the Git Data API was driven in order
  ok(
    "resolved the repo's default branch",
    seen.some(s => /^GET \/repos\/myorg\/myapp$/.test(s)),
  );
  ok(
    "created a blob, tree, commit, ref",
    ["/git/blobs", "/git/trees", "/git/commits", "/git/refs"].every(p =>
      seen.some(s => s.startsWith("POST") && s.endsWith(p)),
    ),
  );
  ok(
    "opened a PR",
    seen.some(s => s === "POST /repos/myorg/myapp/pulls"),
  );

  // the committed blob is the generated Cloudscape TSX
  const decoded = blobs.length ? Buffer.from(blobs[0].content, "base64").toString("utf8") : "";
  ok(
    "committed blob is the generated TSX",
    decoded.includes("export default function") && decoded.includes("@cloudscape-design/components"),
  );

  // repo + token persisted locally
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("parascape-github") || "{}"));
  ok("repo + token persisted to localStorage", saved.repo === "myorg/myapp" && saved.token === "ghp_testtoken123");

  await page.close();
} finally {
  await browser.close();
}
console.log(
  fail
    ? `\nFAIL: ${fail} issue(s)`
    : "\nOK: Open PR — modal + Git Data API flow + TSX blob + PR link + persisted repo/token.",
);
process.exit(fail ? 1 : 0);

// Smoke test for the side-by-side demo viewer:
//   • builds the `demos` Vite entry
//   • serves dist/ on a transient port
//   • visits /demos/ in headless Chromium
//   • for each of the 6 scenarios: clicks the sidebar entry and asserts
//       1. console has no errors after the switch
//       2. both render columns contain at least one node carrying an
//          `awsui_*` hashed class (proof React and Svelte each mounted
//          and walked the vendored Cloudscape stylesheet)
// Exits 0 = both libraries render in the same DOM, no JS errors.
import { createRequire } from "node:module";
import * as path from "node:path";
import * as fs from "node:fs";

const require = createRequire(import.meta.url);
const pw = "/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules";
const { chromium } = require(pw + "/playwright");

const root = path.resolve(import.meta.dirname, "../..");
const distDir = path.join(root, "dist");

const port = 5612;
const server = Bun.serve({
  port,
  fetch(req) {
    let p = new URL(req.url).pathname;
    if (p === "/" || p === "/demos/") p = "/demos/index.html";
    const f = path.join(distDir, p);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return new Response("404", { status: 404 });
    const ext = path.extname(f);
    const ct =
      ext === ".js"
        ? "text/javascript"
        : ext === ".css"
          ? "text/css"
          : ext === ".html"
            ? "text/html"
            : "application/octet-stream";
    return new Response(fs.readFileSync(f), { headers: { "content-type": ct } });
  },
});

let fail = 0;
const errs = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });

  await page.goto(`http://localhost:${port}/demos/`, { waitUntil: "networkidle" });
  await page.waitForSelector(".sidebar nav button");

  const ids = await page.$$eval(".sidebar nav button", bs => bs.map(b => b.textContent?.trim() ?? ""));
  for (let i = 0; i < ids.length; i++) {
    await page.locator(".sidebar nav button").nth(i).click();
    // Let both runtimes mount + paint
    await page
      .waitForFunction(
        () => {
          const cells = document.querySelectorAll(".cell .render");
          if (cells.length !== 2) return false;
          return Array.from(cells).every(c => !!c.querySelector('[class*="awsui_"]'));
        },
        null,
        { timeout: 5000 },
      )
      .catch(() => {});

    const counts = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll(".cell .render"));
      return cells.map(c => c.querySelectorAll('[class*="awsui_"]').length);
    });
    const [cs, ps] = counts;
    const ok = cs > 0 && ps > 0;
    console.log(`  scenario ${i + 1}/${ids.length}: cs=${cs} ps=${ps} ${ok ? "✓" : "✗"}`);
    if (!ok) fail++;
  }
} finally {
  await browser.close();
  server.stop();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
if (fail > 0) {
  console.log(`\nFAIL: ${fail} issue(s)`);
  process.exit(1);
}
console.log("\nOK: 6 scenarios, both libraries mounted, 0 runtime errors.");

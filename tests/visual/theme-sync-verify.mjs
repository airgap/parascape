// Verifies the site-wide light/dark/auto theme against the running dev server
// (http://localhost:5273). For every page (home, demos, components, builder,
// designer) it asserts:
//   1. SiteNav renders the shared theme toggle
//   2. cycling to Dark sets <html data-theme="dark"> + body.awsui-dark-mode and
//      actually darkens the body + nav surfaces
//   3. cycling to Light reverses all of that and lightens the surfaces
//   4. the choice persists in localStorage under the one shared key
// Then a cross-page check: set Dark on the home page and confirm the designer
// loads already dark (no toggle) — proves the no-flash script + shared key sync.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pw = "/raid/Parascape/node_modules";
const { chromium } = require(pw + "/playwright");

const BASE = "http://localhost:5273";
const PAGES = [
  { id: "home", url: "/" },
  { id: "demos", url: "/demos/" },
  { id: "components", url: "/components/" },
  { id: "builder", url: "/builder/" },
  { id: "designer", url: "/designer/" },
];

let fail = 0;
const errs = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) fail++;
};
const lum = rgb => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || "");
  if (!m) return -1;
  return (+m[1] + +m[2] + +m[3]) / 3;
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });

  const surfaces = () =>
    page.evaluate(() => {
      const nav = document.querySelector(".site-topnav");
      return {
        theme: document.documentElement.getAttribute("data-theme"),
        pref: document.documentElement.getAttribute("data-theme-pref"),
        awsui: document.body.classList.contains("awsui-dark-mode"),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        navBg: nav ? getComputedStyle(nav).backgroundColor : null,
        saved: localStorage.getItem("parascape-theme"),
      };
    });

  // cycle the toggle until the label reads `want`
  const setTheme = async want => {
    for (let i = 0; i < 4; i++) {
      const label = (await page.locator(".site-topnav .theme-label").textContent())?.trim();
      if (label === want) return true;
      await page.locator(".site-topnav .theme-toggle").click();
      await page.waitForTimeout(80);
    }
    return false;
  };

  for (const p of PAGES) {
    console.log(`\n[${p.id}]`);
    await page.goto(BASE + p.url, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.removeItem("parascape-theme"));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".site-topnav .theme-toggle", { timeout: 8000 });
    ok("SiteNav theme toggle present", true);

    await setTheme("Dark");
    const d = await surfaces();
    ok(`Dark: html[data-theme]=dark, body.awsui-dark-mode (${d.theme}, ${d.awsui})`, d.theme === "dark" && d.awsui);
    ok(`Dark: body surface is dark (lum ${lum(d.bodyBg).toFixed(0)})`, lum(d.bodyBg) >= 0 && lum(d.bodyBg) < 90);
    ok(`Dark: nav surface is dark (lum ${lum(d.navBg).toFixed(0)})`, lum(d.navBg) >= 0 && lum(d.navBg) < 110);
    ok("Dark: persisted to shared key", d.saved === "dark");

    await setTheme("Light");
    const l = await surfaces();
    ok(`Light: html[data-theme]=light, no awsui-dark-mode (${l.theme}, ${l.awsui})`, l.theme === "light" && !l.awsui);
    ok(`Light: body surface is light (lum ${lum(l.bodyBg).toFixed(0)})`, lum(l.bodyBg) > 200);
    ok(`Light: nav surface is light (lum ${lum(l.navBg).toFixed(0)})`, lum(l.navBg) > 200);
    ok("Light: persisted to shared key", l.saved === "light");
  }

  // --- cross-page sync + no-flash ---
  console.log("\n[cross-page sync]");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await setTheme("Dark");
  await page.goto(BASE + "/designer/", { waitUntil: "domcontentloaded" });
  const x = await surfaces();
  ok("designer loads already dark after setting dark on home", x.theme === "dark" && x.awsui && x.saved === "dark");
  ok(
    `designer body surface dark on first paint (lum ${lum(x.bodyBg).toFixed(0)})`,
    lum(x.bodyBg) >= 0 && lum(x.bodyBg) < 90,
  );
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: theme syncs light/dark/auto across all 5 pages.");
process.exit(fail ? 1 : 0);

// Verifies the P0 builder gaps: undo/redo (LYK-926), layers/outline panel
// (LYK-927), and keyboard shortcuts + clipboard (LYK-928).
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules/playwright");

const BASE = "http://localhost:5273";
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
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });
  const fresh = async () => {
    await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".canvas .sec");
  };

  // ───────── Undo / redo (LYK-926) ─────────
  await fresh();
  const start = await count(page); // 5 starter sections
  await page.locator(".add-tabs button", { hasText: "Sections" }).click();
  await page.locator(".add-item", { hasText: "Hero" }).first().click(); // append → start+1
  await page.waitForTimeout(150);
  ok(`add section → ${start + 1}`, (await count(page)) === start + 1);

  await page.locator('.histbtns button[title^="Undo"]').click();
  await page.waitForTimeout(150);
  ok("toolbar Undo reverts the add", (await count(page)) === start);
  await page.locator('.histbtns button[title^="Redo"]').click();
  await page.waitForTimeout(150);
  ok("toolbar Redo re-applies", (await count(page)) === start + 1);

  // keyboard undo (focus the canvas first so it's not an editable target)
  await page.locator(".canvas").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Control+z");
  await page.waitForTimeout(150);
  ok("Ctrl+Z undoes", (await count(page)) === start);
  await page.keyboard.press("Control+Shift+z");
  await page.waitForTimeout(150);
  ok("Ctrl+Shift+Z redoes", (await count(page)) === start + 1);

  // ───────── Layers panel (LYK-927) ─────────
  await fresh();
  const topRows = await page.$$eval(".layers .layer-row", n => n.length);
  ok(`layers panel lists the ${topRows} sections`, topRows === (await count(page)));
  // select via the panel
  await page.locator(".layers .layer-row").nth(1).click();
  await page.waitForTimeout(120);
  const selInPanel = await page.evaluate(() => !!document.querySelector(".layers .layer-row.sel"));
  ok("clicking a layer selects it", selInPanel);

  // nest a Link in a Container, confirm an indented child row appears
  await page.locator(".add-tabs button", { hasText: "Components" }).click();
  await page.fill(".comp-search", "container");
  await page
    .locator(".add-item.compact", { hasText: /^\+ Container$/ })
    .first()
    .click();
  await page.waitForSelector(".canvas .sec .pdrop[data-drop]");
  await page.fill(".comp-search", "link");
  await page
    .locator(".add-item.compact", { hasText: /^\+ Link$/ })
    .first()
    .dragTo(page.locator(".canvas .sec .pdrop[data-drop]").last());
  await page.waitForTimeout(300);
  const linkRow = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".layers .layer-row")];
    const r = rows.find(x => /Link/.test(x.querySelector(".layer-label")?.textContent || ""));
    return r ? parseInt(r.style.paddingLeft) : -1;
  });
  ok(`nested Link shows as an indented layer row (padding-left ${linkRow}px)`, linkRow > 8);

  // delete a nested node from the panel
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".layers .layer-row")];
    const r = rows.find(x => /Link/.test(x.querySelector(".layer-label")?.textContent || ""));
    r?.querySelector(".layer-del")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForTimeout(150);
  const linkGone = await page.evaluate(
    () =>
      ![...document.querySelectorAll(".layers .layer-row .layer-label")].some(l => /Link/.test(l.textContent || "")),
  );
  ok("delete from the layers panel removes the node", linkGone);

  // ───────── Keyboard + clipboard (LYK-928) ─────────
  await fresh();
  const n0 = await count(page);
  await page.locator(".layers .layer-row").first().click(); // select first section
  await page.keyboard.press("Delete");
  await page.waitForTimeout(150);
  ok(`Delete removes the selected section (${n0} → ${await count(page)})`, (await count(page)) === n0 - 1);

  // copy + paste a top-level section
  await page.locator(".layers .layer-row").first().click();
  await page.keyboard.press("Control+c");
  await page.keyboard.press("Control+v");
  await page.waitForTimeout(150);
  const afterPaste = await count(page);
  ok(`Ctrl+C / Ctrl+V pastes a copy (→ ${afterPaste})`, afterPaste === n0); // (n0-1) + 1
  await page.keyboard.press("Control+z");
  await page.waitForTimeout(150);
  ok("Ctrl+Z undoes the paste", (await count(page)) === n0 - 1);
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: undo/redo, layers panel, and keyboard/clipboard all work.");
process.exit(fail ? 1 : 0);

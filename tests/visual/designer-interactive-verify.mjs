// Verifies that pages authored in the Designer's Code Mode are genuinely
// interactive in the live preview — forms validate + submit, and click handlers
// run and update state. (The preview is a real mounted Svelte component, so
// <script> logic, signals and event handlers all execute.)
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

// A validated, submittable form + a click-counting button — pure .pui logic.
const APP = `<script lang="pts">
	import Button from '@parascape-design/components/button';
	signal email = '';
	signal error = '';
	signal done = '';
	signal clicks = 0;
	function submit() {
		error = /.+@.+\\..+/.test(email) ? '' : 'Enter a valid email';
		done = error ? '' : 'Submitted ' + email;
	}
</script>

<div class="page">
	<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
		<input class="email" value={email} oninput={(e) => (email = e.target.value)} placeholder="you@example.com" />
		<button class="go" type="submit">Submit</button>
	</form>
	{#if error}<p class="err">{error}</p>{/if}
	{#if done}<p class="ok">{done}</p>{/if}
	<Button variant="primary" onClick={() => clicks++}>Clicked {clicks}</Button>
</div>
`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errs.push("console.error: " + m.text());
  });

  await page.goto(`${BASE}/designer/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("parascape-designer-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".canvas .sec");
  await page.locator(".dtoolbar button", { hasText: /^Code$/ }).click();
  await page.waitForSelector(".code-ta");
  await page.fill(".code-ta", APP);
  await page.waitForSelector(".canvas form .email", { timeout: 8000 });
  ok("interactive page mounted (form + button rendered)", true);

  // invalid submit → validation error, no success
  await page.fill(".canvas .email", "not-an-email");
  await page.locator(".canvas .go").click();
  await page.waitForTimeout(200);
  let s = await page.evaluate(() => ({
    err: document.querySelector(".canvas .err")?.textContent || "",
    ok: document.querySelector(".canvas .ok")?.textContent || "",
  }));
  ok(`invalid input fails validation ("${s.err}")`, /valid email/i.test(s.err) && !s.ok);

  // valid submit → success, error cleared
  await page.fill(".canvas .email", "nicks@fuckin.email");
  await page.locator(".canvas .go").click();
  await page.waitForTimeout(200);
  s = await page.evaluate(() => ({
    err: document.querySelector(".canvas .err")?.textContent || "",
    ok: document.querySelector(".canvas .ok")?.textContent || "",
  }));
  ok(`valid input submits ("${s.ok}")`, /Submitted nicks@fuckin\.email/.test(s.ok) && !s.err);

  // a ported Button's onClick handler runs and updates state
  const btn = page.locator(".canvas button", { hasText: /Clicked/ });
  await btn.click();
  await btn.click();
  await page.waitForTimeout(150);
  const clicks = await page.evaluate(
    () => [...document.querySelectorAll(".canvas button")].map(b => b.textContent).find(t => /Clicked/.test(t)) || "",
  );
  ok(`ported Button onClick runs ("${clicks.trim()}")`, /Clicked\s*2/.test(clicks));
} finally {
  await browser.close();
}

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log("  " + e);
  fail += errs.length;
}
console.log(
  fail ? `\nFAIL: ${fail} issue(s)` : "\nOK: Code Mode pages are interactive — forms validate/submit, handlers run.",
);
process.exit(fail ? 1 : 0);

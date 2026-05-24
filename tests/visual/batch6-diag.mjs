// Box-model diagnostic for the 6-component batch (Toggle, RadioButton,
// Textarea, ToggleButton, Grid, LiveRegion). Finds which component's
// height delta is cascading the 4px dim difference. Prints __w/__h +
// key box props, DIFFS only.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import * as fs from 'node:fs';

const require = createRequire(import.meta.url);
const pw = '/raid/Parascape/node_modules';
const { chromium } = require(pw + '/playwright');
const root = path.resolve(fileURLToPath(import.meta.url), '../../..');

const serve = (dir, port) =>
	Bun.serve({
		port,
		fetch(req) {
			let p = new URL(req.url).pathname;
			if (p === '/') p = '/index.html';
			const f = path.join(dir, p);
			if (!fs.existsSync(f)) return new Response('404', { status: 404 });
			const ct = p.endsWith('.js')
				? 'text/javascript'
				: p.endsWith('.css')
					? 'text/css'
					: 'text/html';
			return new Response(fs.readFileSync(f), { headers: { 'content-type': ct } });
		},
	});

const PROPS = [
	'boxSizing',
	'display',
	'position',
	'width',
	'height',
	'paddingTop',
	'paddingBottom',
	'paddingLeft',
	'paddingRight',
	'marginTop',
	'marginBottom',
	'marginLeft',
	'marginRight',
	'borderTopWidth',
	'borderBottomWidth',
	'borderLeftWidth',
	'borderRightWidth',
	'verticalAlign',
	'lineHeight',
	'fontSize',
];
const TARGETS = {
	'toggle-control': '[class*="awsui_toggle-control"]',
	'toggle-handle': '[class*="awsui_toggle-handle"]',
	'radio-control': '[class*="awsui_radio-control"]',
	'radio-svg': '[class*="awsui_radio-control"] svg',
	'radio-circle-fill': '[class*="awsui_styled-circle-fill"]',
	textarea: 'textarea[class*="awsui_textarea"]',
	togglebtn: 'button[class*="awsui_button"][class*="awsui_variant-normal"]',
	grid: '[class*="awsui_grid"]:not([class*="grid-column"])',
	'grid-column': '[class*="awsui_grid-column"]',
};

async function probe(browser, url) {
	const page = await browser.newPage({
		viewport: { width: 640, height: 900 },
		deviceScaleFactor: 1,
	});
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.waitForSelector('#matrix', { state: 'attached' });
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(300);
	return page.evaluate(
		({ props, targets }) => {
			const out = {};
			for (const [label, sel] of Object.entries(targets)) {
				let el;
				try {
					el = document.querySelector(sel);
				} catch {
					el = null;
				}
				if (!el) {
					out[label] = { __missing: true };
					continue;
				}
				const cs = getComputedStyle(el);
				const r = el.getBoundingClientRect();
				const o = { __w: r.width.toFixed(2), __h: r.height.toFixed(2) };
				for (const p of props) o[p] = cs[p];
				out[label] = o;
			}
			return out;
		},
		{ props: PROPS, targets: TARGETS },
	);
}

const sP = serve(path.join(root, 'dist'), 5611);
const sC = serve(path.join(root, 'tests/visual/cloudscape-ref/dist-box'), 5612);
let browser;
try {
	browser = await chromium.launch();
} catch {
	browser = await chromium.launch({ channel: 'chrome' });
}
const P = await probe(browser, 'http://localhost:5611/tests/visual/box-fixture/box.html');
const C = await probe(browser, 'http://localhost:5612/');
await browser.close();
sP.stop();
sC.stop();

for (const label of Object.keys(TARGETS)) {
	const p = P[label],
		c = C[label];
	if (p?.__missing || c?.__missing) {
		console.log(`\n[${label}]  MISSING  P=${!!p?.__missing} C=${!!c?.__missing}`);
		continue;
	}
	const diffs = Object.keys(p).filter((k) => p[k] !== c[k]);
	if (diffs.length === 0) {
		console.log(`\n[${label}]  identical (w=${p.__w} h=${p.__h})`);
		continue;
	}
	console.log(`\n[${label}]  DIFFS:`);
	for (const k of diffs)
		console.log(`  ${k}:  ${JSON.stringify(p[k])}  vs  ${JSON.stringify(c[k])}`);
}

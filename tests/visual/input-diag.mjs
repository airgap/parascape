// Computed box-model diagnostic for the Input/TextFilter band residual
// (matrix diff localized to y=1840-2080). Same technique as table-diag:
// compare corresponding Input elements Parascape vs real Cloudscape and
// print only the DIFFS.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import * as fs from 'node:fs';

const require = createRequire(import.meta.url);
const pw = '/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules';
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
	'width',
	'height',
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
	'marginTop',
	'marginRight',
	'marginBottom',
	'marginLeft',
	'borderTopWidth',
	'borderRightWidth',
	'borderBottomWidth',
	'borderLeftWidth',
	'borderRadius',
	'borderColor',
	'borderStyle',
	'backgroundColor',
	'color',
	'fontSize',
	'fontFamily',
	'lineHeight',
	'fontWeight',
	'textAlign',
	'outlineWidth',
	'boxShadow',
];
// nth container in the matrix grid: input-container appears once per Input.
// Use stable class substrings (vendored hashes identical both sides).
const TARGETS = {
	'input-container(1)': '[class*="awsui_input-container"]',
	'input(1)': '[class*="awsui_input-container"] input',
	'search-container': '[class*="awsui_input-container"]:has(input[type="search"])',
	'search-input': '[class*="awsui_input-container"] input[type="search"]',
	'search-left-icon': '[class*="awsui_input-icon-left"]',
	'tf-root': '[class*="awsui_root"]:has(> [class*="awsui_input-container"])',
};

async function probe(browser, url) {
	const page = await browser.newPage({
		viewport: { width: 640, height: 900 },
		deviceScaleFactor: 1,
	});
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.waitForSelector('[class*="awsui_input-container"] input');
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(250);
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

const sP = serve(path.join(root, 'dist'), 5481);
const sC = serve(path.join(root, 'tests/visual/cloudscape-ref/dist-box'), 5482);
let browser;
try {
	browser = await chromium.launch();
} catch {
	browser = await chromium.launch({ channel: 'chrome' });
}
const P = await probe(browser, 'http://localhost:5481/tests/visual/box-fixture/box.html');
const C = await probe(browser, 'http://localhost:5482/');
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
		console.log(`\n[${label}]  identical`);
		continue;
	}
	console.log(`\n[${label}]  DIFFS:`);
	for (const k of diffs)
		console.log(`  ${k}:  ${JSON.stringify(p[k])}  vs  ${JSON.stringify(c[k])}`);
}

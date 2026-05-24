// Computed box-model diagnostic for the Divider <hr>: Parascape vs real
// Cloudscape. Dumps the box-model-relevant computed styles + rect for
// the first <hr> in #matrix on each side and prints only the DIFFS.
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
	'height',
	'blockSize',
	'minBlockSize',
	'maxBlockSize',
	'marginTop',
	'marginBottom',
	'marginBlockStart',
	'marginBlockEnd',
	'paddingTop',
	'paddingBottom',
	'paddingBlockStart',
	'paddingBlockEnd',
	'borderTopWidth',
	'borderBottomWidth',
	'borderBlockStartWidth',
	'borderBlockEndWidth',
	'borderTopStyle',
	'borderBottomStyle',
	'borderBlockStartStyle',
	'borderBlockEndStyle',
	'borderTopColor',
	'borderBottomColor',
	'lineHeight',
	'overflow',
	'color',
	'opacity',
];

async function probe(browser, url) {
	const page = await browser.newPage({
		viewport: { width: 640, height: 900 },
		deviceScaleFactor: 1,
	});
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.waitForSelector('#matrix hr', { state: 'attached' });
	await page.evaluate(() => document.fonts.ready);
	return page.evaluate((props) => {
		const hr = document.querySelector('#matrix hr');
		const cs = getComputedStyle(hr);
		const r = hr.getBoundingClientRect();
		const out = {
			__tag: hr.tagName,
			__class: hr.className,
			__rectH: r.height.toFixed(3),
			__rectW: r.width.toFixed(3),
		};
		for (const p of props) out[p] = cs[p];
		// also parent box so we see if the 1px is the hr or its wrapper
		const pr = hr.parentElement.getBoundingClientRect();
		out.__parentRectH = pr.height.toFixed(3);
		return out;
	}, PROPS);
}

const sP = serve(path.join(root, 'dist'), 5471);
const sC = serve(path.join(root, 'tests/visual/cloudscape-ref/dist-box'), 5472);
let browser;
try {
	browser = await chromium.launch();
} catch {
	browser = await chromium.launch({ channel: 'chrome' });
}
const P = await probe(browser, 'http://localhost:5471/tests/visual/box-fixture/box.html');
const C = await probe(browser, 'http://localhost:5472/');
await browser.close();
sP.stop();
sC.stop();

console.log('Parascape hr class:', P.__class);
console.log('Cloudscape hr class:', C.__class);
console.log('\n--- DIFFS (Parascape  vs  Cloudscape) ---');
let any = false;
for (const k of Object.keys(P)) {
	if (P[k] !== C[k]) {
		console.log(`  ${k}:  ${JSON.stringify(P[k])}   vs   ${JSON.stringify(C[k])}`);
		any = true;
	}
}
if (!any) console.log('  (no computed-style/rect diffs — 1px is elsewhere)');

// Walk matched anchor rows down the matrix, print y-top P vs C, and the
// running delta — pinpoints which row injects the 4px cascade.
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

const MARKS = [
	'awsui_status-indicator',
	'awsui_link',
	'awsui_toggle-control',
	'awsui_radio-control',
	'awsui_textarea',
	'awsui_grid-column',
];

async function probe(browser, url) {
	const page = await browser.newPage({
		viewport: { width: 640, height: 900 },
		deviceScaleFactor: 1,
	});
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.waitForSelector('#matrix', { state: 'attached' });
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(300);
	return page.evaluate((marks) => {
		const out = {};
		for (const m of marks) {
			const el = document.querySelector('[class*="' + m + '"]');
			out[m] = el ? +el.getBoundingClientRect().top.toFixed(2) : null;
		}
		out.__matrixH = +document.querySelector('#matrix').getBoundingClientRect().height.toFixed(2);
		return out;
	}, MARKS);
}

const sP = serve(path.join(root, 'dist'), 5711);
const sC = serve(path.join(root, 'tests/visual/cloudscape-ref/dist-box'), 5712);
let browser;
try {
	browser = await chromium.launch();
} catch {
	browser = await chromium.launch({ channel: 'chrome' });
}
const P = await probe(browser, 'http://localhost:5711/tests/visual/box-fixture/box.html');
const C = await probe(browser, 'http://localhost:5712/');
await browser.close();
sP.stop();
sC.stop();

console.log('label'.padEnd(26), 'P'.padStart(9), 'C'.padStart(9), 'Δ'.padStart(7));
for (const m of [...MARKS, '__matrixH']) {
	const p = P[m],
		c = C[m];
	const d = p === null || c === null ? 'MISS' : (p - c).toFixed(2);
	console.log(m.padEnd(26), String(p).padStart(9), String(c).padStart(9), String(d).padStart(7));
}

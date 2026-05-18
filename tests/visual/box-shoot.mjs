// Box-primitive parity diff: Parascape Box.pui matrix vs the REAL
// @cloudscape-design/components <Box> matrix (identical content/props).
// Parity is by construction (same tag + same vendored hashed classes +
// Cloudscape's own box.scoped.css) — expect near-0; residual localizes
// real deltas (global reset / fonts).
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import * as fs from 'node:fs';

const require = createRequire(import.meta.url);
const pw = '/raid/lyku/node_modules/.bun/playwright@1.60.0/node_modules';
const { chromium } = require(pw + '/playwright');
const pixelmatch =
	require(path.join(process.cwd(), 'node_modules/pixelmatch')).default ??
	require(path.join(process.cwd(), 'node_modules/pixelmatch'));
const { PNG } = require(path.join(process.cwd(), 'node_modules/pngjs'));

const root = path.resolve(fileURLToPath(import.meta.url), '../../..');
const outDir = path.join(root, 'tests/visual/__screenshots__');
fs.mkdirSync(outDir, { recursive: true });

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

async function shoot(browser, url, out) {
	const page = await browser.newPage({
		viewport: { width: 640, height: 900 },
		deviceScaleFactor: 1,
	});
	await page.addInitScript(() => {
		const s = document.createElement('style');
		s.textContent = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;
		document.documentElement.appendChild(s);
	});
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.waitForSelector('#matrix');
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(250);
	await page.locator('#matrix').screenshot({ path: out });
	await page.close();
}

const sP = serve(path.join(root, 'dist'), 5411);
const sC = serve(path.join(root, 'tests/visual/cloudscape-ref/dist-box'), 5412);
let browser;
try {
	browser = await chromium.launch();
} catch {
	browser = await chromium.launch({ channel: 'chrome' });
}
const pImg = path.join(outDir, 'box.parascape.png');
const cImg = path.join(outDir, 'box.cloudscape.png');
await shoot(browser, 'http://localhost:5411/tests/visual/box-fixture/box.html', pImg);
await shoot(browser, 'http://localhost:5412/', cImg);
await browser.close();
sP.stop();
sC.stop();

const a = PNG.sync.read(fs.readFileSync(pImg));
const b = PNG.sync.read(fs.readFileSync(cImg));
const w = Math.min(a.width, b.width);
const h = Math.min(a.height, b.height);
const crop = (src) => {
	const o = new PNG({ width: w, height: h });
	for (let y = 0; y < h; y++)
		src.data.copy(o.data, y * w * 4, y * src.width * 4, y * src.width * 4 + w * 4);
	return o;
};
const diff = new PNG({ width: w, height: h });
const mm = pixelmatch(crop(a).data, crop(b).data, diff.data, w, h, { threshold: 0.1 });
fs.writeFileSync(path.join(outDir, 'box.diff.png'), PNG.sync.write(diff));
console.log(`Parascape Box : ${a.width}x${a.height}`);
console.log(`Cloudscape Box: ${b.width}x${b.height}`);
console.log(`mismatch: ${mm}px = ${((mm / (w * h)) * 100).toFixed(2)}% of ${w}x${h}`);

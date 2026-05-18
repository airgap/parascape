// Regenerate src/lib/tokens/cloudscape.css's :root{} from the REAL
// @cloudscape-design/design-tokens (each export is
// `var(--name-hash, <real default>)` — carries Cloudscape's actual value
// and stays themable). Keeps my semantic var NAMES so `.pui` components
// don't change; only the values become authoritative. Unmapped tokens
// keep the prior approximation and are reported.
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const T = require('@cloudscape-design/design-tokens');
const root = path.resolve(fileURLToPath(import.meta.url), '../../..');
const cssPath = path.join(root, 'src/lib/tokens/cloudscape.css');
const css = fs.readFileSync(cssPath, 'utf8');

const kebabToCamel = (s) => s.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const SPACE = { xxs: 'Xxs', xs: 'Xs', s: 'S', m: 'M', l: 'L', xl: 'Xl', xxl: 'Xxl' };

// my-name -> ordered candidate Cloudscape export names
function candidates(name) {
	const m = name.match(/^--space-(xxs|xs|s|m|l|xl|xxl)$/);
	if (m) return [`spaceScaled${SPACE[m[1]]}`, `spaceStatic${SPACE[m[1]]}`];
	const c = kebabToCamel(name); // color-background-... -> colorBackground...
	const extra = [];
	if (name === '--color-text-button-primary') extra.push('colorTextButtonPrimaryDefault');
	if (name === '--color-border-container-default')
		extra.push('colorBorderContainerTop', 'colorBorderDividerDefault');
	if (name === '--color-border-item-focused')
		extra.push('colorBorderItemFocused', 'colorBorderItemFocusedDefault');
	if (name === '--color-background-button-primary-default')
		extra.push('colorBackgroundButtonPrimaryDefault');
	if (name === '--color-background-button-primary-hover')
		extra.push('colorBackgroundButtonPrimaryHover');
	return [c, ...extra];
}

const names = [...new Set([...css.matchAll(/(--[a-z0-9-]+):/g)].map((x) => x[1]))];
const prior = Object.fromEntries(
	[...css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((x) => [x[1], x[2].trim()]),
);

const lines = [];
const unmapped = [];
for (const n of names) {
	let val;
	for (const cand of candidates(n)) {
		if (T[cand] != null) {
			val = T[cand];
			break;
		}
	}
	if (val == null) {
		val = prior[n];
		unmapped.push(n);
	}
	lines.push(`\t${n}: ${val};`);
}

const rootBlock = `:root {\n${lines.join('\n')}\n}`;
const next = css.replace(/:root\s*\{[\s\S]*?\n\}/, rootBlock);
fs.writeFileSync(cssPath, next);
console.log(
	`tokens: ${names.length}, real-mapped: ${names.length - unmapped.length}, kept-approx: ${unmapped.length}`,
);
if (unmapped.length) console.log('unmapped (kept approximation):', unmapped.join(', '));

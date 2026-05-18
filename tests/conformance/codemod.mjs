// Scales the Badge proof-of-concept across every ported .pui component.
//
// For each component it: (1) fetches Cloudscape's own test from GitHub,
// (2) applies ONLY the mechanical, characterized rewrites (the JSX is
// left intact — vitest's esbuild compiles it to the adapter's h()
// descriptor, so we never hand-parse JSX), (3) classifies the file.
//
// It does NOT pretend complex/interaction tests are done: files using
// fireEvent/userEvent/rerender/act/createRef/renderHook are TAGGED
// `manual` (emitted, but the summary counts them separately so the
// numbers stay honest). Missing vendored styles / no upstream test =
// reported, not faked.
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'tests/conformance');
const VENDOR = path.join(ROOT, 'src/lib/cloudscape');
const COMPS = path.join(ROOT, 'src/lib/components');

const pascalToKebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const ported = fs
	.readdirSync(COMPS)
	.filter((f) => f.endsWith('.pui'))
	.map((f) => f.replace('.pui', ''));

// Internal-only sub-components (no public Cloudscape test path).
const INTERNAL = new Set(['StructuredItem', 'Tooltip', 'Dropdown', 'IconProvider']);
const INTERACTION =
	/\b(fireEvent|userEvent|renderHook|\.rerender\(|act\(|createRef|waitFor|jest\.fn|vi\.fn)\b/;

const GH = (c) =>
	`https://raw.githubusercontent.com/cloudscape-design/components/main/src/${c}/__tests__/${c}.test.tsx`;

async function fetchTest(kebab) {
	try {
		const r = await fetch(GH(kebab));
		if (!r.ok) return null;
		const t = await r.text();
		return t && t.includes('describe(') ? t : null;
	} catch {
		return null;
	}
}

function adapt(src, Pascal, kebab) {
	let s = src;
	const notes = [];

	// 1. component import (default, possibly with named Props type)
	const impRe = new RegExp(
		`import\\s+${Pascal}(?:\\s*,\\s*\\{([^}]*)\\})?\\s+from\\s+['"][^'"]*${kebab}['"];?`,
	);
	const m = s.match(impRe);
	if (m && m[1]) {
		// a named `XxxProps` type import → neutralize its usages to `any`
		for (const id of m[1]
			.split(',')
			.map((x) => x.trim())
			.filter(Boolean)) {
			s = s.replace(new RegExp(`\\b${id}\\b`, 'g'), 'any');
		}
	}
	s = s.replace(impRe, `import ${Pascal} from '@components/${Pascal}.pui';`);

	// 2. ANY test-utils/dom import (default `createWrapper` and/or named
	//    {XxxWrapper, ElementWrapper}) → adapter (re-exports them all).
	s = s.replace(
		/import\s+(createWrapper)?\s*(?:,\s*)?(\{[^}]*\})?\s*from\s+['"][^'"]*test-utils\/dom['"];?/g,
		(full, def, named) => {
			const parts = [];
			if (def) parts.push(def);
			if (named) parts.push(named.replace(/[{}]/g, '').trim());
			return `import { ${parts.join(', ')} } from '@conformance/adapter';`;
		},
	);

	// 2b. secondary component imports (e.g. Alert imports Button) →
	//     the parity .pui if ported; else strip + note (the dependent
	//     assertions fail honestly rather than the file failing to load).
	s = s.replace(
		/import\s+([A-Za-z]\w*)\s+from\s+['"][^'"]*\/lib\/components\/([a-z][a-z-]*)['"];?/g,
		(full, id, kb) => {
			const Pas = kb.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
			if (fs.existsSync(path.join(COMPS, `${Pas}.pui`))) {
				return `import ${id} from '@components/${Pas}.pui';`;
			}
			notes.push(`unported dep ${kb}`);
			return `const ${id} = (() => null) as any; // unported dep: ${kb}`;
		},
	);

	// 2c. strip unresolvable test-only helpers (a11y matchers, mocks,
	//     i18n test providers, deep __tests__ utilities).
	s = s.replace(
		/import[^;]*?from\s+['"][^'"]*(?:__a11y__|to-validate-a11y|\/mocks|__tests__|i18n-test|analytics-metadata-test-utils)[^'"]*['"];?\n?/g,
		() => {
			notes.push('stripped a11y/mocks helper');
			return '';
		},
	);

	// 3. styles map → vendored (only if we actually vendored it)
	let stylesVendored = true;
	s = s.replace(/import\s+styles\s+from\s+['"][^'"]*styles\.css\.js['"];?/, () => {
		if (!fs.existsSync(path.join(VENDOR, `${kebab}.styles.js`))) {
			stylesVendored = false;
			return `import styles from '@cloudscape/${kebab}.styles.js'; // MISSING vendored styles`;
		}
		return `import styles from '@cloudscape/${kebab}.styles.js';`;
	});

	// 4. RTL imports → adapter. render → descriptor mount; fireEvent/
	//    waitFor/act → the framework-agnostic @testing-library/svelte
	//    equivalents (real DOM events + Svelte tick). 'screen'
	//    unsupported (note it).
	s = s.replace(
		/import\s+\{([^}]*)\}\s+from\s+['"]@testing-library\/react['"];?/,
		(full, names) => {
			const want = names
				.split(',')
				.map((x) => x.trim())
				.filter(Boolean);
			const supported = want.filter((n) => /^(render|fireEvent|waitFor|act)$/.test(n));
			const dropped = want.filter((n) => !supported.includes(n));
			return `import { ${supported.join(', ')} } from '@conformance/adapter';${
				dropped.length ? ` // unsupported: ${dropped.join(', ')}` : ''
			}`;
		},
	);

	// 5. React import → adapter shim (NOT deleted: helpers call
	//    React.createRef/forwardRef; JSX itself goes through h()).
	s = s.replace(
		/import\s+(?:\*\s+as\s+)?React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?/g,
		`import { React } from '@conformance/adapter';`,
	);
	s = s.replace(
		/import\s+\{([^}]*)\}\s+from\s+['"]react['"];?/g,
		`import { React } from '@conformance/adapter'; /* react named imports shimmed via React.* */`,
	);

	// 6. characterized DOM rule: container.firstChild → firstElementChild
	if (s.includes('.firstChild')) {
		s = s.replace(/\.firstChild\b/g, '.firstElementChild');
		notes.push('firstChild→firstElementChild');
	}

	const interaction = INTERACTION.test(s);
	if (interaction) notes.push('interaction (manual-triage tier)');
	if (!stylesVendored) notes.push('vendored styles missing');

	const header = `// AUTO-ADAPTED from cloudscape-design/components src/${kebab}/__tests__/
// ${kebab}.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, ${notes.length ? notes.join('; ') : 'no extra rules'}.
// JSX is compiled to the adapter h() descriptor by vitest esbuild.
${interaction ? '// ⚠ interaction tests present — see conformance summary; not all are mechanically valid.\n' : ''}`;

	return { code: header + s, interaction, stylesVendored };
}

const summary = { adapted: [], manual: [], noTest: [], internal: [], noStyles: [] };

for (const Pascal of ported.sort()) {
	if (INTERNAL.has(Pascal)) {
		summary.internal.push(Pascal);
		continue;
	}
	const kebab = pascalToKebab(Pascal);
	const src = await fetchTest(kebab);
	if (!src) {
		summary.noTest.push(`${Pascal} (${kebab})`);
		continue;
	}
	const { code, interaction, stylesVendored } = adapt(src, Pascal, kebab);
	fs.writeFileSync(path.join(OUT, `${kebab}.test.tsx`), code);
	if (!stylesVendored) summary.noStyles.push(Pascal);
	(interaction ? summary.manual : summary.adapted).push(`${Pascal} (${kebab})`);
}

const line = (k, a) => `${k.padEnd(22)} ${a.length}\n${a.length ? '  ' + a.join(', ') + '\n' : ''}`;
console.log(
	'\n=== codemod summary ===\n' +
		line('adapted (clean)', summary.adapted) +
		line('manual-triage (interaction)', summary.manual) +
		line('no upstream test', summary.noTest) +
		line('internal sub-component', summary.internal) +
		line('emitted, styles missing', summary.noStyles) +
		`\nEmitted ${summary.adapted.length + summary.manual.length} test files. ` +
		`Run: bun run conformance`,
);

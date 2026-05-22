// Section library for the Parascape site Designer. Each section is a Wix-style
// content block whose *content* is composed from real Parascape (Cloudscape)
// component ports — the designer compiles it live via the demos' live-compiler
// and stacks the sections vertically. The styled wrapper around each section
// (background / padding / alignment / width) is plain CSS owned by the
// designer; only the inner content is a compiled .pui component.

export type Field = { key: string; label: string; multiline?: boolean };

export type SectionStyle = {
	bg: string; // background color (or 'transparent')
	fg: string; // 'inherit' | 'light' (for dark backgrounds)
	padY: number; // vertical padding (px)
	align: 'left' | 'center' | 'right';
	width: number | 0; // content max-width (px); 0 = full bleed
};

export type SectionDef = {
	id: string;
	name: string;
	blurb: string;
	imports: string[]; // kebab component ids used in the markup
	fields: Field[];
	defaults: Record<string, string>;
	style: SectionStyle;
	markup: (f: Record<string, string>) => string;
};

const pascal = (id: string) =>
	id
		.split('-')
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join('');

// Escape user text so it is inert inside .pui markup (no template/expression
// or tag injection). `{` `}` start Svelte expressions; `<` starts a tag.
export const esc = (s: string) =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\{/g, '&#123;')
		.replace(/\}/g, '&#125;')
		.replace(/`/g, '&#96;');

const sty = (over: Partial<SectionStyle>): SectionStyle => ({
	bg: 'transparent',
	fg: 'inherit',
	padY: 64,
	align: 'center',
	width: 1040,
	...over,
});

export const SECTIONS: SectionDef[] = [
	{
		id: 'hero',
		name: 'Hero',
		blurb: 'Big headline, subtext, and a primary call to action.',
		imports: ['space-between', 'header', 'box', 'button'],
		fields: [
			{ key: 'title', label: 'Headline' },
			{ key: 'subtitle', label: 'Subtext', multiline: true },
			{ key: 'cta', label: 'Button label' },
		],
		defaults: {
			title: 'Build it in .pui',
			subtitle:
				'A Cloudscape-grade design system, composed visually. Every block here is a real Parascape component.',
			cta: 'Get started',
		},
		style: sty({ padY: 96, bg: '#0f1b2d', fg: 'light' }),
		markup: (f) => `<SpaceBetween size="l">
	<Header variant="h1">${esc(f.title)}</Header>
	<Box variant="p" fontSize="heading-s">${esc(f.subtitle)}</Box>
	<div><Button variant="primary">${esc(f.cta)}</Button></div>
</SpaceBetween>`,
	},
	{
		id: 'text',
		name: 'Text',
		blurb: 'A heading and a paragraph of body copy.',
		imports: ['space-between', 'header', 'box'],
		fields: [
			{ key: 'heading', label: 'Heading' },
			{ key: 'body', label: 'Body', multiline: true },
		],
		defaults: {
			heading: 'About this section',
			body: 'Replace this with your own copy. The heading and text are rendered by the ported Header and Box components.',
		},
		style: sty({ align: 'left', width: 760 }),
		markup: (f) => `<SpaceBetween size="s">
	<Header variant="h2">${esc(f.heading)}</Header>
	<Box variant="p" color="text-body-secondary">${esc(f.body)}</Box>
</SpaceBetween>`,
	},
	{
		id: 'features',
		name: 'Feature columns',
		blurb: 'Three side-by-side features in a column layout.',
		imports: ['space-between', 'header', 'box'],
		fields: [
			{ key: 't1', label: 'Feature 1 title' },
			{ key: 'b1', label: 'Feature 1 text', multiline: true },
			{ key: 't2', label: 'Feature 2 title' },
			{ key: 'b2', label: 'Feature 2 text', multiline: true },
			{ key: 't3', label: 'Feature 3 title' },
			{ key: 'b3', label: 'Feature 3 text', multiline: true },
		],
		defaults: {
			t1: 'Fast',
			b1: 'Signals over hooks — fine-grained reactivity with no virtual DOM.',
			t2: 'Familiar',
			b2: 'The Cloudscape component API you already know, ported to .pui.',
			t3: 'Composable',
			b3: 'Drop components onto a page and wire them up visually.',
		},
		style: sty({ width: 1040 }),
		markup: (
			f,
		) => `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px;text-align:left">
	<SpaceBetween size="xs"><Header variant="h3">${esc(f.t1)}</Header><Box variant="p" color="text-body-secondary">${esc(f.b1)}</Box></SpaceBetween>
	<SpaceBetween size="xs"><Header variant="h3">${esc(f.t2)}</Header><Box variant="p" color="text-body-secondary">${esc(f.b2)}</Box></SpaceBetween>
	<SpaceBetween size="xs"><Header variant="h3">${esc(f.t3)}</Header><Box variant="p" color="text-body-secondary">${esc(f.b3)}</Box></SpaceBetween>
</div>`,
	},
	{
		id: 'stats',
		name: 'Stats band',
		blurb: 'Three big numbers with labels.',
		imports: ['box'],
		fields: [
			{ key: 'v1', label: 'Stat 1 value' },
			{ key: 'l1', label: 'Stat 1 label' },
			{ key: 'v2', label: 'Stat 2 value' },
			{ key: 'l2', label: 'Stat 2 label' },
			{ key: 'v3', label: 'Stat 3 value' },
			{ key: 'l3', label: 'Stat 3 label' },
		],
		defaults: {
			v1: '74',
			l1: 'components',
			v2: '1:1',
			l2: 'Cloudscape API',
			v3: '0',
			l3: 'React hooks',
		},
		style: sty({ bg: '#f2f3f3' }),
		markup: (
			f,
		) => `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px">
	<Box textAlign="center"><Box variant="h1" fontSize="display-l" fontWeight="bold">${esc(f.v1)}</Box><Box variant="p" color="text-body-secondary">${esc(f.l1)}</Box></Box>
	<Box textAlign="center"><Box variant="h1" fontSize="display-l" fontWeight="bold">${esc(f.v2)}</Box><Box variant="p" color="text-body-secondary">${esc(f.l2)}</Box></Box>
	<Box textAlign="center"><Box variant="h1" fontSize="display-l" fontWeight="bold">${esc(f.v3)}</Box><Box variant="p" color="text-body-secondary">${esc(f.l3)}</Box></Box>
</div>`,
	},
	{
		id: 'cta',
		name: 'Call to action',
		blurb: 'A centered heading with a button.',
		imports: ['space-between', 'header', 'button'],
		fields: [
			{ key: 'title', label: 'Heading' },
			{ key: 'cta', label: 'Button label' },
		],
		defaults: { title: 'Ready to try it?', cta: 'Open the Builder' },
		style: sty({ padY: 72, bg: '#006ce0', fg: 'light' }),
		markup: (f) => `<SpaceBetween size="m">
	<Header variant="h2">${esc(f.title)}</Header>
	<div><Button variant="primary">${esc(f.cta)}</Button></div>
</SpaceBetween>`,
	},
	{
		id: 'footer',
		name: 'Footer',
		blurb: 'A small footer line.',
		imports: ['box'],
		fields: [{ key: 'text', label: 'Footer text' }],
		defaults: {
			text: '© 2026 Parascape — a for-funzies Cloudscape port. Not affiliated with AWS.',
		},
		style: sty({ padY: 28, bg: '#0f1b2d', fg: 'light' }),
		markup: (f) => `<Box fontSize="body-s">${esc(f.text)}</Box>`,
	},
];

export const SECTION_BY_ID: Record<string, SectionDef> = Object.fromEntries(
	SECTIONS.map((s) => [s.id, s]),
);

export function importLine(id: string): string {
	return `\timport ${pascal(id)} from '@parascape-design/components/${id}';`;
}

// A single section's content as a compilable .pui module (for live preview).
export function sectionSource(def: SectionDef, values: Record<string, string>): string {
	const imports = def.imports.map(importLine).join('\n');
	const v = { ...def.defaults, ...values };
	return `<script lang="pts">\n${imports}\n<\/script>\n\n${def.markup(v)}\n`;
}

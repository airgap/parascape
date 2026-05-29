// Standardized configurator core — pure functions that turn a component's
// manifest props (+ thin hints) into interactive controls, live props, and a
// code snippet. One engine, consumed by every component (see Configurator.pui).

export type PropInfo = {
	name: string;
	type: string;
	default: string | null;
	optional: boolean;
	bindable: boolean;
	kind: 'value' | 'event' | 'slot';
};

export type Hints = {
	/** Real option sets for props the manifest types loosely as `string`. */
	options?: Record<string, string[]>;
	/** Initial editable children text; presence also forces a children control. */
	children?: string;
	/** Fixed values for complex props the engine can't build a control for (e.g. items). */
	samples?: Record<string, unknown>;
	/** Props to hide from the panel. */
	hide?: string[];
	/** Components that can't be driven from plain data (need snippets / render
	 *  functions): show this note in the preview area instead of an empty box. */
	previewNote?: string;
};

export type Control =
	| { name: string; label: string; kind: 'toggle'; value: boolean }
	| { name: string; label: string; kind: 'select'; options: string[]; value: string }
	| { name: string; label: string; kind: 'text'; value: string }
	| { name: string; label: string; kind: 'number'; value: number | '' };

// Low-value / non-configurable props hidden from every panel.
const HIDE =
	/^(class|style|controlId|id|name|tabIndex|spellcheck|autoComplete|autoFocus|disableBrowserAutocorrect|inputMode|step|i18nStrings|nativeInputAttributes|nativeAttributes|ariaControls|ariaRequired|aria[A-Z].*|.*AriaLabel|.*AriaLabelledby|.*AriaDescribedby)$/;

const STRING_UNION = /^'[^']*'(\s*\|\s*'[^']*')+$/;

const humanize = (name: string): string => {
	const s = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ');
	return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const parseUnion = (type: string): string[] =>
	type.split('|').map((s) => s.trim().replace(/^'|'$/g, ''));

const isComplex = (type: string): boolean =>
	/Record<|=>|\bunknown\b|\bany\b|\[\]|Array<|^\{|\(/.test(type);

const acceptsString = (type: string): boolean => /\bstring\b/.test(type);

// Initial value from the manifest default, falling back per control kind.
const initValue = (def: string | null, kind: Control['kind'], options?: string[]): unknown => {
	if (kind === 'toggle') return def === 'true';
	// Optional numbers with no documented default start EMPTY (not 0): passing a
	// bare 0 for props like ContentLayout's maxContentWidth collapses the layout
	// (max-width:0 → one glyph per line). Empty → the prop is simply omitted.
	if (kind === 'number') return def != null && def !== '' ? Number(def) : '';
	const raw = def != null ? def.replace(/^['"]|['"]$/g, '') : '';
	if (kind === 'select') return options && options.includes(raw) ? raw : (options?.[0] ?? '');
	return raw === 'undefined' ? '' : raw;
};

export type Derived = {
	controls: Control[];
	hasChildren: boolean;
	childrenLabel: string;
	childrenInit: string;
};

/** Build the control set for one component from its manifest props + hints. */
export function deriveControls(props: PropInfo[], hints: Hints = {}): Derived {
	const hide = new Set(hints.hide ?? []);
	const controls: Control[] = [];
	let childrenSlot: PropInfo | undefined;

	for (const p of props) {
		if (p.kind === 'event') continue;
		if (p.name === 'children') {
			childrenSlot = p;
			continue;
		}
		// An explicit hint (options) means the author wants this prop shown, even
		// if it would otherwise be hidden (e.g. Icon's `name`, which the HIDE list
		// would drop as a form-field name attribute).
		const hinted = hints.options?.[p.name];
		if (!hinted && (HIDE.test(p.name) || hide.has(p.name))) continue;

		// Slots that accept a string (header / label / description …) → text control.
		if (p.kind === 'slot') {
			if (acceptsString(p.type)) {
				controls.push({
					name: p.name,
					label: humanize(p.name),
					kind: 'text',
					value: initValue(p.default, 'text') as string,
				});
			}
			continue;
		}

		const opts = hinted;
		if (opts) {
			controls.push({
				name: p.name,
				label: humanize(p.name),
				kind: 'select',
				options: opts,
				value: initValue(p.default, 'select', opts) as string,
			});
		} else if (p.type === 'boolean') {
			controls.push({
				name: p.name,
				label: humanize(p.name),
				kind: 'toggle',
				value: initValue(p.default, 'toggle') as boolean,
			});
		} else if (STRING_UNION.test(p.type)) {
			const u = parseUnion(p.type);
			controls.push({
				name: p.name,
				label: humanize(p.name),
				kind: 'select',
				options: u,
				value: initValue(p.default, 'select', u) as string,
			});
		} else if (p.type === 'number') {
			controls.push({
				name: p.name,
				label: humanize(p.name),
				kind: 'number',
				value: initValue(p.default, 'number') as number,
			});
		} else if (p.type === 'string') {
			controls.push({
				name: p.name,
				label: humanize(p.name),
				kind: 'text',
				value: initValue(p.default, 'text') as string,
			});
		}
		// else: complex prop with no hint → no control (may be supplied via hints.samples)
	}

	const hasChildren = childrenSlot !== undefined || hints.children !== undefined;
	return {
		controls,
		hasChildren,
		childrenLabel: 'Content',
		childrenInit: hints.children ?? (hasChildren ? 'Content' : ''),
	};
}

/** Props to pass to the live component: toggles/numbers always, non-empty text/select, + samples. */
export function buildLiveProps(
	controls: Control[],
	values: Record<string, unknown>,
	samples: Record<string, unknown> = {},
): Record<string, unknown> {
	const p: Record<string, unknown> = { ...samples };
	for (const c of controls) {
		const v = values[c.name];
		if (c.kind === 'toggle') p[c.name] = !!v;
		else if (c.kind === 'number') {
			if (v !== '' && v != null && Number.isFinite(Number(v))) p[c.name] = Number(v);
		} else if (v !== '' && v != null) p[c.name] = v;
	}
	return p;
}

// Serialize a sample value to a readable JS literal for the code snippet, so
// structured props (items, definitions, series) show their REAL shape instead
// of an `={…}` placeholder. Arrays/objects pretty-print multi-line; functions
// (cell/render callbacks) render their source, collapsed when long.
export function serializeValue(v: unknown, indent = 0): string {
	const pad = '  '.repeat(indent);
	const pad1 = '  '.repeat(indent + 1);
	if (v === null) return 'null';
	if (v === undefined) return 'undefined';
	if (typeof v === 'string') return JSON.stringify(v);
	if (typeof v === 'number' || typeof v === 'boolean') return String(v);
	if (typeof v === 'function') {
		const src = v.toString().replace(/\s+/g, ' ').trim();
		return src.length > 48 ? '(…) => …' : src;
	}
	if (Array.isArray(v)) {
		if (v.length === 0) return '[]';
		const body = v.map((x) => pad1 + serializeValue(x, indent + 1)).join(',\n');
		return `[\n${body}\n${pad}]`;
	}
	if (typeof v === 'object') {
		const keys = Object.keys(v as object);
		if (keys.length === 0) return '{}';
		const body = keys
			.map((k) => {
				const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
				return `${pad1}${key}: ${serializeValue((v as Record<string, unknown>)[k], indent + 1)}`;
			})
			.join(',\n');
		return `{\n${body}\n${pad}}`;
	}
	return String(v);
}

// One .pui attribute string (`name`, `name="x"`, `name={5}`) or null to omit.
const fmt = (c: Control, v: unknown): string | null => {
	if (c.kind === 'toggle') return v ? c.name : null;
	if (c.kind === 'number') {
		if (v === '' || v == null || !Number.isFinite(Number(v))) return null;
		return `${c.name}={${Number(v)}}`;
	}
	if (v === '' || v == null) return null;
	return `${c.name}=${JSON.stringify(String(v))}`;
};

/** Generate the .pui markup snippet reflecting the current control values. */
export function generateCode(
	name: string,
	controls: Control[],
	values: Record<string, unknown>,
	hasChildren: boolean,
	childrenText: string,
	samples: Record<string, unknown> = {},
): string {
	const parts: string[] = [];
	// Sample (complex) props first, serialized to their real literal shape.
	for (const [k, val] of Object.entries(samples)) {
		parts.push(
			typeof val === 'string' ? `${k}=${JSON.stringify(val)}` : `${k}={${serializeValue(val, 1)}}`,
		);
	}
	for (const c of controls) {
		// Skip props left at their default — the snippet then shows only what the
		// user actually changed, the way the Cloudscape docs print examples.
		if (values[c.name] === c.value) continue;
		const f = fmt(c, values[c.name]);
		if (f !== null) parts.push(f);
	}

	// Single line when it stays short and nothing wrapped; otherwise one
	// attribute per line, mirroring how the Cloudscape docs print snippets.
	const oneLine = `<${name}${parts.length ? ' ' + parts.join(' ') : ''}${hasChildren ? `>${childrenText}</${name}>` : ' />'}`;
	if (!parts.some((p) => p.includes('\n')) && oneLine.length <= 72) return oneLine;

	const attrs = parts.map((p) => '  ' + p).join('\n');
	return hasChildren ? `<${name}\n${attrs}\n>${childrenText}</${name}>` : `<${name}\n${attrs}\n/>`;
}

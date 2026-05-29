// Tiny dependency-free .pui (Para markup) highlighter. Tokenizes a snippet into
// themed spans — component tags, props, Para keywords (signal/derived/effect),
// strings, numbers — coloured via the --code-* theme tokens so it follows
// light/dark. Shared by the components Configurator's code well and the home
// page's sample. (.pui component usage is angle-bracket markup like Svelte, not
// JSX: events are Cloudscape-style props, e.g. onClick.)
const escapeHtml = (s: string): string =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TOKENS: [string, RegExp][] = [
	['str', /^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/],
	['kw', /^(?:import|from|signal|derived|effect|const|let|return|function)\b/],
	['tag', /^(?:<\/?[A-Za-z][\w.]*|\/?>)/],
	['punc', /^(?:=>|[{}()[\],;:])/],
	['bool', /^(?:true|false|null|undefined)\b/],
	['num', /^-?\d+(?:\.\d+)?\b/],
	['attr', /^[A-Za-z_$][\w$-]*/],
	['op', /^[=.+\-*/!<>]/],
	['ws', /^\s+/],
	['any', /^[\s\S]/],
];

export function highlightPui(src: string): string {
	let out = '';
	let i = 0;
	while (i < src.length) {
		const rest = src.slice(i);
		for (const [cls, re] of TOKENS) {
			const m = re.exec(rest);
			if (!m) continue;
			const text = m[0];
			const esc = escapeHtml(text);
			out += cls === 'ws' || cls === 'any' ? esc : `<span class="tok-${cls}">${esc}</span>`;
			i += text.length;
			break;
		}
	}
	return out;
}

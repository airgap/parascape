<!--
  Demos viewer — sidebar lists scenarios, body shows the active one
  with two columns (Cloudscape React on the left, Parascape .pui on
  the right). Each column has a syntax-highlighted code pane on top
  and a live render pane below. Both renders mount into the SAME
  document so the only delta you can see is the implementation; the
  hashed scoped.css Cloudscape ships and the .pui ports vendor is
  loaded once and drives both.

  Why this proves something:
   • Same vendored hashed classes → both trees produce identical CSS
     rule matches → same paint.
   • Same DOM shape (the conformance suite enforces this) → same
     assistive-tech behavior.
   • Both source panes are formatted by the SAME prettier config
     (tabs, single quotes, width 100), so the visible diff is the
     implementation surface — not whitespace, not quote style.
   • Stats: bytes + binding count. LOC is a noisy proxy for a
     code-density story; bytes is the unambiguous measure of "how
     much text you have to write", and binding count surfaces the
     no-`useState`-pair-decl win directly (React costs two names per
     state slot — `[email, setEmail]` — Para's `signal email = …`
     costs one).
-->
<script lang="ts">
	import Prism from "prismjs";
	import "prismjs/components/prism-typescript";
	import "prismjs/components/prism-jsx";
	import "prismjs/components/prism-tsx";
	import "prismjs/components/prism-markup-templating";
	import { scenarios } from "./scenarios";
	import ReactMount from "./ReactMount.svelte";

	let activeId = $state(scenarios[0].id);
	const active = $derived(scenarios.find((s) => s.id === activeId) ?? scenarios[0]);

	// Byte count, comments stripped — what the author actually typed
	// past the documentation. JS comments (//, /* */) and HTML comments
	// (<!-- -->) are filtered before counting, then whitespace is left
	// alone (it's part of formatted output and stays consistent across
	// both sides thanks to the shared prettier config).
	const stripComments = (s: string) =>
		s
			.replace(/\/\*[\s\S]*?\*\//g, "")
			.replace(/<!--[\s\S]*?-->/g, "")
			.replace(/^[ \t]*\/\/.*$/gm, "");
	const chars = (s: string) => stripComments(s).length;

	// Variable-binding count. React's `useState`/`useRef`/`useMemo`/
	// `useReducer`/`useCallback` plus plain `const [a, setA] = …`
	// destructured pairs all count the LHS NAMES — the React-induced
	// double-decl tax (`[email, setEmail]` is 2). Parascape's `signal`,
	// `derived`, and Svelte's `let` / `const` count once per binding
	// because Para's reactivity primitives don't need a paired setter.
	// Excludes type-only declarations and function/import bindings —
	// just the runtime state surface.
	function bindings(s: string, side: "cs" | "ps"): number {
		const src = stripComments(s);
		let count = 0;
		if (side === "cs") {
			// `const [a, setA] = useState(…)` — pair counts as 2.
			for (const m of src.matchAll(/const\s*\[([^\]]+)\]\s*=\s*use(State|Reducer)\b/g)) {
				count += m[1]!.split(",").filter((p) => p.trim().length > 0).length;
			}
			// `const x = useRef(…)` / `useMemo` / `useCallback` — single binding.
			for (const _ of src.matchAll(/const\s+[A-Za-z_$][\w$]*\s*=\s*use(Ref|Memo|Callback)\b/g)) {
				count += 1;
			}
		} else {
			// Para `signal X = …` / `signal X: T = …` — single binding.
			for (const _ of src.matchAll(/\bsignal\s+[A-Za-z_$][\w$]*/g)) count += 1;
			// Para `derived X = …` — single binding.
			for (const _ of src.matchAll(/\bderived\s+[A-Za-z_$][\w$]*/g)) count += 1;
			// `let X = $state(…)` (Svelte-runes fallback path).
			for (const _ of src.matchAll(/\blet\s+[A-Za-z_$][\w$]*\s*[:=][^;]*\$state\b/g)) count += 1;
		}
		return count;
	}

	type Pair = { cs: number; ps: number };
	const stat = $derived.by<{ chars: Pair; bindings: Pair; bytesDelta: number; bytesPct: number }>(() => {
		const c = { cs: chars(active.csSrc), ps: chars(active.psSrc) };
		const b = { cs: bindings(active.csSrc, "cs"), ps: bindings(active.psSrc, "ps") };
		const d = c.cs - c.ps;
		const p = c.cs > 0 ? Math.round((100 * d) / c.cs) : 0;
		return { chars: c, bindings: b, bytesDelta: d, bytesPct: p };
	});
	const totals = scenarios.reduce(
		(a, s) => ({
			cs: a.cs + chars(s.csSrc),
			ps: a.ps + chars(s.psSrc),
			bcs: a.bcs + bindings(s.csSrc, "cs"),
			bps: a.bps + bindings(s.psSrc, "ps"),
		}),
		{ cs: 0, ps: 0, bcs: 0, bps: 0 },
	);
	const totalPct = Math.round((100 * (totals.cs - totals.ps)) / totals.cs);

	// Prism highlight. The Cloudscape side is real TSX. The Parascape
	// side has no upstream Prism grammar — TSX is the closest match
	// since the syntax surface (TS expressions + tag literals + brace
	// expressions) overlaps almost completely. We do a quick post-pass
	// to colorize Para-only keywords (signal / derived / effect / prop
	// / pure / source / mount / using / provide / inject) as keywords;
	// Svelte template directives (`{#each}`, `{:else}`, `{/if}`,
	// `{@const}`, `{@render}`) get a control-flow class.
	const PARA_KEYWORDS = /\b(signal|derived|effect|prop|pure|source|mount|using|provide|inject)\b/g;
	const SVELTE_DIRECTIVES = /\{[#:/@](?:each|if|else|await|then|catch|key|snippet|render|const|html)\b/g;
	const highlight = (src: string, lang: "cs" | "ps"): string => {
		const grammar = lang === "cs" ? Prism.languages.tsx : Prism.languages.tsx;
		let html = Prism.highlight(src, grammar, "tsx");
		if (lang === "ps") {
			html = html
				.replace(PARA_KEYWORDS, '<span class="token keyword para-kw">$1</span>')
				.replace(SVELTE_DIRECTIVES, (m) => `<span class="token punctuation svelte-tag">${m}</span>`);
		}
		return html;
	};
	const csHtml = $derived(highlight(active.csSrc, "cs"));
	const psHtml = $derived(highlight(active.psSrc, "ps"));
</script>

<div class="layout">
	<aside class="sidebar">
		<h1>Parascape ↔ Cloudscape</h1>
		<p class="lead">
			Both implementations mount in the same document and share the same vendored Cloudscape
			hashed-class CSS. The render panes look identical because the class hashes and DOM shape match
			by construction. Both code panes use the same prettier config — the visible diff is the
			implementation surface only.
		</p>
		<div class="totals">
			<div class="row"><span>Cloudscape</span><b>{totals.cs.toLocaleString()} chars · {totals.bcs} bindings</b></div>
			<div class="row"><span>Parascape</span><b>{totals.ps.toLocaleString()} chars · {totals.bps} bindings</b></div>
			<div class="row delta"
				><span>Across all 6</span><b
					>−{(totals.cs - totals.ps).toLocaleString()} chars ({totalPct}% smaller) · −{totals.bcs - totals.bps}
					bindings</b
				></div
			>
		</div>
		<nav>
			{#each scenarios as s (s.id)}
				<button type="button" class:active={activeId === s.id} onclick={() => (activeId = s.id)}>
					<span class="num">{s.id.split("-")[0]}</span>
					<span class="title">{s.title}</span>
					<span class="sub">{s.subtitle}</span>
				</button>
			{/each}
		</nav>
	</aside>

	<main>
		<header class="page-head">
			<h2>{active.title}</h2>
			<p>{active.subtitle}</p>
			<div class="stats">
				<span class="stat"><b>Cloudscape</b> {stat.chars.cs.toLocaleString()} chars · {stat.bindings.cs} bindings</span>
				<span class="stat ps"
					><b>Parascape</b> {stat.chars.ps.toLocaleString()} chars · {stat.bindings.ps} bindings</span
				>
				<span
					class="stat delta"
					class:positive={stat.bytesDelta > 0}
					class:negative={stat.bytesDelta < 0}
				>
					{stat.bytesDelta > 0 ? "−" : stat.bytesDelta < 0 ? "+" : "±"}{Math.abs(
						stat.bytesDelta,
					).toLocaleString()} chars ({Math.abs(stat.bytesPct)}%
					{stat.bytesDelta > 0 ? "smaller" : stat.bytesDelta < 0 ? "larger" : "tie"})
				</span>
			</div>
		</header>

		<section class="grid">
			<div class="cell">
				<header class="cell-head"><b>Cloudscape (React)</b><span>.tsx</span></header>
				<pre class="code language-tsx"><code class="language-tsx">{@html csHtml}</code></pre>
				<div class="render">
					{#key active.id}
						<ReactMount component={active.cloudscape} />
					{/key}
				</div>
			</div>
			<div class="cell">
				<header class="cell-head"><b>Parascape (.pui)</b><span>.pui</span></header>
				<pre class="code language-tsx"><code class="language-tsx">{@html psHtml}</code></pre>
				<div class="render">
					{#key active.id}
						{@const Comp = active.parascape}
						<Comp />
					{/key}
				</div>
			</div>
		</section>
	</main>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
		background: #fafbfc;
		color: #16191f;
	}
	:global(#app) {
		min-height: 100vh;
	}
	.layout {
		display: grid;
		grid-template-columns: 320px 1fr;
		min-height: 100vh;
	}
	.sidebar {
		position: sticky;
		top: 0;
		align-self: start;
		background: #0f1b2a;
		color: #d1d5db;
		padding: 28px 20px;
		max-height: 100vh;
		overflow-y: auto;
	}
	.sidebar h1 {
		font-size: 18px;
		margin: 0 0 10px;
		color: #fff;
		letter-spacing: 0.2px;
	}
	.sidebar .lead {
		font-size: 12px;
		line-height: 1.5;
		color: #9ca3af;
		margin: 0 0 22px;
	}
	.totals {
		background: rgba(255, 255, 255, 0.04);
		border-radius: 6px;
		padding: 10px 12px;
		margin-bottom: 22px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.totals .row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 11px;
		color: #9ca3af;
		gap: 8px;
	}
	.totals .row b {
		color: #f3f4f6;
		font-weight: 500;
		text-align: right;
	}
	.totals .row.delta {
		padding-top: 6px;
		margin-top: 4px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}
	.totals .row.delta b {
		color: #34d399;
	}
	.sidebar nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.sidebar button {
		display: grid;
		grid-template-columns: 28px 1fr;
		grid-template-rows: auto auto;
		gap: 2px 8px;
		text-align: left;
		background: transparent;
		color: inherit;
		border: 0;
		padding: 10px 12px;
		border-radius: 6px;
		cursor: pointer;
		font: inherit;
	}
	.sidebar button:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.sidebar button.active {
		background: #1f3450;
		color: #fff;
	}
	.sidebar .num {
		grid-row: 1 / 3;
		display: grid;
		place-items: center;
		font-size: 11px;
		color: #9ca3af;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 4px;
		height: 28px;
	}
	.sidebar .title {
		font-size: 13px;
		font-weight: 600;
	}
	.sidebar .sub {
		font-size: 11px;
		color: #9ca3af;
	}
	main {
		padding: 32px 36px;
		min-width: 0;
	}
	.page-head {
		margin-bottom: 18px;
	}
	.page-head h2 {
		margin: 0 0 4px;
		font-size: 22px;
	}
	.page-head p {
		margin: 0 0 12px;
		color: #5f6b7a;
	}
	.stats {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.stat {
		font-size: 12px;
		padding: 4px 10px;
		border-radius: 999px;
		background: #eef0f3;
		color: #16191f;
	}
	.stat.ps {
		background: #dbeafe;
	}
	.stat.delta {
		background: #fee2e2;
	}
	.stat.delta.positive {
		background: #dcfce7;
		color: #065f46;
	}
	.stat.delta.negative {
		background: #fee2e2;
		color: #7f1d1d;
	}
	.stat b {
		margin-right: 4px;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18px;
		min-width: 0;
	}
	.cell {
		display: grid;
		grid-template-rows: auto 1fr auto;
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
		min-width: 0;
	}
	.cell-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: #f8fafc;
		border-bottom: 1px solid #e5e7eb;
		font-size: 12px;
		color: #475569;
	}
	.cell-head b {
		color: #16191f;
		font-size: 13px;
	}
	.cell-head span {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		color: #94a3b8;
	}
	pre.code {
		margin: 0;
		padding: 14px 16px;
		font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		color: #0f172a;
		background: #f8fafc;
		border-bottom: 1px solid #e5e7eb;
		overflow: auto;
		max-height: 420px;
		white-space: pre;
		tab-size: 2;
	}
	pre.code code {
		display: block;
	}
	.render {
		padding: 16px;
		background: #fff;
		min-height: 200px;
		overflow: auto;
	}
	/* Prism — minimal colorscheme tuned for the off-white pane bg.
	   Drawn to be legible on print/HiDPI and to make the para-kw +
	   svelte-tag accents pop without screaming. */
	pre.code :global(.token.comment),
	pre.code :global(.token.prolog),
	pre.code :global(.token.doctype),
	pre.code :global(.token.cdata) {
		color: #94a3b8;
		font-style: italic;
	}
	pre.code :global(.token.punctuation) {
		color: #475569;
	}
	pre.code :global(.token.keyword),
	pre.code :global(.token.builtin) {
		color: #7c3aed;
	}
	pre.code :global(.token.string),
	pre.code :global(.token.attr-value),
	pre.code :global(.token.template-string) {
		color: #057a55;
	}
	pre.code :global(.token.number),
	pre.code :global(.token.boolean),
	pre.code :global(.token.constant) {
		color: #b45309;
	}
	pre.code :global(.token.function) {
		color: #1d4ed8;
	}
	pre.code :global(.token.tag),
	pre.code :global(.token.class-name) {
		color: #c2410c;
	}
	pre.code :global(.token.attr-name) {
		color: #0e7490;
	}
	pre.code :global(.token.operator) {
		color: #475569;
	}
	pre.code :global(.token.para-kw) {
		color: #be185d;
		font-weight: 600;
	}
	pre.code :global(.token.svelte-tag) {
		color: #c026d3;
	}
</style>

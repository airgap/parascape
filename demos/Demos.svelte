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
	import { scenarios } from "./scenarios";
	import DemoPane from "./DemoPane.svelte";

	let activeId = $state(scenarios[0].id);
	const active = $derived(scenarios.find((s) => s.id === activeId) ?? scenarios[0]);

	// Theme switcher — light / dark / auto. "auto" delegates to the
	// OS via prefers-color-scheme. The choice is stored in localStorage
	// so it sticks across reloads, and applied to <html data-theme>
	// so the CSS-variable theme tokens cascade everywhere (sidebar,
	// stat tables, code panes, render panes). Mounted in browser-only
	// code via $effect so SSR / pre-render doesn't try to touch
	// window / localStorage.
	type Theme = "light" | "dark" | "auto";
	const themes: Theme[] = ["light", "dark", "auto"];
	let theme = $state<Theme>("auto");
	const cycleTheme = () => (theme = themes[(themes.indexOf(theme) + 1) % themes.length]!);
	$effect(() => {
		if (typeof document === "undefined") return;
		const apply = (t: Theme) => {
			const resolved =
				t === "auto"
					? window.matchMedia("(prefers-color-scheme: dark)").matches
						? "dark"
						: "light"
					: t;
			document.documentElement.setAttribute("data-theme", resolved);
			document.documentElement.setAttribute("data-theme-pref", t);
		};
		apply(theme);
		try {
			localStorage.setItem("parascape-demos-theme", theme);
		} catch {}
		// Track OS theme changes only when in auto mode.
		if (theme !== "auto") return;
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => apply("auto");
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	});
	$effect(() => {
		// Hydrate the persisted choice once at startup.
		try {
			const saved = localStorage.getItem("parascape-demos-theme") as Theme | null;
			if (saved && themes.includes(saved)) theme = saved;
		} catch {}
	});
	const themeIcon = $derived(theme === "light" ? "☀" : theme === "dark" ? "☾" : "◐");
	const themeLabel = $derived(
		theme === "light" ? "Light" : theme === "dark" ? "Dark" : "Auto",
	);

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

</script>

<div class="layout">
	<aside class="sidebar">
		<div class="sidebar-head">
			<h1>Parascape ↔ Cloudscape</h1>
			<button
				type="button"
				class="theme-toggle"
				title="Theme: {themeLabel} (click to cycle)"
				aria-label="Theme: {themeLabel} (click to cycle)"
				onclick={cycleTheme}
			>
				<span aria-hidden="true">{themeIcon}</span>
				<span class="theme-label">{themeLabel}</span>
			</button>
		</div>
		<p class="lead">
			Both implementations mount in the same document and share the same vendored Cloudscape
			hashed-class CSS. The render panes look identical because the class hashes and DOM shape match
			by construction. Both code panes use the same prettier config — the visible diff is the
			implementation surface only.
		</p>
		<table class="totals">
			<caption>Across all 6 scenarios</caption>
			<thead>
				<tr><th></th><th>Cloudscape</th><th>Parascape</th><th>Δ</th></tr>
			</thead>
			<tbody>
				<tr>
					<th scope="row">Chars</th>
					<td class="cell-num">{totals.cs.toLocaleString()}</td>
					<td class="cell-num">{totals.ps.toLocaleString()}</td>
					<td class="cell-num delta" class:better={totals.cs > totals.ps}
						>{totals.cs === totals.ps ? "0" : (totals.cs > totals.ps ? "−" : "+") + Math.abs(totals.cs - totals.ps).toLocaleString()}
						({totalPct}%)</td>
				</tr>
				<tr>
					<th scope="row">Bindings</th>
					<td class="cell-num">{totals.bcs}</td>
					<td class="cell-num">{totals.bps}</td>
					<td class="cell-num delta" class:better={totals.bcs > totals.bps}
						>{totals.bcs === totals.bps ? "0" : (totals.bcs > totals.bps ? "−" : "+") + Math.abs(totals.bcs - totals.bps)}</td>
				</tr>
			</tbody>
		</table>
		<nav>
			{#each scenarios as s (s.id)}
				<button type="button" class:active={activeId === s.id} onclick={() => (activeId = s.id)}>
					<span class="scenario-num">{s.id.split("-")[0]}</span>
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
			<table class="stats">
				<thead>
					<tr><th></th><th>Cloudscape</th><th>Parascape</th><th>Δ</th></tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">Chars</th>
						<td class="cell-num">{stat.chars.cs.toLocaleString()}</td>
						<td class="cell-num">{stat.chars.ps.toLocaleString()}</td>
						<td class="cell-num delta"
							class:better={stat.bytesDelta > 0}
							class:worse={stat.bytesDelta < 0}
							>{stat.bytesDelta === 0
								? "0"
								: (stat.bytesDelta > 0 ? "−" : "+") + Math.abs(stat.bytesDelta).toLocaleString()}
							({Math.abs(stat.bytesPct)}%)</td>
					</tr>
					<tr>
						<th scope="row">Bindings</th>
						<td class="cell-num">{stat.bindings.cs}</td>
						<td class="cell-num">{stat.bindings.ps}</td>
						<td
							class="cell-num delta"
							class:better={stat.bindings.cs > stat.bindings.ps}
							class:worse={stat.bindings.cs < stat.bindings.ps}
							>{stat.bindings.cs === stat.bindings.ps
								? "0"
								: (stat.bindings.cs > stat.bindings.ps ? "−" : "+") +
									Math.abs(stat.bindings.cs - stat.bindings.ps)}</td>
					</tr>
				</tbody>
			</table>
		</header>

		<section class="grid">
			{#key active.id}
				<DemoPane side="cs" initialSource={active.csSrc} label="Cloudscape (React)" ext=".tsx" />
				<DemoPane side="ps" initialSource={active.psSrc} label="Parascape (.pui)" ext=".pui" />
			{/key}
		</section>
	</main>
</div>

<style>
	/* Theme tokens — one source of truth so the sidebar, main pane,
	   code panes, and render panes are all driven by the same vars.
	   The host page chooses light vs dark by setting data-theme on
	   <html>. We bundle the light defaults here; the [data-theme]
	   selectors below override for dark mode. The "auto" toggle in
	   the toolbar resolves to either by reading prefers-color-scheme
	   and reflecting the choice as a data-theme attribute. */
	:global(:root) {
		--bg-page: #fafbfc;
		--bg-elev: #ffffff;
		--bg-pane-head: #f8fafc;
		--bg-code: #f8fafc;
		--bg-sidebar: #ffffff;
		--bg-button-hover: rgba(15, 23, 42, 0.06);
		--bg-button-active: #e0e7ff;
		--bg-num-pill: rgba(15, 23, 42, 0.06);
		--fg-strong: #0f172a;
		--fg-body: #16191f;
		--fg-muted: #5f6b7a;
		--fg-subtle: #94a3b8;
		--fg-inverse: #ffffff;
		--accent: #006ce0;
		--good: #047857;
		--bad: #b91c1c;
		--border: #e5e7eb;
		--border-soft: rgba(15, 23, 42, 0.08);
		color-scheme: light;
	}
	:global([data-theme="dark"]) {
		--bg-page: #0b1220;
		--bg-elev: #111a2c;
		--bg-pane-head: #0f1b2e;
		--bg-code: #0d1626;
		--bg-sidebar: #0f1b2a;
		--bg-button-hover: rgba(255, 255, 255, 0.06);
		--bg-button-active: #1f3450;
		--bg-num-pill: rgba(255, 255, 255, 0.08);
		--fg-strong: #f3f4f6;
		--fg-body: #d1d5db;
		--fg-muted: #9ca3af;
		--fg-subtle: #6b7280;
		--fg-inverse: #ffffff;
		--accent: #60a5fa;
		--good: #34d399;
		--bad: #f87171;
		--border: #1f2937;
		--border-soft: rgba(255, 255, 255, 0.08);
		color-scheme: dark;
	}
	:global(html, body) {
		margin: 0;
		padding: 0;
		font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
		background: var(--bg-page);
		color: var(--fg-body);
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
		background: var(--bg-sidebar);
		color: var(--fg-body);
		border-right: 1px solid var(--border);
		padding: 28px 20px;
		max-height: 100vh;
		overflow-y: auto;
	}
	.sidebar-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 10px;
	}
	.sidebar h1 {
		font-size: 18px;
		margin: 0;
		color: var(--fg-strong);
		letter-spacing: 0.2px;
	}
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: var(--bg-num-pill);
		color: var(--fg-muted);
		border: 1px solid var(--border-soft);
		border-radius: 999px;
		padding: 4px 10px;
		cursor: pointer;
		font: inherit;
		font-size: 11px;
	}
	.theme-toggle:hover {
		background: var(--bg-button-hover);
		color: var(--fg-strong);
	}
	.theme-toggle .theme-label {
		letter-spacing: 0.3px;
		text-transform: uppercase;
	}
	.sidebar .lead {
		font-size: 12px;
		line-height: 1.5;
		color: var(--fg-muted);
		margin: 0 0 22px;
	}
	/* Comparison tables — same shape in the sidebar (totals) and
	   above the active demo (per-scenario stats). The Δ column gets
	   .better/.worse for the smaller-is-better metrics so the user
	   sees the win at a glance without a "smaller/larger" suffix. */
	table.totals,
	table.stats {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
		margin-bottom: 18px;
	}
	/* page-head stat tables sit beside the demo title — keep them
	   compact so they don't span the whole content column. */
	main table.stats {
		max-width: 420px;
	}
	table.totals {
		margin-bottom: 22px;
	}
	table.totals caption {
		text-align: left;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--fg-subtle);
		padding-bottom: 6px;
	}
	table.totals thead th,
	table.stats thead th {
		text-align: right;
		font-weight: 500;
		color: var(--fg-subtle);
		padding: 4px 8px;
		border-bottom: 1px solid var(--border-soft);
	}
	table.totals thead th:first-child,
	table.stats thead th:first-child {
		text-align: left;
		width: 6em;
	}
	table.totals tbody th,
	table.stats tbody th {
		text-align: left;
		font-weight: 500;
		color: var(--fg-muted);
		padding: 6px 8px;
	}
	table.totals tbody td,
	table.stats tbody td {
		text-align: right;
		padding: 6px 8px;
		color: var(--fg-strong);
		font-variant-numeric: tabular-nums;
	}
	table.totals .delta,
	table.stats .delta {
		color: var(--fg-muted);
	}
	table.totals .delta.better,
	table.stats .delta.better {
		color: var(--good);
	}
	table.totals .delta.worse,
	table.stats .delta.worse {
		color: var(--bad);
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
		background: var(--bg-button-hover);
	}
	.sidebar button.active {
		background: var(--bg-button-active);
		color: var(--fg-strong);
	}
	.sidebar .scenario-num {
		grid-row: 1 / 3;
		display: grid;
		place-items: center;
		font-size: 11px;
		color: var(--fg-muted);
		background: var(--bg-num-pill);
		border-radius: 4px;
		height: 28px;
	}
	.sidebar .title {
		font-size: 13px;
		font-weight: 600;
		color: var(--fg-strong);
	}
	.sidebar .sub {
		font-size: 11px;
		color: var(--fg-muted);
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
		color: var(--fg-strong);
	}
	.page-head p {
		margin: 0 0 12px;
		color: var(--fg-muted);
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
		background: var(--bg-elev);
		border: 1px solid var(--border);
		border-radius: 8px;
		overflow: hidden;
		min-width: 0;
	}
	.cell-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: var(--bg-pane-head);
		border-bottom: 1px solid var(--border);
		font-size: 12px;
		color: var(--fg-muted);
	}
	.cell-head b {
		color: var(--fg-strong);
		font-size: 13px;
	}
	.cell-head span {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		color: var(--fg-subtle);
	}
	pre.code {
		margin: 0;
		padding: 14px 16px;
		font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		color: var(--fg-strong);
		background: var(--bg-code);
		border-bottom: 1px solid var(--border);
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
		background: var(--bg-elev);
		min-height: 200px;
		overflow: auto;
	}
	/* Shiki renders its own `<pre class="shiki …">` with inline
	   `style="color:…"` on every token, so we don't need a Prism
	   color theme here. We DO want our `pre.code` wrapper styling
	   (padding, max-height, border-bottom) to win over Shiki's
	   `<pre class="shiki">`, so we wrap the highlighted output in
	   our own `pre.code` and let Shiki's inner `<pre>` (which we
	   override to display: contents) just provide the token spans. */
	pre.code :global(pre.shiki) {
		background: transparent !important;
		margin: 0;
		padding: 0;
		font: inherit;
		color: inherit;
		display: block;
	}
	pre.code :global(pre.shiki code) {
		font: inherit;
	}
	pre.code :global(.shiki .line) {
		display: block;
		min-height: 1.55em;
	}
</style>

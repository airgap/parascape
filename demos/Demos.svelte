<!--
  Demos viewer — sidebar lists scenarios, body shows the active one
  with two columns (Cloudscape React on the left, Parascape .pui on
  the right). Each column has a code pane on top and a live render
  pane below. Both renders mount into the SAME document so the only
  delta you can see is the implementation; the hashed scoped.css
  Cloudscape ships and the .pui ports vendor is loaded once and
  drives both.

  Why this proves something:
   • Same vendored hashed classes → both trees produce identical CSS
     rule matches → same paint
   • Same DOM shape (the conformance suite enforces this) → same
     assistive-tech behavior
   • What the source-code diff shows is purely the implementation
     surface: no React boilerplate (useState, ReactNode prop slots),
     {#snippet} for slot content instead of nested JSX expressions
-->
<script lang="ts">
	import { scenarios, type Scenario } from "./scenarios";
	import ReactMount from "./ReactMount.svelte";

	let activeId = $state(scenarios[0].id);
	const active = $derived(scenarios.find((s) => s.id === activeId) ?? scenarios[0]);

	const loc = (s: string) =>
		s
			.split("\n")
			.filter((l) => l.trim().length > 0 && !/^\s*(\/\/|<!--|-->)/.test(l))
			.length;
	const stats = $derived.by(() => {
		const cs = loc(active.csSrc);
		const ps = loc(active.psSrc);
		const delta = cs - ps;
		const pct = cs > 0 ? Math.round((100 * delta) / cs) : 0;
		return { cs, ps, delta, pct };
	});
	const totals = scenarios.reduce(
		(a, s) => ({ cs: a.cs + loc(s.csSrc), ps: a.ps + loc(s.psSrc) }),
		{ cs: 0, ps: 0 },
	);
	const totalPct = Math.round((100 * (totals.cs - totals.ps)) / totals.cs);
</script>

<div class="layout">
	<aside class="sidebar">
		<h1>Parascape ↔ Cloudscape</h1>
		<p class="lead">
			Both implementations mount in the same document and share the same vendored Cloudscape
			hashed-class CSS. The render panes look identical because the class hashes and DOM shape
			match by construction — the code panes show what each library asks you to write.
		</p>
		<div class="totals">
			<div class="row"><span>Cloudscape total</span><b>{totals.cs} lines</b></div>
			<div class="row"><span>Parascape total</span><b>{totals.ps} lines</b></div>
			<div class="row delta"><span>Across all 6</span><b>−{totals.cs - totals.ps} lines ({totalPct}% shorter)</b></div>
		</div>
		<nav>
			{#each scenarios as s (s.id)}
				<button
					type="button"
					class:active={activeId === s.id}
					onclick={() => (activeId = s.id)}
				>
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
				<span class="stat"><b>Cloudscape</b> {stats.cs} lines</span>
				<span class="stat ps"><b>Parascape</b> {stats.ps} lines</span>
				<span class="stat delta" class:positive={stats.delta > 0} class:negative={stats.delta < 0}>
					{stats.delta > 0 ? "−" : stats.delta < 0 ? "+" : "±"}{Math.abs(stats.delta)} lines
					({Math.abs(stats.pct)}% {stats.delta > 0 ? "shorter" : stats.delta < 0 ? "longer" : "tie"})
				</span>
			</div>
		</header>

		<section class="grid">
			<div class="cell">
				<header class="cell-head"><b>Cloudscape (React)</b><span>.tsx</span></header>
				<pre class="code"><code>{active.csSrc}</code></pre>
				<div class="render">
					{#key active.id}
						<ReactMount component={active.cloudscape} />
					{/key}
				</div>
			</div>
			<div class="cell">
				<header class="cell-head"><b>Parascape (.pui)</b><span>.pui</span></header>
				<pre class="code"><code>{active.psSrc}</code></pre>
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
		font-size: 12px;
		color: #9ca3af;
	}
	.totals .row b {
		color: #f3f4f6;
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
</style>

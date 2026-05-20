<!--
  Editable demo pane — one side (Cloudscape React or Parascape .pui).
  Renders:
    • a textarea-over-highlighted-pre code editor (textarea is the
      input, pre.code shows the Shiki-highlighted source underneath;
      textarea text is transparent, caret stays visible — the live
      colored output is what the user actually sees while typing)
    • a render panel below that mounts the COMPILED-on-the-fly
      component. Compile is debounced so quick keystrokes don't
      thrash; errors stay scoped to this pane and don't break the
      other side.
-->
<script lang="ts">
	import { onDestroy } from "svelte";
	import { highlight as shikiHighlight, ready as shikiReady } from "./pui-shiki";
	import {
		compileCloudscape,
		compileParascape,
		mountReact,
		mountSvelte,
	} from "./live-compile";

	type Props = {
		side: "cs" | "ps";
		/** Reset to this whenever it changes (scenario switch). */
		initialSource: string;
		label: string;
		ext: string;
	};
	let { side, initialSource, label, ext }: Props = $props();

	let source = $state(initialSource);
	let error = $state<string | null>(null);
	let highlighted = $state("");
	let renderTarget = $state<HTMLDivElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let preEl = $state<HTMLPreElement | null>(null);
	let teardown: (() => void) | null = null;

	const shikiLang = side === "cs" ? "tsx" : "pui";

	// Reset to a new initial source when the parent swaps it (scenario nav).
	$effect(() => {
		const next = initialSource;
		source = next;
		error = null;
	});

	// Re-highlight whenever source changes. Shiki init is async — until
	// it resolves, fall back to escaped raw text.
	let shikiReadyFlag = $state(false);
	shikiReady.then(() => (shikiReadyFlag = true));
	$effect(() => {
		const src = source;
		if (!shikiReadyFlag) {
			highlighted = `<pre><code>${src.replace(/[<&]/g, (c) => (c === "<" ? "&lt;" : "&amp;"))}</code></pre>`;
			return;
		}
		shikiHighlight(src, shikiLang).then((html) => (highlighted = html));
	});

	// Debounced compile + mount.
	let debounceHandle: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const src = source;
		const target = renderTarget;
		if (!target) return;
		clearTimeout(debounceHandle);
		debounceHandle = setTimeout(() => {
			try {
				const Component = side === "cs" ? compileCloudscape(src) : compileParascape(src);
				teardown?.();
				teardown = side === "cs" ? mountReact(Component as never, target) : mountSvelte(Component as never, target);
				error = null;
			} catch (e: unknown) {
				error = (e as { message?: string })?.message ?? String(e);
			}
		}, 300);
	});

	// Keep the highlighted overlay's scroll position in sync with the
	// textarea — without this, the colored text drifts off the visible
	// area as the user scrolls.
	const syncScroll = () => {
		if (preEl && textareaEl) {
			preEl.scrollTop = textareaEl.scrollTop;
			preEl.scrollLeft = textareaEl.scrollLeft;
		}
	};

	// Tab → insert two spaces (the repo prettier uses tabs but a
	// textarea Tab keypress moves focus; intercept and insert literal
	// tab so users editing the .pui scenarios keep the tab indentation).
	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === "Tab") {
			e.preventDefault();
			const ta = e.currentTarget as HTMLTextAreaElement;
			const s = ta.selectionStart;
			source = source.slice(0, s) + "\t" + source.slice(ta.selectionEnd);
			queueMicrotask(() => {
				ta.selectionStart = ta.selectionEnd = s + 1;
			});
		}
	};

	onDestroy(() => {
		clearTimeout(debounceHandle);
		teardown?.();
	});
</script>

<div class="cell">
	<header class="cell-head"><b>{label}</b><span>{ext}</span></header>
	<div class="editor-wrap">
		<pre class="code" bind:this={preEl}>{@html highlighted}</pre>
		<textarea
			class="editor-input"
			bind:value={source}
			bind:this={textareaEl}
			onscroll={syncScroll}
			onkeydown={onKeydown}
			spellcheck="false"
			autocomplete="off"
			autocapitalize="off"
		></textarea>
	</div>
	<div class="render" bind:this={renderTarget}></div>
	{#if error}<div class="error" title="Compile / runtime error">{error}</div>{/if}
</div>

<style>
	.cell {
		display: grid;
		grid-template-rows: auto 1fr auto auto;
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
	.editor-wrap {
		position: relative;
		background: #f8fafc;
		height: 420px;
		border-bottom: 1px solid #e5e7eb;
	}
	.editor-wrap > pre.code,
	.editor-wrap > .editor-input {
		position: absolute;
		inset: 0;
		margin: 0;
		padding: 14px 16px;
		font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		white-space: pre;
		overflow: auto;
		tab-size: 2;
		box-sizing: border-box;
	}
	.editor-wrap > pre.code {
		pointer-events: none;
		z-index: 0;
		color: #0f172a;
	}
	.editor-wrap > .editor-input {
		z-index: 1;
		resize: none;
		border: 0;
		outline: 0;
		background: transparent;
		color: transparent;
		caret-color: #16191f;
		-webkit-text-fill-color: transparent;
	}
	.editor-wrap > .editor-input::selection {
		background: rgba(96, 165, 250, 0.35);
		color: transparent;
	}
	/* Shiki emits `<pre class="shiki"><code><span class="line">A</span>\n
	   <span class="line">B</span>…</code></pre>`. The `\n` text nodes
	   between line-spans are the issue: with `white-space: pre` on the
	   outer pane (so the textarea overlay's spaces match), those \n
	   bytes render as visible empty lines and each visual row ends up
	   2-3× the expected line height.

	   Fix: override `white-space: normal` on the inner `<pre.shiki>`
	   and its `<code>` so inter-line whitespace collapses; then put
	   `white-space: pre` back on each `.line` so in-line indentation
	   stays preserved. Each `.line` is `display: block` so they still
	   stack vertically without the trailing newline characters.

	   The textarea still uses `white-space: pre` (for its own cursor
	   layout) — the row-by-row alignment works because every `.line`
	   is exactly one font line-height tall, same as a textarea row. */
	:global(.editor-wrap pre.shiki) {
		background: transparent !important;
		margin: 0;
		padding: 0;
		display: block;
		white-space: normal;
	}
	:global(.editor-wrap pre.shiki code) {
		white-space: normal;
		display: block;
	}
	:global(.editor-wrap pre.shiki .line) {
		display: block;
		white-space: pre;
		min-height: 1.55em;
	}
	.render {
		padding: 16px;
		background: #fff;
		min-height: 200px;
		overflow: auto;
	}
	.error {
		padding: 8px 12px;
		background: #fee2e2;
		color: #7f1d1d;
		font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		border-top: 1px solid #fca5a5;
		white-space: pre-wrap;
	}
</style>

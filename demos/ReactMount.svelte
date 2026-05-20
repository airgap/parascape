<!--
  ReactMount — drops a React tree into a Svelte-controlled <div>.
  This is the linchpin of the inline demo: the .pui side and the
  Cloudscape React side share the same page/CSS/tokens so the only
  thing varying across each demo cell is the component implementation.
  CSS class-name parity is by construction (we vendor Cloudscape's
  hashed scoped.css verbatim and reuse the same hashes), so both
  trees walking the SAME CSS rules is the proof that the parity is
  real — not a screenshot illusion.

  Mount/unmount contract: createRoot ONCE per component instance.
  On prop changes (component or props), we call root.render(new tree)
  — React's own reconciler handles the diff, no unmount/remount. We
  only unmount on Svelte destroy (e.g. when the parent {#key} cycles
  this instance). The unmount is deferred via queueMicrotask so it
  never runs synchronously inside the cleanup of an effect that's
  still committing — React 18 logs a warning otherwise.
-->
<script lang="ts">
	import { onDestroy } from "svelte";
	import { createRoot } from "react-dom/client";
	import { createElement } from "react";
	import type { ComponentType } from "react";

	type Props = { component: ComponentType<Record<string, unknown>>; props?: Record<string, unknown> };
	let { component, props = {} }: Props = $props();

	let host = $state<HTMLDivElement | null>(null);
	let root: ReturnType<typeof createRoot> | null = null;

	$effect(() => {
		if (!host) return;
		if (!root) root = createRoot(host);
		root.render(createElement(component, props));
	});

	onDestroy(() => {
		const r = root;
		root = null;
		queueMicrotask(() => r?.unmount());
	});
</script>

<div bind:this={host}></div>

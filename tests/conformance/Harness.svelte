<script lang="ts">
	// Thin mount target: delegates to the recursive Descriptor renderer.
	// Descriptor is the SOLE, UNCONDITIONAL root (no {#if} at this level
	// — that injects a leading anchor comment which breaks Cloudscape
	// tests asserting on container.firstChild; the codemod's
	// firstChild→firstElementChild rule covers the residual anchor).
	import Descriptor from './Descriptor.svelte';
	let { node }: { node: any } = $props();
</script>

<Descriptor {node} />

<script lang="ts">
	// Recursively renders an adapter h() node.
	//  - descriptor whose component is a .pui (function/class) → mount
	//    <Component {...props}> with a recursive children snippet
	//  - descriptor whose component is a STRING:
	//      'fragment'        → render children only (JSX <>…</>)
	//      'div'/'span'/…    → real DOM element via <svelte:element>
	//        (Cloudscape tests embed plain DOM, e.g. <Header actions={
	//         <button/>}> — these must be real nodes, not components)
	//  - primitive (string/number) → text
	// Self-import is the standard Svelte recursive-component pattern.
	import Self from "./Descriptor.svelte";

	let { node }: { node: any } = $props();
	const isDesc = (x: any) => x && typeof x === "object" && x.__pui === true;
	const kids = $derived(isDesc(node) ? (node.children ?? []) : []);
	const hasKids = $derived(kids.length > 0);
	const comp = $derived(isDesc(node) ? node.component : null);
	const isStringTag = $derived(typeof comp === "string");
	const isFragment = $derived(comp === "fragment");
	const Component = $derived(!isStringTag ? comp : null);
</script>

{#if !isDesc(node)}
	{#if node !== null && node !== undefined && node !== false}{node}{/if}
{:else if isFragment}
	{@render kidSnippet()}
{:else if isStringTag}
	<svelte:element this={comp} {...node.props}>{@render kidSnippet()}</svelte:element>
{:else}
	<Component {...node.props} children={hasKids ? kidSnippet : undefined} />
{/if}

{#snippet kidSnippet()}
	{#each kids as child}
		{#if isDesc(child)}
			<Self node={child} />
		{:else if child !== null && child !== undefined && child !== false}
			{child}
		{/if}
	{/each}
{/snippet}

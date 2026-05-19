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
	import Self from './Descriptor.svelte';
	import { createRawSnippet, mount, unmount } from 'svelte';

	let { node }: { node: any } = $props();
	const isDesc = (x: any) => x && typeof x === 'object' && x.__pui === true;
	const isPlainObj = (x: any) =>
		!!x && typeof x === 'object' && (x.constructor === Object || x.constructor === undefined);

	// Bridge JSX-element-valued PROPS → Svelte snippets. The harness
	// already turns element CHILDREN into a snippet (kidSnippet); element
	// PROPS (Cloudscape's `actions={<button/>}`, `media={{content:<img/>}}`,
	// `info`, `description`, …) must get the same treatment so production
	// .pui components can `{@render prop()}` them through the normal
	// Snippet contract — without importing any test code. A descriptor (or
	// array of them) becomes a raw snippet that imperatively mounts a
	// nested Descriptor into a layout-neutral (display:contents) host.
	const nodeToSnippet = (n: any) =>
		createRawSnippet(() => ({
			render: () => `<pui-slot style="display:contents"></pui-slot>`,
			setup: (el: Element) => {
				const inst = mount(Self, { target: el, props: { node: n } });
				return () => unmount(inst);
			},
		}));
	const transform = (v: any): any => {
		// Callback props (Cloudscape's renderItem/renderStep/…) return
		// React nodes at runtime; in Parascape they return Snippet-bearing
		// objects. Bridge the boundary by transforming the RETURN value
		// (same posture as the children/element-prop bridge — adaptation,
		// not faking). Non-element returns pass through identity.
		if (typeof v === 'function') return (...a: any[]) => transform(v(...a));
		if (isDesc(v)) return nodeToSnippet(v);
		if (Array.isArray(v))
			return v.some(isDesc)
				? nodeToSnippet({ __pui: true, component: 'fragment', children: v })
				: v.map(transform);
		if (isPlainObj(v)) {
			const o: Record<string, any> = {};
			for (const k in v) o[k] = transform(v[k]);
			return o;
		}
		return v;
	};

	const kids = $derived(isDesc(node) ? (node.children ?? []) : []);
	const hasKids = $derived(kids.length > 0);
	const comp = $derived(isDesc(node) ? node.component : null);
	const isStringTag = $derived(typeof comp === 'string');
	const isFragment = $derived(comp === 'fragment');
	const VOID = new Set([
		'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
		'link', 'meta', 'param', 'source', 'track', 'wbr',
	]);
	const isVoid = $derived(isStringTag && VOID.has(comp));
	const Component = $derived(!isStringTag ? comp : null);
	const tprops = $derived(
		isDesc(node) && !isStringTag ? transform(node.props ?? {}) : (node?.props ?? {}),
	);
</script>

{#if !isDesc(node)}
	{#if node !== null && node !== undefined && node !== false}{node}{/if}
{:else if isFragment}
	{@render kidSnippet()}
{:else if isVoid}
	<svelte:element this={comp} {...node.props} />
{:else if isStringTag}
	<svelte:element this={comp} {...node.props}>{@render kidSnippet()}</svelte:element>
{:else}
	<Component {...tprops} children={hasKids ? kidSnippet : undefined} />
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

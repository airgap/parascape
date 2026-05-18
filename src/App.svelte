<script lang="ts">
	import Table from './lib/components/Table.pui';
	import Header from './lib/components/Header.pui';
	import TextFilter from './lib/components/TextFilter.pui';

	type Instance = {
		id: string;
		name: string;
		type: string;
		state: 'Running' | 'Stopped' | 'Pending';
		az: string;
		vcpus: number;
	};

	const items: Instance[] = [
		{ id: 'i-0a1', name: 'web-1', type: 't3.medium', state: 'Running', az: 'us-east-1a', vcpus: 2 },
		{ id: 'i-0b2', name: 'web-2', type: 't3.medium', state: 'Running', az: 'us-east-1b', vcpus: 2 },
		{ id: 'i-0c3', name: 'worker-1', type: 'c6i.xlarge', state: 'Stopped', az: 'us-east-1a', vcpus: 4 },
		{ id: 'i-0d4', name: 'db-primary', type: 'r6g.large', state: 'Running', az: 'us-east-1c', vcpus: 2 },
		{ id: 'i-0e5', name: 'batch-gpu', type: 'g5.xlarge', state: 'Pending', az: 'us-east-1b', vcpus: 4 },
		{ id: 'i-0f6', name: 'cache-1', type: 'r6g.large', state: 'Running', az: 'us-east-1a', vcpus: 2 },
	];

	const columnDefinitions = [
		{ id: 'name', header: 'Name', cell: (i: Instance) => i.name, sortingField: 'name' },
		{ id: 'id', header: 'Instance ID', cell: (i: Instance) => i.id },
		{ id: 'type', header: 'Type', cell: (i: Instance) => i.type, sortingField: 'type' },
		{ id: 'state', header: 'State', cell: (i: Instance) => i.state, sortingField: 'state' },
		{ id: 'az', header: 'Availability zone', cell: (i: Instance) => i.az, sortingField: 'az' },
		{ id: 'vcpus', header: 'vCPUs', cell: (i: Instance) => String(i.vcpus), sortingField: 'vcpus' },
	];

	let selectedItems = $state<Instance[]>([]);
	let filteringText = $state('');
</script>

<main>
	<header>
		<h1>Parascape</h1>
		<p>
			Cloudscape's <code>&lt;Table&gt;</code> API, ported to <code>.pui</code> —
			filter / sort / multi-select are Para signals, not React hooks.
			<strong>{selectedItems.length}</strong> selected.
		</p>
	</header>

	<Table
		{items}
		{columnDefinitions}
		selectionType="multi"
		trackBy={(i: Instance) => i.id}
		bind:selectedItems
	>
		{#snippet header()}<Header>Instances</Header>{/snippet}
		{#snippet filter()}<TextFilter
				{filteringText}
				filteringPlaceholder="Find instances"
				onChange={(v) => (filteringText = v)}
			/>{/snippet}
	</Table>
</main>

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: var(--space-xxl) var(--space-l);
		display: flex;
		flex-direction: column;
		gap: var(--space-l);
	}
	header h1 {
		margin: 0 0 var(--space-xxs);
		font-size: 28px;
	}
	header p {
		margin: 0;
		color: var(--color-text-body-secondary);
	}
	code {
		background: var(--color-background-cell-shaded);
		padding: 1px 5px;
		border-radius: 4px;
	}
</style>

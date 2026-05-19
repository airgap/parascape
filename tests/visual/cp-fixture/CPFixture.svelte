<!--
  Open-modal parity fixture (Parascape side) for CollectionPreferences.
  The modal is a portaled/fixed overlay so it can't be diffed in the
  inline #matrix; like popover-shoot this opens it (Playwright clicks
  the trigger) and screenshots the modal DIALOG element's own bbox
  (position-independent — runtime modal positioning is the documented-
  omitted overlay scope). Content/props byte-identical to cp-ref.tsx.
-->
<script lang="ts">
	import CollectionPreferences from '../../../src/lib/components/CollectionPreferences.pui';
</script>

<div
	id="stage"
	style="width:760px;background:#fff;padding:48px;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
>
	<CollectionPreferences
		title="Preferences"
		confirmLabel="Confirm"
		cancelLabel="Cancel"
		preferences={{ pageSize: 20, wrapLines: false, stripedRows: false, contentDensity: 'comfortable' }}
		pageSizePreference={{
			title: 'Page size',
			options: [
				{ value: 10, label: '10 items' },
				{ value: 20, label: '20 items' },
				{ value: 50, label: '50 items' },
			],
		}}
		wrapLinesPreference={{ label: 'Wrap lines', description: 'Wrap long text onto multiple lines' }}
		stripedRowsPreference={{ label: 'Striped rows', description: 'Alternate row shading' }}
		contentDensityPreference={{ label: 'Compact mode', description: 'Reduce vertical row padding' }}
	/>
</div>

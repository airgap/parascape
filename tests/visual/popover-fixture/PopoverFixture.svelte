<script lang="ts">
	import Popover from '../../../src/lib/components/Popover.pui';
	import Tooltip from '../../../src/lib/components/Tooltip.pui';
	import Dropdown from '../../../src/lib/components/Dropdown.pui';
	import Modal from '../../../src/lib/components/Modal.pui';
</script>

<div
	id="stage"
	style="width:520px;background:#fff;padding:48px;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
>
	<Popover open header="Popover header" dismissButton>
		Trigger
		{#snippet content()}
			<p style="margin:0">
				This is the popover body content. It can contain <strong>rich</strong> text and multiple lines
				to exercise the body / header-row / content layout.
			</p>
		{/snippet}
	</Popover>

	<div style="height:48px"></div>
	<Tooltip open position="top">
		{#snippet content()}Tooltip text content{/snippet}
	</Tooltip>

	<div style="height:48px"></div>
	<Dropdown open>
		{#snippet content()}
			<ul style="margin:0;padding:8px 0;list-style:none">
				<li style="padding:4px 16px">Option one</li>
				<li style="padding:4px 16px">Option two</li>
				<li style="padding:4px 16px">Option three</li>
			</ul>
		{/snippet}
	</Dropdown>

	<div style="height:48px"></div>
	<Modal visible header="Modal title">
		Modal body content goes here.
		{#snippet footer()}<button>OK</button>{/snippet}
	</Modal>
</div>

<!--
  FIXTURE-ONLY reveal: Cloudscape's .container is parked at
  position:fixed; inset:-9999px until its runtime viewport positioner
  sets top/left (the documented-omitted scope). To MEASURE body
  fidelity we pin the container on-screen here — this overrides only
  the fixture, never the component. Cloudscape's reference positions
  itself via its real algorithm; both bodies end up visible and the
  harness diffs the body element's own bbox (position-independent).
-->
<style>
	:global([class*='awsui_container']) {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		right: auto !important;
		bottom: auto !important;
		transform: none !important;
	}
</style>

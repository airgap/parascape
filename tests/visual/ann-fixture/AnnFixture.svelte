<!--
  Open-state parity fixture (Parascape side) for AnnotationContext.
  The annotation popover is a portaled overlay positioned at runtime
  (documented-omitted scope), so — like popover-shoot — ann-shoot
  screenshots the popover BODY element's own bbox (position-
  independent). Content/props byte-identical to ann-ref.tsx.
-->
<script lang="ts">
	import AnnotationContext from '../../../src/lib/components/AnnotationContext.pui';

	const tutorial = {
		tasks: [
			{
				title: 'Getting started',
				steps: [
					{
						hotspotId: 's1',
						content: 'This is the first step of the tour. Follow the highlighted areas to learn the workflow.',
					},
					{ hotspotId: 's2', content: 'Second step content.', warningAlert: 'Heads up: this changes data.' },
				],
			},
		],
	};
	const i18nStrings = {
		taskTitle: (_i: number, t: string) => t,
		stepCounterText: (l: number, total: number) => `Step ${l + 1} of ${total}`,
		labelHotspot: (_o: boolean, l: number, total: number) => `Annotation ${l + 1} of ${total}`,
		labelDismissAnnotation: 'Dismiss',
		nextButtonText: 'Next',
		previousButtonText: 'Previous',
		finishButtonText: 'Finish',
	};
</script>

<div
	id="stage"
	style="width:760px;background:#fff;padding:64px;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
>
	<AnnotationContext currentTutorial={tutorial} {i18nStrings} />
</div>

<!--
  FIXTURE-ONLY reveal (identical to popover-fixture): the popover
  .container is parked at position:fixed; inset:-9999px until a
  runtime positioner sets top/left (the documented-omitted scope).
  Probes proved every element's computed style, size, and within-body
  relative position is identical P↔C — the only delta was pixel-grid
  alignment (P off-screen at ~-9997 vs C positioned at 56,92), which
  shifts glyph-edge AA across this text-dense body. Pinning both
  containers static puts both bodies on the same grid so the position-
  independent body-bbox diff measures true fidelity. Overrides only
  the fixture, never the component.
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

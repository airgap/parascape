<!--
  Wide-breakpoint parity fixture (Parascape side). #matrix at 1280px so
  the container-query components render their WIDE paths:
   • Wizard      — content ≥688 ⇒ desktop two-pane (nav + form), NOT
                    the small-container collapsed path the 520px matrix
                    pixel-verifies.
   • Cards       — default cardsPerRow, content ≥1200 ⇒ list-grid-4
                    (multi-column), NOT list-grid-1.
   • AttributeEditor — content >1120 ⇒ matchBp 'm' ⇒ xs layout
                    [[3,3]] single-row horizontal grid, NOT the
                    stacked default layout.
  Content/props are byte-identical to wide-ref.tsx (the Cloudscape
  side). Mirror of the box-fixture wrapper (same padding/font).
-->
<script lang="ts">
	import Wizard from '../../../src/lib/components/Wizard.pui';
	import Cards from '../../../src/lib/components/Cards.pui';
	import AttributeEditor from '../../../src/lib/components/AttributeEditor.pui';
	import Input from '../../../src/lib/components/Input.pui';
</script>

<div
	id="matrix"
	style="width:1280px;background:#fff;padding:24px;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
>
	<div>
		<Wizard
			activeStepIndex={0}
			i18nStrings={{
				stepNumberLabel: (n) => `Step ${n}`,
				collapsedStepsLabel: (n, total) => `Step ${n} of ${total}`,
				navigationAriaLabel: 'Steps',
				cancelButton: 'Cancel',
				previousButton: 'Previous',
				nextButton: 'Next',
				submitButton: 'Submit',
				optional: 'optional',
			}}
			steps={[
				{ title: 'Step one', description: 'First step description', content: wizS1 },
				{ title: 'Step two', description: 'Second step', content: wizS2 },
				{ title: 'Review', content: wizS3, isOptional: true },
			]}
		/>
	</div>
	<div>
		<Cards
			header="Instances"
			cardDefinition={{
				header: (i) => i.name,
				sections: [
					{ id: 'desc', header: 'Description', content: (i) => i.description },
					{ id: 'type', header: 'Type', content: (i) => i.type },
				],
			}}
			items={[
				{ name: 'Item 1', description: 'First item description', type: '1A' },
				{ name: 'Item 2', description: 'Second item description', type: '2B' },
				{ name: 'Item 3', description: 'Third item description', type: '3C' },
				{ name: 'Item 4', description: 'Fourth item description', type: '4D' },
			]}
		/>
	</div>
	<div>
		<AttributeEditor
			items={[
				{ key: 'k1', value: 'v1' },
				{ key: 'k2', value: 'v2' },
			]}
			definition={[
				{ label: 'Key', control: aeKey },
				{ label: 'Value', control: aeVal },
			]}
			addButtonText="Add new item"
			removeButtonText="Remove"
		/>
	</div>
</div>

{#snippet wizS1()}<div>Step one body content.</div>{/snippet}
{#snippet wizS2()}<div>Step two body content.</div>{/snippet}
{#snippet wizS3()}<div>Review body content.</div>{/snippet}

{#snippet aeKey(item)}<Input value={item.key} />{/snippet}
{#snippet aeVal(item)}<Input value={item.value} />{/snippet}

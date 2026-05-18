<script lang="ts">
	import Box from '../../../src/lib/components/Box.pui';
	import SpaceBetween from '../../../src/lib/components/SpaceBetween.pui';
	import Divider from '../../../src/lib/components/Divider.pui';
	import Badge from '../../../src/lib/components/Badge.pui';
	import TextContent from '../../../src/lib/components/TextContent.pui';
	import Checkbox from '../../../src/lib/components/Checkbox.pui';
	import Icon from '../../../src/lib/components/Icon.pui';
	import Container from '../../../src/lib/components/Container.pui';
	import Header from '../../../src/lib/components/Header.pui';
	import Button from '../../../src/lib/components/Button.pui';
	import Input from '../../../src/lib/components/Input.pui';
	import TextFilter from '../../../src/lib/components/TextFilter.pui';
	import StatusIndicator from '../../../src/lib/components/StatusIndicator.pui';
	import Link from '../../../src/lib/components/Link.pui';
	import Grid from '../../../src/lib/components/Grid.pui';
	import Toggle from '../../../src/lib/components/Toggle.pui';
	import RadioButton from '../../../src/lib/components/RadioButton.pui';
	import Textarea from '../../../src/lib/components/Textarea.pui';
	import ToggleButton from '../../../src/lib/components/ToggleButton.pui';
	import LiveRegion from '../../../src/lib/components/LiveRegion.pui';
	import RadioGroup from '../../../src/lib/components/RadioGroup.pui';
	import Alert from '../../../src/lib/components/Alert.pui';
	import FormField from '../../../src/lib/components/FormField.pui';
	import ColumnLayout from '../../../src/lib/components/ColumnLayout.pui';
	import ProgressBar from '../../../src/lib/components/ProgressBar.pui';
	import Tiles from '../../../src/lib/components/Tiles.pui';
	import IconProvider from '../../../src/lib/components/IconProvider.pui';
	import Steps from '../../../src/lib/components/Steps.pui';
	import FileInput from '../../../src/lib/components/FileInput.pui';
	import ExpandableSection from '../../../src/lib/components/ExpandableSection.pui';
	import DateInput from '../../../src/lib/components/DateInput.pui';
	import TimeInput from '../../../src/lib/components/TimeInput.pui';
	import AnchorNavigation from '../../../src/lib/components/AnchorNavigation.pui';
	import Form from '../../../src/lib/components/Form.pui';
	import FileDropzone from '../../../src/lib/components/FileDropzone.pui';
	import NavigableGroup from '../../../src/lib/components/NavigableGroup.pui';
	import List from '../../../src/lib/components/List.pui';
	import ItemCard from '../../../src/lib/components/ItemCard.pui';
	import ActionCard from '../../../src/lib/components/ActionCard.pui';
	import Pagination from '../../../src/lib/components/Pagination.pui';
	import Slider from '../../../src/lib/components/Slider.pui';
	import CopyToClipboard from '../../../src/lib/components/CopyToClipboard.pui';
	import Tabs from '../../../src/lib/components/Tabs.pui';
	import KeyValuePairs from '../../../src/lib/components/KeyValuePairs.pui';
	import ButtonDropdown from '../../../src/lib/components/ButtonDropdown.pui';
	import TreeView from '../../../src/lib/components/TreeView.pui';
</script>

<div
	id="matrix"
	style="width:520px;background:#fff;padding:24px;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
>
	<div><Box variant="h1">Heading 1</Box></div>
	<div><Box variant="h2">Heading 2</Box></div>
	<div><Box variant="h3">Heading 3</Box></div>
	<div><Box variant="p">Paragraph body text in a Box.</Box></div>
	<div><Box variant="strong">Strong inline</Box></div>
	<div><Box variant="small">Small caption text</Box></div>
	<div><Box variant="code">const x = 1;</Box></div>
	<div><Box variant="span" fontWeight="bold">Bold span</Box></div>
	<div><Box variant="p" color="text-status-error">Error colored paragraph</Box></div>
	<div><Box variant="p" color="text-body-secondary">Secondary colored paragraph</Box></div>
	<div><Box variant="div" padding="m">Padded m</Box></div>
	<div><Box variant="div" textAlign="center">Centered text</Box></div>
	<div><Box variant="p" fontSize="heading-xl">Heading XL font size</Box></div>
	<div>
		<SpaceBetween size="m">
			<Box variant="div">SB vertical m — one</Box>
			<Box variant="div">SB vertical m — two</Box>
			<Box variant="div">SB vertical m — three</Box>
		</SpaceBetween>
	</div>
	<div>
		<SpaceBetween direction="horizontal" size="s">
			<Box variant="div">H1</Box>
			<Box variant="div">H2</Box>
			<Box variant="div">H3</Box>
		</SpaceBetween>
	</div>
	<div><Divider /></div>
	<div><Divider>Labeled divider</Divider></div>
	<div><Badge>1</Badge></div>
	<div><Badge color="blue">New</Badge></div>
	<div><Badge color="red">Error</Badge></div>
	<div><Badge color="green">OK</Badge></div>
	<div>
		<TextContent>
			<h2>TextContent title</h2>
			<p>A paragraph with <a href="#">a link</a> and <code>code</code>.</p>
			<ul>
				<li>list item one</li>
				<li>list item two</li>
			</ul>
		</TextContent>
		<div><Checkbox>Unchecked</Checkbox></div>
	<div><Checkbox checked>Checked</Checkbox></div>
	<div><Checkbox indeterminate>Indeterminate</Checkbox></div>
	<div><Checkbox disabled>Disabled</Checkbox></div>
	<div><Checkbox checked disabled>Checked disabled</Checkbox></div>
	<div><Checkbox checked description="A short description">With description</Checkbox></div>
	<div><Icon name="settings" /><Icon name="search" /><Icon name="close" /><Icon name="status-positive" /><Icon name="external" /></div>
	<div><Icon name="settings" size="small" /><Icon name="settings" size="big" /><Icon name="settings" size="large" /></div>
	<div><Icon name="status-positive" variant="success" /><Icon name="status-warning" variant="warning" /><Icon name="status-negative" variant="error" /><Icon name="settings" variant="disabled" /><Icon name="settings" variant="subtle" /></div>
	<div><Container>{#snippet header()}My container{/snippet}Some container content here.</Container></div>
	<div><Container>{#snippet header()}With footer{/snippet}{#snippet footer()}Footer text{/snippet}Body content.</Container></div>
	<div><Container variant="stacked">{#snippet header()}Stacked variant{/snippet}Stacked body.</Container></div>
	<div><Container disableContentPaddings>{#snippet header()}No content paddings{/snippet}Edge-to-edge body.</Container></div>
	<div><Header>Default H2 header</Header></div>
	<div><Header variant="h1">H1 header</Header></div>
	<div><Header variant="h3">H3 header</Header></div>
	<div><Header description="Some descriptive text under the heading.">Header with description</Header></div>
	<div><Header counter="(42)">Header with counter</Header></div>
	<div><Header>{#snippet actions()}<button>Action</button>{/snippet}Header with actions</Header></div>
	<div><Button>Normal</Button></div>
	<div><Button variant="primary">Primary</Button></div>
	<div><Button variant="link">Link</Button></div>
	<div><Button iconName="settings">Icon left</Button></div>
	<div><Button iconName="external" iconAlign="right">Icon right</Button></div>
	<div><Button loading loadingText="Loading">Loading</Button></div>
	<div><Button disabled>Disabled</Button></div>
	<div><Button variant="primary" iconName="settings">Primary icon</Button></div>
	<div><Input value="" placeholder="Text input" /></div>
	<div><Input value="typed value" /></div>
	<div><Input type="search" placeholder="Search" /></div>
	<div><Input type="search" value="query" /></div>
	<div><Input value="disabled" disabled /></div>
	<div><Input value="invalid" invalid /></div>
	<div><TextFilter filteringText="" filteringPlaceholder="Find resources" /></div>
	<div><TextFilter filteringText="web" filteringPlaceholder="Find resources" /></div>
	<div><StatusIndicator type="success">Available</StatusIndicator></div>
	<div><StatusIndicator type="error">Failed</StatusIndicator></div>
	<div><StatusIndicator type="warning">Degraded</StatusIndicator></div>
	<div><StatusIndicator type="info">Updating</StatusIndicator></div>
	<div><StatusIndicator type="stopped">Stopped</StatusIndicator></div>
	<div><StatusIndicator type="pending">Pending</StatusIndicator></div>
	<div><StatusIndicator type="in-progress">In progress</StatusIndicator></div>
	<div><StatusIndicator type="loading">Loading</StatusIndicator></div>
	<div><StatusIndicator type="not-started">Not started</StatusIndicator></div>
	<div><StatusIndicator type="error" colorOverride="grey">Suppressed error</StatusIndicator></div>
	<div><Link href="#">Default link (anchor)</Link></div>
	<div><Link>Button link (no href)</Link></div>
	<div><Link variant="primary" href="#">Primary link</Link></div>
	<div><Link variant="info">Info link</Link></div>
	<div><Link external href="#">External link</Link></div>
	<div><Link fontSize="heading-m" href="#">Heading-m link</Link></div>
	<div><Link fontSize="body-s" href="#">Body-s link</Link></div>
	<div><Link color="inverted" href="#">Inverted color</Link></div>
	<div><Toggle checked={false}>Toggle off</Toggle></div>
	<div><Toggle checked={true}>Toggle on</Toggle></div>
	<div><Toggle checked={true} disabled>Toggle disabled</Toggle></div>
	<div><Toggle checked={false} description="With description">Toggle + desc</Toggle></div>
	<div><RadioButton checked={false}>Radio off</RadioButton></div>
	<div><RadioButton checked={true}>Radio on</RadioButton></div>
	<div><RadioButton checked={true} disabled>Radio disabled</RadioButton></div>
	<div><RadioButton checked={false} description="Radio description">Radio + desc</RadioButton></div>
	<div><Textarea value={"Textarea content\nsecond line"} /></div>
	<div><Textarea value="" placeholder="Placeholder text" /></div>
	<div><Textarea value="readonly" readOnly /></div>
	<div><Textarea value="invalid" invalid /></div>
	<div><ToggleButton iconName="settings" pressed={false}>Toggle btn</ToggleButton></div>
	<div><ToggleButton iconName="settings" pressed={true}>Pressed</ToggleButton></div>
	<div>
		<Grid
			columns={[
				{ colspan: 6, content: gridA },
				{ colspan: 6, content: gridB },
			]}
		/>
	</div>
	<div><LiveRegion>SR-only announcement (no painted box)</LiveRegion></div>
	<div><Alert type="info">Informational alert message.</Alert></div>
	<div><Alert type="success">Operation succeeded.</Alert></div>
	<div><Alert type="warning">Heads up, check this.</Alert></div>
	<div><Alert type="error">Something went wrong.</Alert></div>
	<div><Alert type="info" dismissible>Dismissible alert.</Alert></div>
	<div><Alert type="error">{#snippet header()}Error header{/snippet}With a header line.</Alert></div>
	<div>
		<RadioGroup
			value="b"
			items={[
				{ value: 'a', label: 'Option A' },
				{ value: 'b', label: 'Option B' },
				{ value: 'c', label: 'Option C', description: 'With a description' },
			]}
		/>
	</div>
	<div>
		<FormField label="Field label" description="Helpful description text" constraintText="Constraint hint">
			<Input value="field value" />
		</FormField>
	</div>
	<div>
		<FormField label="Field with error" errorText="This field is required">
			<Input value="" placeholder="Enter value" />
		</FormField>
	</div>
	<div><ProgressBar value={40} label="Uploading" description="Transferring files" /></div>
	<div><ProgressBar value={100} label="Complete" additionalInfo="All done" /></div>
	<div><ProgressBar status="error" label="Failed" resultText="Upload failed" /></div>
	<div>
		<ColumnLayout columns={2} colItems={[{ content: cl2a }, { content: cl2b }]} />
	</div>
	<div>
		<ColumnLayout columns={3} borders="vertical" colItems={[{ content: cl3a }, { content: cl3b }, { content: cl3c }]} />
	</div>
	<div>
		<Tiles
			value="t2"
			items={[
				{ value: 't1', label: 'Tile one', description: 'First option' },
				{ value: 't2', label: 'Tile two', description: 'Second option' },
				{ value: 't3', label: 'Tile three', description: 'Third option' },
			]}
		/>
	</div>
	<div><IconProvider><Icon name="settings" /> wrapped by IconProvider</IconProvider></div>
	<div><FileInput>Choose file</FileInput></div>
	<div><FileInput variant="icon" ariaLabel="Upload" /></div>
	<div>
		<Steps
			steps={[
				{ status: 'success', header: 'Step one done', details: 'Completed successfully' },
				{ status: 'in-progress', header: 'Step two running' },
				{ status: 'pending', header: 'Step three pending' },
			]}
		/>
	</div>
	<div><ExpandableSection headerText="Collapsed section">Hidden content here.</ExpandableSection></div>
	<div><ExpandableSection headerText="Expanded section" defaultExpanded>Visible content body.</ExpandableSection></div>
	<div><DateInput value="2026/05/18" /></div>
	<div><TimeInput value="14:30:00" /></div>
	<div>
		<AnchorNavigation
			activeHref="#two"
			anchors={[
				{ href: '#one', text: 'Section one', level: 1 },
				{ href: '#two', text: 'Section two', level: 1 },
				{ href: '#two-a', text: 'Subsection', level: 2 },
				{ href: '#three', text: 'Section three', level: 1, info: 'New' },
			]}
		/>
	</div>
	<div>
		<Form>
			{#snippet header()}Form header{/snippet}
			Form body content.
			{#snippet actions()}<button>Submit</button>{/snippet}
		</Form>
	</div>
	<div>
		<Form errorText="Form-level error">
			{#snippet header()}Form with error{/snippet}
			Body.
		</Form>
	</div>
	<div><FileDropzone>Drop files here</FileDropzone></div>
	<div><NavigableGroup><button>A</button> <button>B</button> <button>C</button></NavigableGroup></div>
	<div>
		<List
			items={[
				{ id: 'l1', content: 'List item one', secondaryContent: 'secondary one' },
				{ id: 'l2', content: 'List item two', secondaryContent: 'secondary two' },
				{ id: 'l3', content: 'List item three' },
			]}
			renderItem={(x) => x}
			ariaLabel="Demo list"
		/>
	</div>
	<div><ItemCard header="Card title" description="Card description">Card body content.</ItemCard></div>
	<div><ItemCard header="With footer" footer="Footer text">Body.</ItemCard></div>
	<div><ActionCard header="Action card title" description="Action description">Action body.</ActionCard></div>
	<div>
		<TreeView
			ariaLabel="Demo tree"
			expandedItems={['t-1']}
			items={[
				{ id: 't-1', label: 'Root one', children: [
					{ id: 't-1-a', label: 'Child A' },
					{ id: 't-1-b', label: 'Child B' },
				] },
				{ id: 't-2', label: 'Root two' },
			]}
			getItemId={(i) => i.id}
			getItemChildren={(i) => i.children}
			renderItem={(i) => ({ content: i.label })}
		/>
	</div>
	<div><Pagination currentPageIndex={3} pagesCount={8} /></div>
	<div><Pagination currentPageIndex={1} pagesCount={3} /></div>
	<div><Pagination currentPageIndex={2} pagesCount={20} /></div>
	<div><Slider value={40} min={0} max={100} /></div>
	<div><Slider value={70} min={0} max={100} step={10} /></div>
	<div><Slider value={20} min={0} max={100} disabled /></div>
	<div><CopyToClipboard copyButtonText="Copy" textToCopy="hello" textToDisplay="hello world" /></div>
	<div><CopyToClipboard variant="icon" copyButtonAriaLabel="Copy ARN" textToCopy="arn:..." /></div>
	<div><ButtonDropdown items={[{id:"a",text:"Item A"},{id:"b",text:"Item B"}]}>Actions</ButtonDropdown></div>
	<div><ButtonDropdown variant="primary" items={[{id:"a",text:"One"}]}>Primary</ButtonDropdown></div>
	<div><ButtonDropdown variant="icon" ariaLabel="More" items={[{id:"a",text:"X"}]} /></div>
	<div>
		<KeyValuePairs
			ariaLabel="Demo KVP"
			columns={2}
			items={[
				{ label: "Distribution ID", value: "E1WG1ZNPRXT0D4" },
				{ label: "Status", value: "Enabled" },
				{ label: "Domain", value: "abc.cloudfront.net", info: "(i)" },
				{ label: "Price class", value: "Use all edge locations" },
			]}
		/>
	</div>
	<div>
		<Tabs
			ariaLabel="Demo tabs"
			activeTabId="t2"
			tabs={[
				{ id: 't1', label: 'First tab', content: 'First panel content.' },
				{ id: 't2', label: 'Second tab', content: 'Second panel content.' },
				{ id: 't3', label: 'Disabled', content: 'Hidden', disabled: true },
			]}
		/>
	</div>
</div>
</div>

{#snippet cl2a()}<div style="background:#eef">CL2 A</div>{/snippet}
{#snippet cl2b()}<div style="background:#fee">CL2 B</div>{/snippet}
{#snippet cl3a()}<div style="background:#eef">CL3 A</div>{/snippet}
{#snippet cl3b()}<div style="background:#efe">CL3 B</div>{/snippet}
{#snippet cl3c()}<div style="background:#fee">CL3 C</div>{/snippet}

{#snippet gridA()}<div style="background:#eee;padding:8px">Column A (colspan 6)</div>{/snippet}
{#snippet gridB()}<div style="background:#ddd;padding:8px">Column B (colspan 6)</div>{/snippet}

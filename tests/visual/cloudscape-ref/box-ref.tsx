import "@cloudscape-design/global-styles/index.css";
import { createRoot } from "react-dom/client";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Divider from "@cloudscape-design/components/divider";
import Badge from "@cloudscape-design/components/badge";
import TextContent from "@cloudscape-design/components/text-content";
import Checkbox from "@cloudscape-design/components/checkbox";
import Icon from "@cloudscape-design/components/icon";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import Input from "@cloudscape-design/components/input";
import TextFilter from "@cloudscape-design/components/text-filter";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Link from "@cloudscape-design/components/link";
import Grid from "@cloudscape-design/components/grid";
import Toggle from "@cloudscape-design/components/toggle";
import RadioButton from "@cloudscape-design/components/radio-button";
import Textarea from "@cloudscape-design/components/textarea";
import ToggleButton from "@cloudscape-design/components/toggle-button";
import LiveRegion from "@cloudscape-design/components/live-region";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import ProgressBar from "@cloudscape-design/components/progress-bar";
import Tiles from "@cloudscape-design/components/tiles";
import IconProvider from "@cloudscape-design/components/icon-provider";
import Steps from "@cloudscape-design/components/steps";
import FileInput from "@cloudscape-design/components/file-input";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import DateInput from "@cloudscape-design/components/date-input";
import TimeInput from "@cloudscape-design/components/time-input";
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";
import Form from "@cloudscape-design/components/form";
import FileDropzone from "@cloudscape-design/components/file-dropzone";
import NavigableGroup from "@cloudscape-design/components/navigable-group";
import List from "@cloudscape-design/components/list";
import ItemCard from "@cloudscape-design/components/item-card";
import ActionCard from "@cloudscape-design/components/action-card";
import TreeView from "@cloudscape-design/components/tree-view";
const noop = () => {};

function M() {
  return (
    <div
      id="matrix"
      style={{
        width: 520,
        background: "#fff",
        padding: 24,
        fontFamily: "'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
      }}
    >
      <div>
        <Box variant="h1">Heading 1</Box>
      </div>
      <div>
        <Box variant="h2">Heading 2</Box>
      </div>
      <div>
        <Box variant="h3">Heading 3</Box>
      </div>
      <div>
        <Box variant="p">Paragraph body text in a Box.</Box>
      </div>
      <div>
        <Box variant="strong">Strong inline</Box>
      </div>
      <div>
        <Box variant="small">Small caption text</Box>
      </div>
      <div>
        <Box variant="code">const x = 1;</Box>
      </div>
      <div>
        <Box variant="span" fontWeight="bold">
          Bold span
        </Box>
      </div>
      <div>
        <Box variant="p" color="text-status-error">
          Error colored paragraph
        </Box>
      </div>
      <div>
        <Box variant="p" color="text-body-secondary">
          Secondary colored paragraph
        </Box>
      </div>
      <div>
        <Box variant="div" padding="m">
          Padded m
        </Box>
      </div>
      <div>
        <Box variant="div" textAlign="center">
          Centered text
        </Box>
      </div>
      <div>
        <Box variant="p" fontSize="heading-xl">
          Heading XL font size
        </Box>
      </div>
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
      <div>
        <Divider />
      </div>
      <div>
        <Divider>Labeled divider</Divider>
      </div>
      <div>
        <Badge>1</Badge>
      </div>
      <div>
        <Badge color="blue">New</Badge>
      </div>
      <div>
        <Badge color="red">Error</Badge>
      </div>
      <div>
        <Badge color="green">OK</Badge>
      </div>
      <div>
        <TextContent>
          <h2>TextContent title</h2>
          <p>
            A paragraph with <a href="#">a link</a> and <code>code</code>.
          </p>
          <ul>
            <li>list item one</li>
            <li>list item two</li>
          </ul>
        </TextContent>
      </div>
      <div>
        <Checkbox checked={false} onChange={noop}>
          Unchecked
        </Checkbox>
      </div>
      <div>
        <Checkbox checked={true} onChange={noop}>
          Checked
        </Checkbox>
      </div>
      <div>
        <Checkbox checked={false} indeterminate={true} onChange={noop}>
          Indeterminate
        </Checkbox>
      </div>
      <div>
        <Checkbox checked={false} disabled={true} onChange={noop}>
          Disabled
        </Checkbox>
      </div>
      <div>
        <Checkbox checked={true} disabled={true} onChange={noop}>
          Checked disabled
        </Checkbox>
      </div>
      <div>
        <Checkbox checked={true} description="A short description" onChange={noop}>
          With description
        </Checkbox>
      </div>
      <div>
        <Icon name="settings" />
        <Icon name="search" />
        <Icon name="close" />
        <Icon name="status-positive" />
        <Icon name="external" />
      </div>
      <div>
        <Icon name="settings" size="small" />
        <Icon name="settings" size="big" />
        <Icon name="settings" size="large" />
      </div>
      <div>
        <Icon name="status-positive" variant="success" />
        <Icon name="status-warning" variant="warning" />
        <Icon name="status-negative" variant="error" />
        <Icon name="settings" variant="disabled" />
        <Icon name="settings" variant="subtle" />
      </div>
      <div>
        <Container header={<>My container</>}>Some container content here.</Container>
      </div>
      <div>
        <Container header={<>With footer</>} footer={<>Footer text</>}>
          Body content.
        </Container>
      </div>
      <div>
        <Container variant="stacked" header={<>Stacked variant</>}>
          Stacked body.
        </Container>
      </div>
      <div>
        <Container disableContentPaddings header={<>No content paddings</>}>
          Edge-to-edge body.
        </Container>
      </div>
      <div>
        <Header>Default H2 header</Header>
      </div>
      <div>
        <Header variant="h1">H1 header</Header>
      </div>
      <div>
        <Header variant="h3">H3 header</Header>
      </div>
      <div>
        <Header description="Some descriptive text under the heading.">Header with description</Header>
      </div>
      <div>
        <Header counter="(42)">Header with counter</Header>
      </div>
      <div>
        <Header actions={<button>Action</button>}>Header with actions</Header>
      </div>
      <div>
        <Button>Normal</Button>
      </div>
      <div>
        <Button variant="primary">Primary</Button>
      </div>
      <div>
        <Button variant="link">Link</Button>
      </div>
      <div>
        <Button iconName="settings">Icon left</Button>
      </div>
      <div>
        <Button iconName="external" iconAlign="right">
          Icon right
        </Button>
      </div>
      <div>
        <Button loading loadingText="Loading">
          Loading
        </Button>
      </div>
      <div>
        <Button disabled>Disabled</Button>
      </div>
      <div>
        <Button variant="primary" iconName="settings">
          Primary icon
        </Button>
      </div>
      <div>
        <Input value="" placeholder="Text input" onChange={noop} />
      </div>
      <div>
        <Input value="typed value" onChange={noop} />
      </div>
      <div>
        <Input type="search" value="" placeholder="Search" onChange={noop} />
      </div>
      <div>
        <Input type="search" value="query" onChange={noop} />
      </div>
      <div>
        <Input value="disabled" disabled onChange={noop} />
      </div>
      <div>
        <Input value="invalid" invalid onChange={noop} />
      </div>
      <div>
        <TextFilter filteringText="" filteringPlaceholder="Find resources" onChange={noop} />
      </div>
      <div>
        <TextFilter filteringText="web" filteringPlaceholder="Find resources" onChange={noop} />
      </div>
      <div>
        <StatusIndicator type="success">Available</StatusIndicator>
      </div>
      <div>
        <StatusIndicator type="error">Failed</StatusIndicator>
      </div>
      <div>
        <StatusIndicator type="warning">Degraded</StatusIndicator>
      </div>
      <div>
        <StatusIndicator type="info">Updating</StatusIndicator>
      </div>
      <div>
        <StatusIndicator type="stopped">Stopped</StatusIndicator>
      </div>
      <div>
        <StatusIndicator type="pending">Pending</StatusIndicator>
      </div>
      <div>
        <StatusIndicator type="in-progress">In progress</StatusIndicator>
      </div>
      <div>
        <StatusIndicator type="loading">Loading</StatusIndicator>
      </div>
      <div>
        <StatusIndicator type="not-started">Not started</StatusIndicator>
      </div>
      <div>
        <StatusIndicator type="error" colorOverride="grey">
          Suppressed error
        </StatusIndicator>
      </div>
      <div>
        <Link href="#">Default link (anchor)</Link>
      </div>
      <div>
        <Link>Button link (no href)</Link>
      </div>
      <div>
        <Link variant="primary" href="#">
          Primary link
        </Link>
      </div>
      <div>
        <Link variant="info">Info link</Link>
      </div>
      <div>
        <Link external href="#">
          External link
        </Link>
      </div>
      <div>
        <Link fontSize="heading-m" href="#">
          Heading-m link
        </Link>
      </div>
      <div>
        <Link fontSize="body-s" href="#">
          Body-s link
        </Link>
      </div>
      <div>
        <Link color="inverted" href="#">
          Inverted color
        </Link>
      </div>
      <div>
        <Toggle checked={false} onChange={noop}>
          Toggle off
        </Toggle>
      </div>
      <div>
        <Toggle checked={true} onChange={noop}>
          Toggle on
        </Toggle>
      </div>
      <div>
        <Toggle checked={true} disabled onChange={noop}>
          Toggle disabled
        </Toggle>
      </div>
      <div>
        <Toggle checked={false} description="With description" onChange={noop}>
          Toggle + desc
        </Toggle>
      </div>
      <div>
        <RadioButton checked={false} onChange={noop}>
          Radio off
        </RadioButton>
      </div>
      <div>
        <RadioButton checked={true} onChange={noop}>
          Radio on
        </RadioButton>
      </div>
      <div>
        <RadioButton checked={true} disabled onChange={noop}>
          Radio disabled
        </RadioButton>
      </div>
      <div>
        <RadioButton checked={false} description="Radio description" onChange={noop}>
          Radio + desc
        </RadioButton>
      </div>
      <div>
        <Textarea value={"Textarea content\nsecond line"} onChange={noop} />
      </div>
      <div>
        <Textarea value="" placeholder="Placeholder text" onChange={noop} />
      </div>
      <div>
        <Textarea value="readonly" readOnly onChange={noop} />
      </div>
      <div>
        <Textarea value="invalid" invalid onChange={noop} />
      </div>
      <div>
        <ToggleButton iconName="settings" pressed={false} onChange={noop}>
          Toggle btn
        </ToggleButton>
      </div>
      <div>
        <ToggleButton iconName="settings" pressed={true} onChange={noop}>
          Pressed
        </ToggleButton>
      </div>
      <div>
        <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
          <div style={{ background: "#eee", padding: 8 }}>Column A (colspan 6)</div>
          <div style={{ background: "#ddd", padding: 8 }}>Column B (colspan 6)</div>
        </Grid>
      </div>
      <div>
        <LiveRegion>SR-only announcement (no painted box)</LiveRegion>
      </div>
      <div>
        <Alert type="info">Informational alert message.</Alert>
      </div>
      <div>
        <Alert type="success">Operation succeeded.</Alert>
      </div>
      <div>
        <Alert type="warning">Heads up, check this.</Alert>
      </div>
      <div>
        <Alert type="error">Something went wrong.</Alert>
      </div>
      <div>
        <Alert type="info" dismissible>
          Dismissible alert.
        </Alert>
      </div>
      <div>
        <Alert type="error" header="Error header">
          With a header line.
        </Alert>
      </div>
      <div>
        <RadioGroup
          value="b"
          onChange={noop}
          items={[
            { value: "a", label: "Option A" },
            { value: "b", label: "Option B" },
            { value: "c", label: "Option C", description: "With a description" },
          ]}
        />
      </div>
      <div>
        <FormField label="Field label" description="Helpful description text" constraintText="Constraint hint">
          <Input value="field value" onChange={noop} />
        </FormField>
      </div>
      <div>
        <FormField label="Field with error" errorText="This field is required">
          <Input value="" placeholder="Enter value" onChange={noop} />
        </FormField>
      </div>
      <div>
        <ProgressBar value={40} label="Uploading" description="Transferring files" />
      </div>
      <div>
        <ProgressBar value={100} label="Complete" additionalInfo="All done" />
      </div>
      <div>
        <ProgressBar status="error" label="Failed" resultText="Upload failed" />
      </div>
      <div>
        <ColumnLayout columns={2}>
          <div style={{ background: "#eef" }}>CL2 A</div>
          <div style={{ background: "#fee" }}>CL2 B</div>
        </ColumnLayout>
      </div>
      <div>
        <ColumnLayout columns={3} borders="vertical">
          <div style={{ background: "#eef" }}>CL3 A</div>
          <div style={{ background: "#efe" }}>CL3 B</div>
          <div style={{ background: "#fee" }}>CL3 C</div>
        </ColumnLayout>
      </div>
      <div>
        <Tiles
          value="t2"
          onChange={noop}
          items={[
            { value: "t1", label: "Tile one", description: "First option" },
            { value: "t2", label: "Tile two", description: "Second option" },
            { value: "t3", label: "Tile three", description: "Third option" },
          ]}
        />
      </div>
      <div>
        <IconProvider>
          <Icon name="settings" /> wrapped by IconProvider
        </IconProvider>
      </div>
      <div>
        <FileInput value={[]} onChange={noop}>
          Choose file
        </FileInput>
      </div>
      <div>
        <FileInput value={[]} onChange={noop} variant="icon" ariaLabel="Upload" />
      </div>
      <div>
        <Steps
          steps={[
            { status: "success", header: "Step one done", details: "Completed successfully" },
            { status: "in-progress", header: "Step two running" },
            { status: "pending", header: "Step three pending" },
          ]}
        />
      </div>
      <div>
        <ExpandableSection headerText="Collapsed section">Hidden content here.</ExpandableSection>
      </div>
      <div>
        <ExpandableSection headerText="Expanded section" defaultExpanded>
          Visible content body.
        </ExpandableSection>
      </div>
      <div>
        <DateInput value="2026/05/18" onChange={noop} />
      </div>
      <div>
        <TimeInput value="14:30:00" onChange={noop} />
      </div>
      <div>
        <AnchorNavigation
          activeHref="#two"
          anchors={[
            { id: "one", href: "#one", text: "Section one", level: 1 },
            { id: "two", href: "#two", text: "Section two", level: 1 },
            { id: "twoa", href: "#two-a", text: "Subsection", level: 2 },
            { id: "three", href: "#three", text: "Section three", level: 1, info: "New" },
          ]}
        />
      </div>
      <div>
        <Form header="Form header" actions={<button>Submit</button>}>
          Form body content.
        </Form>
      </div>
      <div>
        <Form header="Form with error" errorText="Form-level error">
          Body.
        </Form>
      </div>
      <div>
        <FileDropzone onChange={noop}>Drop files here</FileDropzone>
      </div>
      <div>
        <NavigableGroup>
          <button>A</button> <button>B</button> <button>C</button>
        </NavigableGroup>
      </div>
      <div>
        <List
          ariaLabel="Demo list"
          items={[
            { id: "l1", content: "List item one", secondaryContent: "secondary one" },
            { id: "l2", content: "List item two", secondaryContent: "secondary two" },
            { id: "l3", content: "List item three" },
          ]}
          renderItem={(x: any) => x}
        />
      </div>
      <div>
        <ItemCard header="Card title" description="Card description">
          Card body content.
        </ItemCard>
      </div>
      <div>
        <ItemCard header="With footer" footer="Footer text">
          Body.
        </ItemCard>
      </div>
      <div>
        <ActionCard header="Action card title" description="Action description">
          Action body.
        </ActionCard>
      </div>
      <div>
        <TreeView
          ariaLabel="Demo tree"
          expandedItems={["t-1"]}
          items={[
            {
              id: "t-1",
              label: "Root one",
              children: [
                { id: "t-1-a", label: "Child A" },
                { id: "t-1-b", label: "Child B" },
              ],
            },
            { id: "t-2", label: "Root two" },
          ]}
          getItemId={(i: any) => i.id}
          getItemChildren={(i: any) => i.children}
          renderItem={(i: any) => ({ content: i.label })}
        />
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<M />);

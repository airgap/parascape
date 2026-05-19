// Wide-breakpoint parity fixture (Cloudscape side). Content/props
// byte-identical to ../wide-fixture/WideMatrix.svelte. #matrix at 1280px
// so the real components render their wide container-query paths
// (Wizard desktop two-pane, Cards list-grid-4, AttributeEditor xs grid).
import "@cloudscape-design/global-styles/index.css";
import { createRoot } from "react-dom/client";
import Wizard from "@cloudscape-design/components/wizard";
import Cards from "@cloudscape-design/components/cards";
import AttributeEditor from "@cloudscape-design/components/attribute-editor";
import Input from "@cloudscape-design/components/input";
const noop = () => {};

function M() {
  return (
    <div
      id="matrix"
      style={{
        width: 1280,
        background: "#fff",
        padding: 24,
        fontFamily: "'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
      }}
    >
      <div>
        <Wizard
          activeStepIndex={0}
          onCancel={noop}
          onSubmit={noop}
          onNavigate={noop}
          i18nStrings={{
            stepNumberLabel: (n: number) => `Step ${n}`,
            collapsedStepsLabel: (n: number, total: number) => `Step ${n} of ${total}`,
            navigationAriaLabel: "Steps",
            cancelButton: "Cancel",
            previousButton: "Previous",
            nextButton: "Next",
            submitButton: "Submit",
            optional: "optional",
          }}
          steps={[
            {
              title: "Step one",
              description: "First step description",
              content: <div>Step one body content.</div>,
            },
            { title: "Step two", description: "Second step", content: <div>Step two body content.</div> },
            { title: "Review", content: <div>Review body content.</div>, isOptional: true },
          ]}
        />
      </div>
      <div>
        <Cards
          header="Instances"
          cardDefinition={{
            header: (i: any) => i.name,
            sections: [
              { id: "desc", header: "Description", content: (i: any) => i.description },
              { id: "type", header: "Type", content: (i: any) => i.type },
            ],
          }}
          items={[
            { name: "Item 1", description: "First item description", type: "1A" },
            { name: "Item 2", description: "Second item description", type: "2B" },
            { name: "Item 3", description: "Third item description", type: "3C" },
            { name: "Item 4", description: "Fourth item description", type: "4D" },
          ]}
        />
      </div>
      <div>
        <AttributeEditor
          items={[
            { key: "k1", value: "v1" },
            { key: "k2", value: "v2" },
          ]}
          definition={[
            { label: "Key", control: (item: any) => <Input value={item.key} onChange={noop} /> },
            { label: "Value", control: (item: any) => <Input value={item.value} onChange={noop} /> },
          ]}
          addButtonText="Add new item"
          removeButtonText="Remove"
          onAddButtonClick={noop}
          onRemoveButtonClick={noop}
        />
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<M />);

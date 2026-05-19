// Open-modal parity fixture (Cloudscape side). Content/props
// byte-identical to ../cp-fixture/CPFixture.svelte. Playwright clicks
// the trigger to open the real modal, then screenshots the dialog
// element's own bbox (position-independent).
import "@cloudscape-design/global-styles/index.css";
import { createRoot } from "react-dom/client";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
const noop = () => {};

function App() {
  return (
    <div
      id="stage"
      style={{
        width: 760,
        background: "#fff",
        padding: 48,
        fontFamily: "'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
      }}
    >
      <CollectionPreferences
        title="Preferences"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={noop}
        onCancel={noop}
        preferences={{ pageSize: 20, wrapLines: false, stripedRows: false, contentDensity: "comfortable" }}
        pageSizePreference={{
          title: "Page size",
          options: [
            { value: 10, label: "10 items" },
            { value: 20, label: "20 items" },
            { value: 50, label: "50 items" },
          ],
        }}
        wrapLinesPreference={{ label: "Wrap lines", description: "Wrap long text onto multiple lines" }}
        stripedRowsPreference={{ label: "Striped rows", description: "Alternate row shading" }}
        contentDensityPreference={{ label: "Compact mode", description: "Reduce vertical row padding" }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

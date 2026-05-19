// Pie geometry-parity fixture (Cloudscape). Byte-identical to
// ../pie-fixture/PieFixture.svelte.
import "@cloudscape-design/global-styles/index.css";
import { createRoot } from "react-dom/client";
import PieChart from "@cloudscape-design/components/pie-chart";
function App() {
  return (
    <div id="stage" style={{ width: 760, background: "#fff", padding: 24,
      fontFamily: "'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" }}>
      <PieChart
        size="medium"
        variant="pie"
        hideFilter
        ariaLabel="Resource breakdown"
        data={[
          { title: "Running", value: 40 },
          { title: "Stopped", value: 25 },
          { title: "Pending", value: 20 },
          { title: "Terminated", value: 15 },
        ]}
        i18nStrings={{ detailsValue: "Value", detailsPercentage: "Percentage" }}
      />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

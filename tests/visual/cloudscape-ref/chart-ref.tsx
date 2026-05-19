// Phase-0 harness validation: a minimal real Cloudscape BarChart. Used
// to prove render→extract→geomDiff→pixel works end-to-end (self-diff
// must be 0). Phase 1 adds the Parascape side.
import "@cloudscape-design/global-styles/index.css";
import { createRoot } from "react-dom/client";
import BarChart from "@cloudscape-design/components/bar-chart";

function App() {
  return (
    <div id="stage" style={{ width: 760, background: "#fff", padding: 24,
      fontFamily: "'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" }}>
      <BarChart
        height={300}
        hideFilter
        series={[
          { title: "Revenue", type: "bar", data: [
            { x: "Jan", y: 12 }, { x: "Feb", y: 19 }, { x: "Mar", y: 7 }, { x: "Apr", y: 24 }, { x: "May", y: 15 },
          ] },
        ]}
        xDomain={["Jan", "Feb", "Mar", "Apr", "May"]}
        yDomain={[0, 30]}
        xTitle="Month"
        yTitle="USD (k)"
        ariaLabel="Revenue by month"
        i18nStrings={{ xTickFormatter: (x: any) => String(x), yTickFormatter: (y: any) => String(y) }}
      />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

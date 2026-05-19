// Area geometry-parity fixture (Cloudscape). Byte-identical to
// ../area-fixture/AreaFixture.svelte.
import "@cloudscape-design/global-styles/index.css";
import { createRoot } from "react-dom/client";
import AreaChart from "@cloudscape-design/components/area-chart";
function App() {
  return (
    <div id="stage" style={{ width: 760, background: "#fff", padding: 24,
      fontFamily: "'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" }}>
      <AreaChart
        height={300}
        hideFilter
        series={[
          { title: "Series A", type: "area", data: [ {x:0,y:10},{x:1,y:30},{x:2,y:22},{x:3,y:41},{x:4,y:18} ] },
          { title: "Series B", type: "area", data: [ {x:0,y:5},{x:1,y:8},{x:2,y:14},{x:3,y:3},{x:4,y:27} ] },
        ]}
        xDomain={[0, 4]}
        yDomain={[0, 70]}
        xTitle="Time"
        yTitle="Value"
        ariaLabel="Stacked area"
        i18nStrings={{ xTickFormatter: (x: any) => String(x), yTickFormatter: (y: any) => String(y) }}
      />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

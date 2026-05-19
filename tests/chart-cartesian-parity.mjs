// Phase-1 foundation gate: our vendored cartesian scale/tick logic vs
// Cloudscape's internal modules, byte-compared. Proves the
// transliteration is faithful before any SVG component consumes it.
import { ChartScale, NumericChartScale } from "../src/lib/cloudscape/cartesian/scales.ts";
import { createXTicks, createYTicks } from "../src/lib/cloudscape/cartesian/ticks.ts";
import { formatTicks, getVisibleTicks } from "../src/lib/cloudscape/cartesian/label-utils.ts";
import * as Tscales from "../node_modules/@cloudscape-design/components/internal/components/cartesian-chart/scales.js";
import * as Tticks from "../node_modules/@cloudscape-design/components/internal/components/cartesian-chart/ticks.js";
import * as Tlabel from "../node_modules/@cloudscape-design/components/internal/components/cartesian-chart/label-utils.js";

let fails = 0;
const eq = (label, a, b) => {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) {
    fails++;
    console.log(`✗ ${label}\n   ours  = ${sa}\n   their = ${sb}`);
  } else console.log(`✓ ${label}`);
};

// ChartScale: numeric / categorical / time, mapping + d3Scale ticks
{
  const o = new ChartScale("linear", [0, 250], [0, 480]);
  const t = new Tscales.ChartScale("linear", [0, 250], [0, 480]);
  const p = [0, 62.5, 125, 250, 34.27];
  eq(
    "ChartScale linear map",
    p.map(v => o.d3Scale(v)),
    p.map(v => t.d3Scale(v)),
  );
  eq("ChartScale linear isNumeric", o.isNumeric(), t.isNumeric());
}
{
  const cats = ["Jan", "Feb", "Mar", "Apr", "May"];
  const o = new ChartScale("categorical", cats, [0, 600]);
  const t = new Tscales.ChartScale("categorical", cats, [0, 600]);
  eq(
    "ChartScale band pos",
    cats.map(c => o.d3Scale(c)),
    cats.map(c => t.d3Scale(c)),
  );
  eq("ChartScale band bandwidth", o.d3Scale.bandwidth(), t.d3Scale.bandwidth());
}
{
  const o = new ChartScale("categorical", ["a", "b", "c"], [0, 300], true);
  const t = new Tscales.ChartScale("categorical", ["a", "b", "c"], [0, 300], true);
  eq("ChartScale band noOuterPad bw", o.d3Scale.bandwidth(), t.d3Scale.bandwidth());
}
{
  const o = new NumericChartScale("linear", [0, 237], [0, 400], 5);
  const t = new Tscales.NumericChartScale("linear", [0, 237], [0, 400], 5);
  eq("NumericChartScale niced domain", o.d3Scale.domain(), t.d3Scale.domain());
}

// ticks: createXTicks (numeric/time/categorical), createYTicks (+log)
{
  const o = new ChartScale("linear", [0, 250], [0, 480]);
  const t = new Tscales.ChartScale("linear", [0, 250], [0, 480]);
  eq("createXTicks numeric", createXTicks(o, 5), Tticks.createXTicks(t, 5));
  eq("createYTicks numeric", createYTicks(o, 6), Tticks.createYTicks(t, 6));
}
{
  const o = new ChartScale("log", [1, 100000], [0, 500]);
  const t = new Tscales.ChartScale("log", [1, 100000], [0, 500]);
  eq("createYTicks log", createYTicks(o, 6), Tticks.createYTicks(t, 6));
}
{
  const cats = ["Jan", "Feb", "Mar"];
  const o = new ChartScale("categorical", cats, [0, 300]);
  const t = new Tscales.ChartScale("categorical", cats, [0, 300]);
  eq("createXTicks categorical", createXTicks(o, 5), Tticks.createXTicks(t, 5));
}
{
  const d0 = new Date("2024-01-01T00:00:00Z");
  const d1 = new Date("2024-04-10T00:00:00Z");
  const o = new ChartScale("time", [d0, d1], [0, 800]);
  const t = new Tscales.ChartScale("time", [d0, d1], [0, 800]);
  eq("createXTicks time", createXTicks(o, 6).map(Number), Tticks.createXTicks(t, 6).map(Number));
}

// label-utils: formatTicks + getVisibleTicks
{
  const o = new ChartScale("linear", [0, 100], [0, 500]);
  const t = new Tscales.ChartScale("linear", [0, 100], [0, 500]);
  const gls = s => s.length * 7;
  const of = formatTicks({ ticks: [0, 25, 50, 75, 100], scale: o, getLabelSpace: gls });
  const tf = Tlabel.formatTicks({ ticks: [0, 25, 50, 75, 100], scale: t, getLabelSpace: gls });
  eq("formatTicks", of, tf);
  eq("getVisibleTicks", getVisibleTicks(of, 0, 500), Tlabel.getVisibleTicks(tf, 0, 500));
  eq("getVisibleTicks balanced", getVisibleTicks(of, 0, 500, true), Tlabel.getVisibleTicks(tf, 0, 500, true));
}

console.log(
  fails === 0
    ? "\nPHASE-1 FOUNDATION GATE PASS — cartesian scale/tick/label logic byte-faithful"
    : `\nPHASE-1 FOUNDATION GATE FAIL — ${fails} divergence(s)`,
);
process.exit(fails === 0 ? 0 : 1);

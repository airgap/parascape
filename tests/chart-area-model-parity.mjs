// Phase-2a gate: our area-chart model math vs Cloudscape's area-chart/
// model modules, byte-compared (computeDomainX/Y, computeChartProps:
// xScale/yScale mapping + ticks + the stacked computePlotPoints.sx
// scaled points). Proves the area geometry layer is faithful before
// the SVG components consume it.
import { computeDomainX, computeDomainY, computePlotPoints } from "../src/lib/cloudscape/area/utils.ts";
import ours from "../src/lib/cloudscape/area/compute-chart-props.ts";
import { ChartScale } from "../src/lib/cloudscape/cartesian/scales.ts";
import * as Tutils from "../node_modules/@cloudscape-design/components/area-chart/model/utils.js";
import theirs from "../node_modules/@cloudscape-design/components/area-chart/model/compute-chart-props.js";
import { ChartScale as TChartScale } from "../node_modules/@cloudscape-design/components/internal/components/cartesian-chart/scales.js";

let fails = 0;
const eq = (label, a, b) => {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) {
    fails++;
    console.log(`✗ ${label}\n   ours  = ${String(sa).slice(0, 200)}\n   their = ${String(sb).slice(0, 200)}`);
  } else console.log(`✓ ${label}`);
};

const series = [
  {
    type: "area",
    title: "A",
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 30 },
      { x: 2, y: 22 },
      { x: 3, y: 41 },
      { x: 4, y: 18 },
    ],
  },
  {
    type: "area",
    title: "B",
    data: [
      { x: 0, y: 5 },
      { x: 1, y: 8 },
      { x: 2, y: 14 },
      { x: 3, y: 3 },
      { x: 4, y: 27 },
    ],
  },
  { type: "threshold", title: "T", y: 50 },
];
const catSeries = [
  {
    type: "area",
    title: "A",
    data: [
      { x: "Jan", y: 12 },
      { x: "Feb", y: 19 },
      { x: "Mar", y: 7 },
      { x: "Apr", y: 24 },
    ],
  },
  {
    type: "area",
    title: "B",
    data: [
      { x: "Jan", y: 6 },
      { x: "Feb", y: 9 },
      { x: "Mar", y: 15 },
      { x: "Apr", y: 4 },
    ],
  },
];

eq("computeDomainX linear", computeDomainX(series), Tutils.computeDomainX(series));
eq("computeDomainX categorical", computeDomainX(catSeries), Tutils.computeDomainX(catSeries));
eq("computeDomainY linear", computeDomainY(series, "linear"), Tutils.computeDomainY(series, "linear"));
eq("computeDomainY log", computeDomainY(series, "log"), Tutils.computeDomainY(series, "log"));

// computePlotPoints.sx — the stacked scaled {x,y0,y1} points
{
  const xs = new ChartScale("linear", [0, 4], [0, 600]);
  const ys = new ChartScale("linear", [0, 71], [300, 0]);
  const txs = new TChartScale("linear", [0, 4], [0, 600]);
  const tys = new TChartScale("linear", [0, 71], [300, 0]);
  const strip = r =>
    r.map(col => col.map(p => ({ x: p.x, sx: p.scaled.x, y0: p.scaled.y0, y1: p.scaled.y1, v: p.value })));
  eq(
    "computePlotPoints.sx stacked",
    strip(computePlotPoints(series, xs, ys).sx),
    strip(Tutils.computePlotPoints(series, txs, tys).sx),
  );
}

// computeChartProps end-to-end (scales mapping + ticks + plot)
for (const [label, cfg] of [
  ["linear", { isRtl: false, series, xScaleType: "linear", yScaleType: "linear", height: 300, width: 600 }],
  [
    "categorical",
    { isRtl: false, series: catSeries, xScaleType: "categorical", yScaleType: "linear", height: 280, width: 520 },
  ],
]) {
  const o = ours(cfg);
  const t = theirs(cfg);
  const probeX = (o.xScale.domain || []).slice(0, 5);
  eq(
    `computeChartProps[${label}] xScale map`,
    probeX.map(v => o.xScale.d3Scale(v)),
    probeX.map(v => t.xScale.d3Scale(v)),
  );
  eq(
    `computeChartProps[${label}] yScale map`,
    [0, 10, 25, 50].map(v => o.yScale.d3Scale(v)),
    [0, 10, 25, 50].map(v => t.yScale.d3Scale(v)),
  );
  eq(`computeChartProps[${label}] xTicks`, o.xTicks.map(Number), t.xTicks.map(Number));
  eq(`computeChartProps[${label}] yTicks`, o.yTicks, t.yTicks);
  eq(`computeChartProps[${label}] xDomain`, o.xDomain, t.xDomain);
  eq(`computeChartProps[${label}] yDomain`, o.yDomain, t.yDomain);
  const strip = r => r.map(col => col.map(p => ({ x: p.x, sx: p.scaled.x, y0: p.scaled.y0, y1: p.scaled.y1 })));
  eq(`computeChartProps[${label}] plot.sx`, strip(o.plot.sx), strip(t.plot.sx));
}

console.log(
  fails === 0
    ? "\nPHASE-2a GATE PASS — area-chart model math byte-faithful"
    : `\nPHASE-2a GATE FAIL — ${fails} divergence(s)`,
);
process.exit(fails === 0 ? 0 : 1);

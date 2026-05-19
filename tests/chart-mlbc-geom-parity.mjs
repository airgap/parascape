// Phase-1b gate: our mixed-line-bar geometry logic vs Cloudscape's
// internal modules, byte-compared (domain, scaled series/bar-groups,
// one-side-rounded-rect path). Proves the scaled-coordinate layer is
// faithful before the SVG components consume it.
import { computeDomainX, computeDomainY } from "../src/lib/cloudscape/mlbc/domain.ts";
import makeScaledSeries from "../src/lib/cloudscape/mlbc/make-scaled-series.ts";
import makeScaledBarGroups from "../src/lib/cloudscape/mlbc/make-scaled-bar-groups.ts";
import { createOneSideRoundedRectPath } from "../src/lib/cloudscape/mlbc/create-one-side-rounded-rect-path.ts";
import { ChartScale } from "../src/lib/cloudscape/cartesian/scales.ts";
import * as Tdomain from "../node_modules/@cloudscape-design/components/mixed-line-bar-chart/domain.js";
import TmakeScaledSeries from "../node_modules/@cloudscape-design/components/mixed-line-bar-chart/make-scaled-series.js";
import TmakeScaledBarGroups from "../node_modules/@cloudscape-design/components/mixed-line-bar-chart/make-scaled-bar-groups.js";
import { createOneSideRoundedRectPath as TrrPath } from "../node_modules/@cloudscape-design/components/mixed-line-bar-chart/create-one-side-rounded-rect-path.js";
import { ChartScale as TChartScale } from "../node_modules/@cloudscape-design/components/internal/components/cartesian-chart/scales.js";

let fails = 0;
const eq = (label, a, b) => {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) {
    fails++;
    console.log(`✗ ${label}\n   ours  = ${sa}\n   their = ${sb}`);
  } else console.log(`✓ ${label}`);
};

const barSeries = [
  {
    index: 0,
    color: "#1",
    series: {
      type: "bar",
      title: "A",
      data: [
        { x: "Jan", y: 12 },
        { x: "Feb", y: 19 },
        { x: "Mar", y: 7 },
        { x: "Apr", y: 24 },
      ],
    },
  },
  {
    index: 1,
    color: "#2",
    series: {
      type: "bar",
      title: "B",
      data: [
        { x: "Jan", y: 5 },
        { x: "Feb", y: 8 },
        { x: "Mar", y: 14 },
        { x: "Apr", y: 3 },
      ],
    },
  },
];
const lineSeries = [
  {
    index: 0,
    color: "#1",
    series: {
      type: "line",
      title: "L",
      data: [
        { x: 0, y: 10 },
        { x: 1, y: 30 },
        { x: 2, y: 22 },
        { x: 3, y: 41 },
      ],
    },
  },
  { index: 1, color: "#2", series: { type: "threshold", title: "T", y: 25 } },
];

eq(
  "computeDomainX categorical",
  computeDomainX(barSeries, "categorical"),
  Tdomain.computeDomainX(barSeries, "categorical"),
);
eq("computeDomainX linear", computeDomainX(lineSeries, "linear"), Tdomain.computeDomainX(lineSeries, "linear"));
eq(
  "computeDomainY plain",
  computeDomainY(barSeries, "linear", false),
  Tdomain.computeDomainY(barSeries, "linear", false),
);
eq(
  "computeDomainY stacked",
  computeDomainY(barSeries, "linear", true),
  Tdomain.computeDomainY(barSeries, "linear", true),
);
eq(
  "computeDomainY w/threshold",
  computeDomainY(lineSeries, "linear", false),
  Tdomain.computeDomainY(lineSeries, "linear", false),
);
eq("computeDomainY log", computeDomainY(barSeries, "log", false), Tdomain.computeDomainY(barSeries, "log", false));

// makeScaledSeries: line + y-threshold over linear x / linear y
{
  const xs = new ChartScale("linear", [0, 3], [0, 500]);
  const ys = new ChartScale("linear", [0, 41], [300, 0]);
  const txs = new TChartScale("linear", [0, 3], [0, 500]);
  const tys = new TChartScale("linear", [0, 41], [300, 0]);
  const strip = a => a.map(p => ({ x: p.x, y: p.y, dx: p.datum?.x, dy: p.datum?.y }));
  eq(
    "makeScaledSeries line+threshold",
    strip(makeScaledSeries(lineSeries, xs, ys)),
    strip(TmakeScaledSeries(lineSeries, txs, tys)),
  );
}
// makeScaledBarGroups: categorical
{
  const cats = computeDomainX(barSeries, "categorical");
  const xs = new ChartScale("categorical", cats, [0, 600]);
  const txs = new TChartScale("categorical", cats, [0, 600]);
  eq(
    "makeScaledBarGroups x-axis",
    makeScaledBarGroups(barSeries, xs, 600, 300, "y"),
    TmakeScaledBarGroups(barSeries, txs, 600, 300, "y"),
  );
}
// createOneSideRoundedRectPath: each side, with/without radius
for (const side of ["left", "right", "top", "bottom"]) {
  for (const r of [0, 4, 100]) {
    eq(
      `roundedRect ${side} r=${r}`,
      createOneSideRoundedRectPath({ x: 10, y: 20, width: 40, height: 80 }, r, side),
      TrrPath({ x: 10, y: 20, width: 40, height: 80 }, r, side),
    );
  }
}

console.log(
  fails === 0 ? "\nPHASE-1b GATE PASS — mlbc geometry byte-faithful" : `\nPHASE-1b GATE FAIL — ${fails} divergence(s)`,
);
process.exit(fails === 0 ? 0 : 1);

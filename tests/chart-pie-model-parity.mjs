// Phase-3a gate: pie-chart pure math vs Cloudscape's pie-chart/utils.js
// (getDimensionsBySize all sizes/refresh, computeSmartAngle), PLUS the
// end-to-end polar geometry: the d3 pie() factory config (value clamp
// dataSum/100, sort(null)) → pieData start/end angles, and arc() path
// d= strings — vs the real Cloudscape pie/arc setup. Proves the pie
// geometry is byte-faithful before the SVG components consume it.
import { getDimensionsBySize, computeSmartAngle } from "../src/lib/cloudscape/pie/utils.ts";
import * as Tutil from "../node_modules/@cloudscape-design/components/pie-chart/utils.js";
import { pie, arc } from "d3-shape";

let fails = 0;
const eq = (label, a, b) => {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) {
    fails++;
    console.log(`✗ ${label}\n   ours  = ${String(sa).slice(0, 200)}\n   their = ${String(sb).slice(0, 200)}`);
  } else console.log(`✓ ${label}`);
};

for (const vr of [false, true]) {
  for (const size of ["small", "medium", "large"]) {
    eq(
      `getDimensionsBySize ${size} refresh=${vr}`,
      getDimensionsBySize({ size, hasLabels: true, visualRefresh: vr }),
      Tutil.getDimensionsBySize({ size, hasLabels: true, visualRefresh: vr }),
    );
  }
  for (const px of [120, 260, 420, 700]) {
    eq(
      `getDimensionsBySize px=${px} labels refresh=${vr}`,
      getDimensionsBySize({ size: px, hasLabels: true, visualRefresh: vr }),
      Tutil.getDimensionsBySize({ size: px, hasLabels: true, visualRefresh: vr }),
    );
    eq(
      `getDimensionsBySize px=${px} nolabels refresh=${vr}`,
      getDimensionsBySize({ size: px, hasLabels: false, visualRefresh: vr }),
      Tutil.getDimensionsBySize({ size: px, hasLabels: false, visualRefresh: vr }),
    );
  }
}

for (const [s, e, o] of [
  [0, 1, false],
  [0, 1, true],
  [0.1, 3.0, true],
  [3.0, 6.2, true],
  [Math.PI - 0.05, Math.PI + 0.3, true],
  [-0.2, 0.1, true],
  [2, 2.05, true],
]) {
  eq(
    `computeSmartAngle(${s.toFixed(2)},${e.toFixed(2)},${o})`,
    computeSmartAngle(s, e, o),
    Tutil.computeSmartAngle(s, e, o),
  );
}

// End-to-end polar geometry: pie() factory + arc() path strings,
// using the exact Cloudscape pie config (value clamp, sort(null)).
{
  const externalData = [
    { title: "A", value: 40 },
    { title: "B", value: 25 },
    { title: "C", value: 20 },
    { title: "D", value: 15 },
    { title: "tiny", value: 0.3 },
  ];
  const visibleData = externalData.map((datum, index) => ({ datum, index, color: "#x" }));
  const dataSum = visibleData.reduce((sum, d) => sum + d.datum.value, 0);
  const mk = () =>
    pie()
      .value(d => (d.datum.value < dataSum / 100 ? dataSum / 100 : d.datum.value))
      .sort(null);
  const oPie = mk()(visibleData.filter(d => d.datum.value > 0));
  const tPie = mk()(visibleData.filter(d => d.datum.value > 0));
  const stripPie = pd => pd.map(d => ({ v: d.value, s: d.startAngle, e: d.endAngle, p: d.padAngle, i: d.data.index }));
  eq("pie() data (angles/value/order)", stripPie(oPie), stripPie(tPie));

  const dims = getDimensionsBySize({ size: "medium", hasLabels: true, visualRefresh: true });
  const Tdims = Tutil.getDimensionsBySize({ size: "medium", hasLabels: true, visualRefresh: true });
  const af = arc()
    .innerRadius(dims.innerRadius)
    .outerRadius(dims.outerRadius)
    .cornerRadius(dims.cornerRadius || 0);
  const Taf = arc()
    .innerRadius(Tdims.innerRadius)
    .outerRadius(Tdims.outerRadius)
    .cornerRadius(Tdims.cornerRadius || 0);
  eq(
    "arc() segment paths",
    oPie.map(d => af(d)),
    tPie.map(d => Taf(d)),
  );
  eq(
    "arc() centroids",
    oPie.map(d => af.centroid(d)),
    tPie.map(d => Taf.centroid(d)),
  );
  const hf = arc()
    .innerRadius(dims.outerRadius + 4)
    .outerRadius(dims.outerRadius + 6);
  const Thf = arc()
    .innerRadius(Tdims.outerRadius + 4)
    .outerRadius(Tdims.outerRadius + 6);
  eq(
    "arc() highlight paths",
    oPie.map(d => hf(d)),
    tPie.map(d => Thf(d)),
  );
}

console.log(
  fails === 0
    ? "\nPHASE-3a GATE PASS — pie-chart math + polar geometry byte-faithful"
    : `\nPHASE-3a GATE FAIL — ${fails} divergence(s)`,
);
process.exit(fails === 0 ? 0 : 1);

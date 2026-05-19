// Chart Phase 0 gate: prove the vendored src/lib/vendor/d3-scale.js is a
// byte-faithful lift of @cloudscape-design's internal/vendor/d3-scale.js.
// If every scale op returns identical output, chart geometry (tick
// coords, bar x/width, point x/y) is deterministic & identical ⇒ pixel
// parity is achievable. Any divergence here means the lift is wrong and
// every downstream chart phase is unverifiable — so this must pass first.
import * as ours from "../src/lib/vendor/d3-scale.js";
import * as theirs from "../node_modules/@cloudscape-design/components/internal/vendor/d3-scale.js";

let fails = 0;
const eq = (label, a, b) => {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) {
    fails++;
    console.log(`✗ ${label}\n   ours  = ${sa}\n   their = ${sb}`);
  } else {
    console.log(`✓ ${label}`);
  }
};

// scaleLinear: domain→range mapping, nice(), ticks(), tickFormat
for (const [dom, rng] of [
  [
    [0, 100],
    [0, 500],
  ],
  [
    [-37, 213],
    [0, 480],
  ],
  [
    [0.0001, 0.9999],
    [0, 300],
  ],
  [
    [1234, 98765],
    [20, 760],
  ],
]) {
  const o = ours.scaleLinear().domain(dom).range(rng);
  const t = theirs.scaleLinear().domain(dom).range(rng);
  const probe = [dom[0], (dom[0] + dom[1]) / 2, dom[1], dom[0] + (dom[1] - dom[0]) * 0.137];
  eq(
    `linear map ${dom}->${rng}`,
    probe.map(v => o(v)),
    probe.map(v => t(v)),
  );
  eq(`linear nice ${dom}`, o.nice().domain(), t.nice().domain());
  for (const c of [3, 5, 8, 10]) eq(`linear ticks(${c}) ${dom}`, o.ticks(c), t.ticks(c));
}

// scaleBand: categorical bar positioning (bandwidth, step, paddingInner)
for (const pad of [0, 0.1, 0.25, 0.5]) {
  const cats = ["a", "b", "c", "d", "e"];
  const o = ours.scaleBand().domain(cats).range([0, 600]).paddingInner(pad).paddingOuter(pad);
  const t = theirs.scaleBand().domain(cats).range([0, 600]).paddingInner(pad).paddingOuter(pad);
  eq(
    `band pos pad=${pad}`,
    cats.map(c => o(c)),
    cats.map(c => t(c)),
  );
  eq(`band bandwidth pad=${pad}`, o.bandwidth(), t.bandwidth());
  eq(`band step pad=${pad}`, o.step(), t.step());
}

// scaleLog
{
  const o = ours.scaleLog().domain([1, 100000]).range([0, 500]);
  const t = theirs.scaleLog().domain([1, 100000]).range([0, 500]);
  const p = [1, 10, 100, 3162, 100000];
  eq(
    "log map",
    p.map(v => o(v)),
    p.map(v => t(v)),
  );
  eq("log ticks", o.ticks(), t.ticks());
}

// scaleTime: time-axis tick selection (the trickiest — calendar math)
{
  const d0 = new Date("2024-01-01T00:00:00Z");
  const d1 = new Date("2024-06-15T12:00:00Z");
  const o = ours.scaleTime().domain([d0, d1]).range([0, 800]);
  const t = theirs.scaleTime().domain([d0, d1]).range([0, 800]);
  const probe = [d0, new Date("2024-03-01T00:00:00Z"), d1];
  eq(
    "time map",
    probe.map(v => o(v)),
    probe.map(v => t(v)),
  );
  eq(
    "time ticks(6)",
    o.ticks(6).map(d => +d),
    t.ticks(6).map(d => +d),
  );
  eq("time nice", o.nice().domain().map(Number), t.nice().domain().map(Number));
}

console.log(
  fails === 0
    ? "\nPHASE-0 GATE PASS — vendored d3-scale is byte-faithful"
    : `\nPHASE-0 GATE FAIL — ${fails} divergence(s)`,
);
process.exit(fails === 0 ? 0 : 1);

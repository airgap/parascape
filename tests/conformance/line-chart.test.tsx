// AUTO-ADAPTED from cloudscape-design/components src/line-chart/__tests__/
// line-chart.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../../../lib/components/mixed-line-bar-chart.
// JSX is compiled to the adapter h() descriptor by vitest esbuild.
// __STUB: honest recursive no-op for unresolvable Cloudscape-internal
// / sibling-test-helper imports. Callable, constructable (so tests can
// extend it), empty-iterable, deep-property-safe — never throws at
// collection, supplies NO fake data (every access is the stub itself,
// so dependent value/DOM assertions fail honestly, never fake-pass).
const __STUB: any = new Proxy(function () {}, {
	get: (_t, k) =>
		k === Symbol.iterator
			? function* () {}
			: k === Symbol.toPrimitive || k === 'toString' || k === 'valueOf'
				? () => ''
				: __STUB,
	apply: () => __STUB,
	construct: () => ({}),
});
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { React } from '@conformance/adapter';
import { render } from '@conformance/adapter';

import LineChart from '@components/LineChart.pui';
const { MixedLineBarChartProps } = __STUB; // stub: ../../../lib/components/mixed-line-bar-chart
import { createWrapper } from '@conformance/adapter';

function renderLineChart(jsx: React.ReactElement) {
  const { container, rerender } = render(jsx);
  return {
    rerender,
    wrapper: createWrapper(container.parentElement!).findLineChart()!,
  };
}

const lineSeries: MixedLineBarChartProps.LineDataSeries<number> = {
  type: 'line',
  title: 'Line Series 1',
  data: [
    { x: 0, y: 3 },
    { x: 1, y: 10 },
    { x: 2, y: 7 },
    { x: 3, y: 12 },
  ],
};

// Main rendering and testing is done in the MixedChart component. We just make sure that everything is passed down correctly.
describe('Line chart', () => {
  test('can render line series', () => {
    const { wrapper } = renderLineChart(<LineChart series={[lineSeries]} xDomain={[0, 20]} yDomain={[0, 10]} />);

    expect(wrapper.findSeries()).toHaveLength(1);
    expect(wrapper.findSeries()[0].getElement()).toHaveAttribute('aria-label', lineSeries.title);
  });
});

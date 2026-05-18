// AUTO-ADAPTED from cloudscape-design/components src/grid/__tests__/
// grid.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, no extra rules.
// JSX is compiled to the adapter h() descriptor by vitest esbuild.
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { React } from '@conformance/adapter';
import { render } from '@conformance/adapter';

import Grid from '@components/Grid.pui';
import { createWrapper } from '@conformance/adapter';

import styles from '@cloudscape/grid.styles.js';

function renderGrid(props: any = {}) {
  const renderResult = render(<Grid {...props} />);
  return createWrapper(renderResult.container).findGrid()!;
}

function renderColumnInGrid(props: any = {}) {
  const renderResult = render(
    <Grid {...props}>
      <div>One</div>
    </Grid>
  );
  return createWrapper(renderResult.container).findGrid()!.findColumn(1)!;
}

describe('Grid component', () => {
  test('has gutters by default', () => {
    const wrapper = renderGrid();
    expect(wrapper.getElement()).not.toHaveClass(styles['no-gutters']);
  });

  test('disables gutters when gutters=false', () => {
    const wrapper = renderGrid({ disableGutters: true });
    expect(wrapper.getElement()).toHaveClass(styles['no-gutters']);
  });

  test('does not arrange columns if a column definition is not provided', () => {
    // Select all classes that set colspan for any breakpoint.
    const colspanClasses = Object.entries(styles)
      .filter(([src]) => src.includes('colspan-'))
      .map(entry => entry[1]);

    const columnWrapper = renderColumnInGrid({ gridDefinition: [] });
    expect(columnWrapper.getElement()).not.toHaveClass(...colspanClasses);
  });

  test('ignores falsy values provided in children', () => {
    const wrapper = renderGrid({
      gridDefinition: [{ colspan: 12 }, { colspan: 12 }],
      children: [false, null, undefined, <div key={1}>one</div>, <div key={2}>two</div>],
    });
    expect(wrapper.getElement().childElementCount).toBe(2);
  });
});

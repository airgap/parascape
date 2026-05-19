// AUTO-ADAPTED from cloudscape-design/components src/column-layout/__tests__/
// column-layout.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, no extra rules.
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

import ColumnLayout from '@components/ColumnLayout.pui';
import { createWrapper } from '@conformance/adapter';

import styles from '@cloudscape/column-layout.styles.js';

function renderColumnLayout(props: any = {}) {
  const renderResult = render(<ColumnLayout {...props} />);
  // The styling classes are defined on the inner grid.
  return createWrapper(renderResult.container).findGrid()!;
}

describe('ColumnLayout component', () => {
  describe('columns property', () => {
    it('has 1 column by default', () => {
      const wrapper = renderColumnLayout();
      expect(wrapper.getElement()).toHaveClass(styles['grid-columns-1']);
    });

    [2, 3, 4].forEach(columnCount => {
      it(`can have ${columnCount} columns`, () => {
        const wrapper = renderColumnLayout({ columns: columnCount as 2 | 3 | 4 });
        expect(wrapper.getElement()).toHaveClass(styles[`grid-columns-${columnCount}`]);
      });
    });
  });

  describe('borders property', () => {
    it('is none by default', () => {
      const wrapper = renderColumnLayout();
      expect(wrapper.getElement()).not.toHaveClass(styles['grid-vertical-borders']);
      expect(wrapper.getElement()).not.toHaveClass(styles['grid-horizontal-borders']);
    });

    it('applies vertical styling', () => {
      const wrapper = renderColumnLayout({ borders: 'vertical' });
      expect(wrapper.getElement()).toHaveClass(styles['grid-vertical-borders']);
      expect(wrapper.getElement()).not.toHaveClass(styles['grid-horizontal-borders']);
    });

    it('applies horizontal styling', () => {
      const wrapper = renderColumnLayout({ borders: 'horizontal' });
      expect(wrapper.getElement()).not.toHaveClass(styles['grid-vertical-borders']);
      expect(wrapper.getElement()).toHaveClass(styles['grid-horizontal-borders']);
    });

    it('applies both horizontal and vertical when "all" is provided', () => {
      const wrapper = renderColumnLayout({ borders: 'all' });
      expect(wrapper.getElement()).toHaveClass(styles['grid-vertical-borders']);
      expect(wrapper.getElement()).toHaveClass(styles['grid-horizontal-borders']);
    });
  });

  describe('text-grid variant', () => {
    it('disables borders even when a value for borders is provided', () => {
      ['none', 'vertical', 'horizontal', 'all'].forEach(borders => {
        const wrapper = renderColumnLayout({ variant: 'text-grid', borders: borders as any['borders'] });
        expect(wrapper.getElement()).not.toHaveClass(styles['grid-vertical-borders']);
        expect(wrapper.getElement()).not.toHaveClass(styles['grid-horizontal-borders']);
      });
    });
  });
});

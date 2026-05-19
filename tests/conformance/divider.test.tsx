// AUTO-ADAPTED from cloudscape-design/components src/divider/__tests__/
// divider.test.tsx via tests/conformance/codemod.mjs.
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

import Divider from '@components/Divider.pui';
import { createWrapper } from '@conformance/adapter';

import styles from '@cloudscape/divider.styles.js';

function renderDivider(jsx: React.ReactElement) {
  const { container } = render(jsx);
  return createWrapper(container).findDivider()!;
}

describe('Divider', () => {
  describe('defaults', () => {
    test('renders an hr element', () => {
      expect(renderDivider(<Divider />).getElement().tagName).toBe('HR');
    });

    test('applies root CSS class', () => {
      expect(renderDivider(<Divider />).getElement()).toHaveClass(styles.divider);
    });

    test('has role="presentation"', () => {
      expect(renderDivider(<Divider />).getElement()).toHaveAttribute('role', 'presentation');
    });
  });

  describe('orientation', () => {
    test('vertical renders an hr element with role="presentation"', () => {
      const el = renderDivider(<Divider orientation="vertical" />).getElement();
      expect(el.tagName).toBe('HR');
      expect(el).toHaveAttribute('role', 'presentation');
    });
  });

  describe('children (label)', () => {
    test('renders a div when children is set', () => {
      expect(renderDivider(<Divider>OR</Divider>).getElement().tagName).toBe('DIV');
    });

    test('does not have role attribute', () => {
      expect(renderDivider(<Divider>OR</Divider>).getElement()).not.toHaveAttribute('role');
    });

    test('findLabel returns the label element with correct text', () => {
      const wrapper = renderDivider(<Divider>OR</Divider>);
      expect(wrapper.findLabel()!.getElement()).toHaveTextContent('OR');
    });

    test('findLabel returns null when no children', () => {
      expect(renderDivider(<Divider />).findLabel()).toBeNull();
    });

    test('children is ignored for vertical orientation', () => {
      const wrapper = renderDivider(<Divider orientation="vertical">OR</Divider>);
      expect(wrapper.getElement().tagName).toBe('HR');
      expect(wrapper.findLabel()).toBeNull();
    });
  });

  describe('nativeAttributes', () => {
    test('adds data attributes', () => {
      const wrapper = renderDivider(<Divider nativeAttributes={{ 'data-testid': 'my-divider' }} />);
      expect(wrapper.getElement()).toHaveAttribute('data-testid', 'my-divider');
    });

    test('concatenates className', () => {
      const wrapper = renderDivider(<Divider nativeAttributes={{ className: 'custom-class' }} />);
      expect(wrapper.getElement()).toHaveClass(styles.divider);
      expect(wrapper.getElement()).toHaveClass('custom-class');
    });

    test('allows overriding role via nativeAttributes', () => {
      const wrapper = renderDivider(<Divider nativeAttributes={{ role: 'separator' }} />);
      expect(wrapper.getElement()).toHaveAttribute('role', 'separator');
    });
  });
});

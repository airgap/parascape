// AUTO-ADAPTED from cloudscape-design/components src/status-indicator/__tests__/
// status-indicator.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, firstChild→firstElementChild.
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

import StatusIndicator from '@components/StatusIndicator.pui';
import { createWrapper } from '@conformance/adapter';

import styles from '@cloudscape/status-indicator.styles.js';

describe('StatusIndicator', () => {
  test('Renders the class corresponding to the type', function () {
    const { container } = render(<StatusIndicator type="error">The creation failed</StatusIndicator>);
    const statusIndicatorWrapper = createWrapper(container.parentElement!).findStatusIndicator()!;
    expect(statusIndicatorWrapper.getElement()).toHaveClass(styles['status-error']);
  });
  it('Renders the icon if the type is not "loading"', function () {
    const { container } = render(<StatusIndicator type="stopped">The instance stopped</StatusIndicator>);
    const iconWrapper = createWrapper(container.parentElement!).findIcon()!;
    expect(iconWrapper.getElement()).toBeTruthy();
  });
  it('Renders the spinner for type "loading"', function () {
    const { container } = render(<StatusIndicator type="loading">The resource is loading</StatusIndicator>);
    const spinnerWrapper = createWrapper(container.parentElement!).findSpinner()!;
    expect(spinnerWrapper.getElement()).toBeTruthy();
  });
  it('Sets aria-label to the value of the iconAriaLabel prop', function () {
    const ariaLabel = 'Loading';
    const { container } = render(
      <StatusIndicator type="loading" iconAriaLabel={ariaLabel}>
        The resource is loading
      </StatusIndicator>
    );
    const statusIndicatorWrapper = createWrapper(container.parentElement!).findStatusIndicator()!;
    expect(statusIndicatorWrapper.findByClassName(styles.icon)!.getElement()).toHaveAttribute('aria-label', ariaLabel);
  });

  describe('native attributes', () => {
    it('adds native attributes', () => {
      const { container } = render(<StatusIndicator type="info" nativeAttributes={{ 'data-testid': 'my-test-id' }} />);
      expect(container.querySelectorAll('[data-testid="my-test-id"]')).toHaveLength(1);
    });
    it('concatenates class names', () => {
      const { container } = render(
        <StatusIndicator type="info" nativeAttributes={{ className: 'additional-class' }} />
      );
      expect(container.firstElementChild).toHaveClass(styles.root);
      expect(container.firstElementChild).toHaveClass('additional-class');
    });
  });
});

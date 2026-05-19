// AUTO-ADAPTED from cloudscape-design/components src/toggle-button/__tests__/
// toggle-button.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, jest.mock → hoisted vi.mock; stubbed unresolvable ../../../lib/components/toggle-button/util; firstChild→firstElementChild; interaction (manual-triage tier).
// JSX is compiled to the adapter h() descriptor by vitest esbuild.
// ⚠ interaction tests present — see conformance summary; not all are mechanically valid.
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

import { warnOnce } from '@cloudscape-design/component-toolkit/internal';

import { createWrapper } from '@conformance/adapter';
import ToggleButton from '@components/ToggleButton.pui';
const { getToggleIcon } = __STUB; // stub: ../../../lib/components/toggle-button/util

import styles from '@cloudscape/button.styles.js';

vi.mock('@cloudscape-design/component-toolkit/internal', async (importOriginal) => ({
  ...(await importOriginal()),
  warnOnce: jest.fn(),
}));

function renderToggleButton(props: any = { pressed: false }) {
  const renderResult = render(<ToggleButton {...props} />);
  return { wrapper: createWrapper(renderResult.container).findToggleButton()!, ...renderResult };
}

describe('ToggleButton Component', () => {
  afterEach(() => {
    (warnOnce as jest.Mock).mockReset();
  });

  test('should have toggle button attributes by default', () => {
    const { wrapper } = renderToggleButton({
      children: 'button',
      pressed: false,
      iconName: 'star',
      pressedIconName: 'star-filled',
    });

    expect(wrapper.getElement()).toHaveAttribute('aria-pressed', 'false');
  });

  test('should be pressed when pressed prop is set to true', () => {
    const { wrapper } = renderToggleButton({
      children: 'button',
      pressed: true,
      iconName: 'star',
      pressedIconName: 'star-filled',
    });

    expect(wrapper.isPressed()).toBe(true);
  });

  test('should fire onChange on click', () => {
    const onChange = jest.fn();
    const { wrapper } = renderToggleButton({
      children: 'button',
      pressed: false,
      iconName: 'star',
      pressedIconName: 'star-filled',
      onChange,
    });

    wrapper.click();

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { pressed: true } }));
  });

  test('should not fire onChange if disabled', () => {
    const onChange = jest.fn();
    const { wrapper } = renderToggleButton({
      children: 'button',
      pressed: false,
      iconName: 'star',
      pressedIconName: 'star-filled',
      disabled: true,
      onChange,
    });

    wrapper.click();

    expect(onChange).not.toHaveBeenCalled();
  });

  test('throws a warning when pressedIconName icon is not set', () => {
    renderToggleButton({
      children: 'button',
      pressed: false,
      iconName: 'star',
      pressedIconName: undefined,
    });

    expect(warnOnce).toHaveBeenCalledWith('ToggleButton', '`pressedIconName` must be provided for `pressed` state.');
  });

  test('throws a warning when pressedIconSvg icon is not set', () => {
    const svg = (
      <svg className="test-svg" focusable="false">
        <circle className="test-svg-inner" cx="8" cy="8" r="7" />
      </svg>
    );
    renderToggleButton({
      children: 'button',
      pressed: false,
      iconSvg: svg,
      pressedIconSvg: undefined,
    });

    expect(warnOnce).toHaveBeenCalledWith('ToggleButton', '`pressedIconSvg` must be provided for `pressed` state.');
  });

  test('throws a warning when pressedIconUrl icon is not set', () => {
    const url = 'data:image/png;base64,aaaa';
    renderToggleButton({
      children: 'button',
      pressed: false,
      iconUrl: url,
      pressedIconUrl: undefined,
    });

    expect(warnOnce).toHaveBeenCalledWith('ToggleButton', '`pressedIconUrl` must be provided for `pressed` state.');
  });

  describe('icon switch behavior', () => {
    test('should return undefined if icons are not provided', () => {
      expect(getToggleIcon(true, undefined, undefined)).toBe(undefined);
    });

    test('should keep default iconName if provided when pressed is set to false', () => {
      expect(getToggleIcon(false, 'star', 'star-filled')).toBe('star');
    });

    test('should switch default iconName to pressedIconName if provided when pressed is set to true', () => {
      expect(getToggleIcon(true, 'star', 'star-filled')).toBe('star-filled');
    });

    test('should keep default iconName if pressedIconName is not provided and pressed is set true', () => {
      expect(getToggleIcon(true, 'star')).toBe('star');
    });
  });

  describe('native attributes', () => {
    it('adds native attributes', () => {
      const { container } = render(
        <ToggleButton pressed={true} nativeButtonAttributes={{ 'data-testid': 'my-test-id' }} />
      );
      expect(container.querySelectorAll('[data-testid="my-test-id"]')).toHaveLength(1);
      expect(container.querySelectorAll('button[data-testid="my-test-id"]')).toHaveLength(1);
    });
    it('concatenates class names', () => {
      const { container } = render(
        <ToggleButton pressed={true} nativeButtonAttributes={{ className: 'additional-class' }} />
      );
      expect(container.firstElementChild).toHaveClass(styles.button);
      expect(container.firstElementChild).toHaveClass('additional-class');
    });
  });
});

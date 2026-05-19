// AUTO-ADAPTED from cloudscape-design/components src/checkbox/__tests__/
// checkbox.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../base-checkbox; interaction (manual-triage tier).
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

/* eslint-disable jest/no-export */
import { React } from '@conformance/adapter';
import { render } from '@conformance/adapter';

import { AbstractSwitchWrapper } from '@conformance/adapter';
const { BaseCheckboxProps } = __STUB; // stub: ../base-checkbox

export function createCommonTests(Component: React.ComponentType<BaseCheckboxProps>) {
  function renderComponent(jsx: React.ReactElement) {
    const { container, rerender } = render(jsx);
    const element = container.querySelector<HTMLElement>(`.${AbstractSwitchWrapper.rootSelector}`);
    expect(element).not.toBeNull();
    const wrapper = new AbstractSwitchWrapper(element!);
    return { wrapper, rerender };
  }

  describe('Common toggleable tests', () => {
    test('renders label text', () => {
      const { wrapper } = renderComponent(<Component checked={false}>Montevideo</Component>);
      expect(wrapper.findLabel().getElement()).toHaveTextContent('Montevideo');
    });

    test('renders description if provided', () => {
      const { wrapper, rerender } = renderComponent(<Component checked={false} />);
      expect(wrapper.findDescription()).toBeNull();

      rerender(<Component checked={false} description="This is a description" />);
      expect(wrapper.findDescription()!.getElement()).toHaveTextContent('This is a description');
    });

    test('renders component this controlId', () => {
      const { wrapper } = renderComponent(
        <Component checked={false} controlId="something-specific">
          Label
        </Component>
      );
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute('id', 'something-specific');
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute('aria-labelledby', 'something-specific-label');
    });

    test('name is being rendered only if provided', () => {
      const { wrapper, rerender } = renderComponent(<Component checked={false} />);
      expect(wrapper.findNativeInput().getElement()).not.toHaveAttribute('name');

      rerender(<Component checked={false} name="derpName" />);
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute('name', 'derpName');
    });

    test('aria-label can be set to custom value', () => {
      const { wrapper, rerender } = renderComponent(<Component checked={false} />);
      expect(wrapper.findNativeInput().getElement()).not.toHaveAttribute('aria-label');

      rerender(<Component checked={false} ariaLabel="My Label" />);
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute('aria-label', 'My Label');
    });

    test('aria-labelledby can be set to custom value', () => {
      const { wrapper, rerender } = renderComponent(<Component checked={false} />);
      expect(wrapper.findNativeInput().getElement()).not.toHaveAttribute('aria-labelledby');

      rerender(<Component checked={false} ariaLabelledby="my-custom-id" />);
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute(
        'aria-labelledby',
        expect.stringContaining('my-custom-id')
      );
    });

    test('aria-labelledby can be combined with controlId', () => {
      const { wrapper, rerender } = renderComponent(
        <Component checked={false} controlId="my-checkbox" ariaLabelledby="external-id">
          Label
        </Component>
      );
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute(
        'aria-labelledby',
        'my-checkbox-label external-id'
      );

      rerender(
        <Component checked={false} controlId="my-checkbox">
          Label
        </Component>
      );
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute('aria-labelledby', 'my-checkbox-label');

      rerender(<Component checked={false} ariaLabelledby="external-id" />);
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute(
        'aria-labelledby',
        expect.stringContaining('external-id')
      );
    });

    test('aria-describedby can be set to custom value', () => {
      const { wrapper, rerender } = renderComponent(<Component checked={false} />);
      expect(wrapper.findNativeInput().getElement()).not.toHaveAttribute('aria-describedby');

      rerender(<Component checked={false} ariaDescribedby="my-custom-id" />);
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute('aria-describedby', 'my-custom-id');
    });

    test('aria-controls can be set', () => {
      const { wrapper, rerender } = renderComponent(<Component checked={false} />);
      expect(wrapper.findNativeInput().getElement()).not.toHaveAttribute('aria-controls');

      rerender(<Component checked={false} ariaControls="aria-controls-value" />);
      expect(wrapper.findNativeInput().getElement()).toHaveAttribute('aria-controls', 'aria-controls-value');
    });

    test('disables native control when disabled', () => {
      const { wrapper, rerender } = renderComponent(<Component checked={false} disabled={false} />);
      const labelElement = wrapper.findLabel().getElement();
      const nativeInput = wrapper.findNativeInput().getElement();

      expect(nativeInput).not.toHaveAttribute('disabled');
      expect(labelElement).not.toHaveAttribute('aria-disabled');

      rerender(<Component checked={false} disabled={true} />);
      expect(nativeInput).toHaveAttribute('disabled');
      expect(labelElement).toHaveAttribute('aria-disabled', 'true');
    });

    test('triggers a focus and blur events', () => {
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      const { wrapper } = renderComponent(<Component checked={false} onFocus={onFocus} onBlur={onBlur} />);

      wrapper.findNativeInput().focus();
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(0);

      wrapper.findNativeInput().blur();
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });
}

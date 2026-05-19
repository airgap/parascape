// AUTO-ADAPTED from cloudscape-design/components src/form/__tests__/
// form.test.tsx via tests/conformance/codemod.mjs.
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

import Form from '@components/Form.pui';
import { createWrapper } from '@conformance/adapter';

import alertStyles from '@cloudscape/alert.styles.js';
import liveRegionStyles from '@cloudscape/live-region.test-classes.js';

function renderForm(props: any = {}) {
  const { container } = render(<Form {...props} errorIconAriaLabel="Error icon" />);
  return createWrapper(container).findForm()!;
}

describe('Form Component', () => {
  describe('structure', () => {
    it('has no header container when no header is set', () => {
      const wrapper = renderForm();
      expect(wrapper.findHeader()).toBeNull();
    });

    it('displays header - custom html', () => {
      const wrapper = renderForm({ header: <h1>Form header</h1> });
      expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Form header');
    });

    it('has no content container when no content is set', () => {
      const wrapper = renderForm();
      expect(wrapper.findContent()).toBeNull();
    });

    it('displays content - custom html', () => {
      const wrapper = renderForm({ children: <span>Form content</span> });
      expect(wrapper.findContent()!.getElement()).toHaveTextContent('Form content');
    });

    it('form contains no error by default', () => {
      const wrapper = renderForm();
      expect(wrapper.findError()).toBeNull();
    });

    it('form displays the error when set, removes when unset', () => {
      let wrapper = renderForm({ errorText: 'Some error' });
      expect(wrapper.findError()!.getElement()).toHaveTextContent('Some error');

      wrapper = renderForm({ errorText: '' });
      expect(wrapper.findError()).toBeNull();
    });

    it('form error includes alert and live region', () => {
      const wrapper = renderForm({ errorText: 'Some error' });

      expect(wrapper.findByClassName(alertStyles.root)!.getElement()).toHaveTextContent('Some error');
      expect(wrapper.findByClassName(liveRegionStyles.root)!.getElement()).toHaveTextContent('Error icon, Some error');
    });

    it('has no actions container when no actions are set', () => {
      const wrapper = renderForm();
      expect(wrapper.findActions()).toBeNull();
    });

    it('displays action button', () => {
      const wrapper = renderForm({ actions: <button>Click me!</button> });
      expect(wrapper.findActions()!.find('button')!.getElement()).toHaveTextContent('Click me!');
    });
  });
});

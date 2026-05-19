// AUTO-ADAPTED from cloudscape-design/components src/help-panel/__tests__/
// help-panel.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, i18n/testing → passthrough provider.
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

import HelpPanel from '@components/HelpPanel.pui';
const TestI18nProvider = (({ children }: any) => children) as any;
import { createWrapper } from '@conformance/adapter';

function renderHelpPanel(jsx: React.ReactElement) {
  const { container } = render(jsx);
  return createWrapper(container).findHelpPanel()!;
}

test('renders only children by default', () => {
  const wrapper = renderHelpPanel(<HelpPanel>test content</HelpPanel>);
  expect(wrapper.findHeader()).toBeNull();
  expect(wrapper.findFooter()).toBeNull();
  expect(wrapper.findContent()!.getElement()).toHaveTextContent('test content');
});

test('renders header if it is provided', () => {
  const wrapper = renderHelpPanel(<HelpPanel header="Bla bla">there is a header above</HelpPanel>);
  expect(wrapper.findFooter()).toBeNull();
  expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Bla bla');
  expect(wrapper.findContent()!.getElement()).toHaveTextContent('there is a header above');
});

test('renders footer if it is provided', () => {
  const wrapper = renderHelpPanel(<HelpPanel footer="Some footer">test content</HelpPanel>);
  expect(wrapper.findHeader()).toBeNull();
  expect(wrapper.findFooter()!.getElement()).toHaveTextContent('Some footer');
  expect(wrapper.findContent()!.getElement()).toHaveTextContent('test content');
});

test('renders everything together', () => {
  const wrapper = renderHelpPanel(
    <HelpPanel header="Test header" footer="Test footer">
      test content
    </HelpPanel>
  );
  expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Test header');
  expect(wrapper.findFooter()!.getElement()).toHaveTextContent('Test footer');
  expect(wrapper.findContent()!.getElement()).toHaveTextContent('test content');
});

test('renders loading state', () => {
  const { container } = render(<HelpPanel loading={true} loadingText="Loading content" />);
  expect(createWrapper(container).findStatusIndicator()!.getElement()).toHaveTextContent('Loading content');
});

describe('i18n', () => {
  test('supports providing loadingText from i18n provider', () => {
    const { container } = render(
      <TestI18nProvider messages={{ 'help-panel': { loadingText: 'Custom loading text' } }}>
        <HelpPanel loading={true} />
      </TestI18nProvider>
    );
    expect(createWrapper(container).findStatusIndicator()!.getElement()).toHaveTextContent('Custom loading text');
  });
});

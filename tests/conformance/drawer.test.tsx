// AUTO-ADAPTED from cloudscape-design/components src/drawer/__tests__/
// drawer.test.tsx via tests/conformance/codemod.mjs.
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

import Drawer from '@components/Drawer.pui';
const TestI18nProvider = (({ children }: any) => children) as any;
import { createWrapper } from '@conformance/adapter';

function renderDrawer(jsx: React.ReactElement) {
  const { container } = render(jsx);
  return createWrapper(container).findDrawer()!;
}

test('renders only children by default', () => {
  const wrapper = renderDrawer(<Drawer>test content</Drawer>);

  expect(wrapper.findHeader()).toBeNull();
  expect(wrapper.findContent()!.getElement()).toHaveTextContent('test content');
});

test('renders header if it is provided', () => {
  const wrapper = renderDrawer(<Drawer header="Bla bla">there is a header above</Drawer>);
  expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Bla bla');
  expect(wrapper.findContent()!.getElement()).toHaveTextContent('there is a header above');
});

test('renders header actions if it is provided', () => {
  const wrapper = renderDrawer(
    <Drawer header="Bla bla" headerActions={<div>Header actions</div>}>
      there is a header above
    </Drawer>
  );
  expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Bla bla');
  expect(wrapper.findHeaderActions()!.getElement()).toHaveTextContent('Header actions');
  expect(wrapper.findContent()!.getElement()).toHaveTextContent('there is a header above');
});

test('does not render header actions if header is not provided', () => {
  const wrapper = renderDrawer(<Drawer headerActions={<div>Header actions</div>}>there is a header above</Drawer>);
  expect(wrapper.findHeaderActions()).toBeFalsy();
});

test('renders loading state', () => {
  const { container } = render(<Drawer loading={true} i18nStrings={{ loadingText: 'Loading content' }} />);
  expect(createWrapper(container).findStatusIndicator()!.getElement()).toHaveTextContent('Loading content');
  expect(createWrapper(container).findDrawer()!.findHeader()).toBeNull();
  expect(createWrapper(container).findDrawer()!.findContent()).toBeNull();
});

describe('footer', () => {
  test('does not render footer by default', () => {
    const wrapper = renderDrawer(<Drawer>test content</Drawer>);
    expect(wrapper.findFooter()).toBeNull();
  });

  test('renders footer when footer prop is provided', () => {
    const wrapper = renderDrawer(<Drawer footer={<div>Footer content</div>}>test content</Drawer>);
    expect(wrapper.findFooter()!.getElement()).toHaveTextContent('Footer content');
  });

  test('footer does not interfere with header rendering', () => {
    const wrapper = renderDrawer(
      <Drawer header="Header text" footer={<div>Footer content</div>}>
        Body content
      </Drawer>
    );
    expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Header text');
    expect(wrapper.findFooter()!.getElement()).toHaveTextContent('Footer content');
    expect(wrapper.findContent()!.getElement()).toHaveTextContent('Body content');
  });

  test('footer does not render in loading state', () => {
    const wrapper = renderDrawer(
      <Drawer loading={true} footer={<div>Footer content</div>} i18nStrings={{ loadingText: 'Loading...' }} />
    );
    expect(wrapper.findFooter()).toBeNull();
  });
});

describe('i18n', () => {
  test('supports providing loadingText from i18n provider', () => {
    const { container } = render(
      <TestI18nProvider messages={{ drawer: { 'i18nStrings.loadingText': 'Custom loading text' } }}>
        <Drawer loading={true} />
      </TestI18nProvider>
    );
    expect(createWrapper(container).findStatusIndicator()!.getElement()).toHaveTextContent('Custom loading text');
  });
});

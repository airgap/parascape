// AUTO-ADAPTED from cloudscape-design/components src/split-panel/__tests__/
// split-panel.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, i18n/testing → passthrough provider; stubbed unresolvable ../../../lib/components/internal/context/split-panel-context; stubbed unresolvable ./helpers.
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

const TestI18nProvider = (({ children }: any) => children) as any;
const { SplitPanelContextProps,
  SplitPanelContextProvider, } = __STUB; // stub: ../../../lib/components/internal/context/split-panel-context
import SplitPanel from '@components/SplitPanel.pui';
import { createWrapper } from '@conformance/adapter';
const { defaultSplitPanelContextProps } = __STUB; // stub: ./helpers

const i18nStrings = {
  closeButtonAriaLabel: 'closeButtonAriaLabel',
  openButtonAriaLabel: 'openButtonAriaLabel',
  preferencesTitle: 'preferencesTitle',
  preferencesPositionLabel: 'preferencesPositionLabel',
  preferencesPositionDescription: 'preferencesPositionDescription',
  preferencesPositionSide: 'preferencesPositionSide',
  preferencesPositionBottom: 'preferencesPositionBottom',
  preferencesConfirm: 'preferencesConfirm',
  preferencesCancel: 'preferencesCancel',
  resizeHandleAriaLabel: 'resizeHandleAriaLabel',
};

export const defaultProps: any = {
  header: 'Split panel header',
  children: <p>Split panel content</p>,
  hidePreferencesButton: undefined,
  i18nStrings,
};

export function renderSplitPanel({
  props,
  contextProps,
  messages = {},
  modalMessages = {},
}: {
  props?: Partial<any>;
  contextProps?: Partial<SplitPanelContextProps>;
  messages?: Record<string, string>;
  modalMessages?: Record<string, string>;
} = {}) {
  const { container } = render(
    <TestI18nProvider messages={{ 'split-panel': messages, modal: modalMessages }}>
      <SplitPanelContextProvider value={{ ...defaultSplitPanelContextProps, ...contextProps }}>
        <SplitPanel {...defaultProps} {...props} />
      </SplitPanelContextProvider>
    </TestI18nProvider>
  );
  const wrapper = createWrapper(container).findSplitPanel();
  return { wrapper };
}

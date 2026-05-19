// AUTO-ADAPTED from cloudscape-design/components src/split-panel/__tests__/
// split-panel.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../../../lib/components/internal/context/split-panel-context; interaction (manual-triage tier).
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
const { SplitPanelContextProps } = __STUB; // stub: ../../../lib/components/internal/context/split-panel-context

export const defaultSplitPanelContextProps: SplitPanelContextProps = {
  topOffset: 0,
  bottomOffset: 0,
  leftOffset: 0,
  rightOffset: 0,
  position: 'bottom',
  size: 0,
  relativeSize: 0,
  isOpen: true,
  isForcedPosition: false,
  onResize: jest.fn(),
  onToggle: jest.fn(),
  onPreferencesChange: jest.fn(),
  reportHeaderHeight: jest.fn(),
  setSplitPanelToggle: jest.fn(),
  refs: {
    preferences: { current: null },
    slider: { current: null },
    toggle: { current: null },
  },
};

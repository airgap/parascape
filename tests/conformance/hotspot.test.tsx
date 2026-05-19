// AUTO-ADAPTED from cloudscape-design/components src/hotspot/__tests__/
// hotspot.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../../../lib/components/annotation-context/context; interaction (manual-triage tier).
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

const { HotspotContext: HotspotContextType,
  hotspotContext: HotspotContext, } = __STUB; // stub: ../../../lib/components/annotation-context/context
import Hotspot from '@components/Hotspot.pui';

function getContext(props?: Partial<HotspotContextType>): HotspotContextType {
  return {
    registerHotspot: jest.fn(),
    unregisterHotspot: jest.fn(),
    currentStepIndex: 0,
    currentTutorial: null,
    onStartTutorial: jest.fn(),
    onExitTutorial: jest.fn(),
    getContentForId: jest.fn(),
    ...props,
  };
}

test('registers and unregisters at the correct times', () => {
  const context = getContext();

  const { unmount } = render(
    <HotspotContext.Provider value={context}>
      <Hotspot hotspotId="a-random-id" />
    </HotspotContext.Provider>
  );

  expect(context.registerHotspot).toHaveBeenCalledTimes(1);
  expect(context.unregisterHotspot).not.toHaveBeenCalled();

  unmount();

  expect(context.registerHotspot).toHaveBeenCalledTimes(1);
  expect(context.unregisterHotspot).toHaveBeenCalledTimes(1);
});

test('renders content from the context', () => {
  const context = getContext({
    getContentForId: jest.fn(() => <div className="test-content"></div>),
  });

  const { container } = render(
    <HotspotContext.Provider value={context}>
      <Hotspot hotspotId="a-random-id" />
    </HotspotContext.Provider>
  );

  expect(container.getElementsByClassName('test-content')[0]).toBeInTheDocument();
});

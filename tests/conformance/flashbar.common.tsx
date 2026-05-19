// AUTO-ADAPTED from cloudscape-design/components src/flashbar/__tests__/
// flashbar.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../interfaces.
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

import Button from '@components/Button.pui';
import Flashbar from '@components/Flashbar.pui';
import { createWrapper, FlashbarWrapper } from '@conformance/adapter';
const { FlashbarProps } = __STUB; // stub: ../interfaces

export function createFlashbarWrapper(element: React.ReactElement) {
  return createWrapper(render(element).container).findFlashbar()!;
}

export function findList(flashbar: FlashbarWrapper) {
  return flashbar.find('ul');
}

export function testFlashDismissal({ stackItems }: { stackItems: boolean }) {
  const App = () => {
    const [items, setItems] = useState<ReadonlyArray<FlashbarProps.MessageDefinition>>([]);
    const onDismiss = () => setItems([]);
    const onAdd = () => setItems([{ content: 'The content', id: '1', dismissible: true, onDismiss }]);
    return (
      <>
        <Button onClick={onAdd}>Add an item</Button>
        <Flashbar stackItems={stackItems} items={items} />
      </>
    );
  };
  const appWrapper = createWrapper(render(<App />).container);
  expect(appWrapper.findFlashbar()!.findItems()).toHaveLength(0);
  appWrapper.findButton()!.click();
  const foundItems = appWrapper.findFlashbar()!.findItems();
  expect(foundItems).toHaveLength(1);
  foundItems![0]!.findDismissButton()!.click();
  expect(appWrapper.findFlashbar()!.findItems()).toHaveLength(0);
}

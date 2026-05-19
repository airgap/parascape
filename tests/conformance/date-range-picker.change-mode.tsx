// AUTO-ADAPTED from cloudscape-design/components src/date-range-picker/__tests__/
// date-range-picker.test.tsx via tests/conformance/codemod.mjs.
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
import { act } from '@conformance/adapter';

import { DateRangePickerWrapper } from '@conformance/adapter';

export function changeMode(wrapper: DateRangePickerWrapper, mode: 'relative' | 'absolute') {
  const select = wrapper.findDropdown()!.findSelectionModeSwitch().findModesAsSelect();

  act(() => select.openDropdown());
  act(() => select.selectOption(mode === 'absolute' ? 2 : 1));
}

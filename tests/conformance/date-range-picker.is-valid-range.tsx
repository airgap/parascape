// AUTO-ADAPTED from cloudscape-design/components src/date-range-picker/__tests__/
// date-range-picker.test.tsx via tests/conformance/codemod.mjs.
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
const { DateRangePickerProps } = __STUB; // stub: ../interfaces

export const isValidRange: DateRangePickerProps.ValidationFunction = (range: DateRangePickerProps.Value | null) => {
  if (range === null) {
    return {
      valid: false,
      errorMessage: 'No range selected',
    };
  }

  if (range.type === 'relative' && isNaN(range.amount)) {
    return {
      valid: false,
      errorMessage: 'Duration missing',
    };
  }

  if (range.type === 'absolute') {
    const [startDateWithoutTime] = range.startDate.split('T');
    const [endDateWithoutTime] = range.endDate.split('T');

    if (!startDateWithoutTime) {
      return {
        valid: false,
        errorMessage: 'Start date missing',
      };
    }

    if (!endDateWithoutTime) {
      return {
        valid: false,
        errorMessage: 'End date missing',
      };
    }
  }
  return { valid: true };
};

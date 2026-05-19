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

export const i18nStrings: DateRangePickerProps.I18nStrings = {
  todayAriaLabel: 'TEST TODAY',
  currentMonthAriaLabel: 'TEST THIS MONTH',
  nextMonthAriaLabel: 'TEST NEXT MONTH',
  nextYearAriaLabel: 'TEST NEXT YEAR',
  previousMonthAriaLabel: 'TEST PREVIOUS MONTH',
  previousYearAriaLabel: 'TEST PREVIOUS YEAR',
  customRelativeRangeDurationLabel: 'Duration',
  customRelativeRangeDurationPlaceholder: 'Enter duration',
  customRelativeRangeOptionLabel: 'Custom range',
  customRelativeRangeOptionDescription: 'Set a custom range in the past',
  customRelativeRangeUnitLabel: 'Unit of time',
  formatRelativeRange: range => `${range.unit}${range.amount}`,
  formatUnit: (unit, value) => (value === 1 ? unit : `${unit}s`),
  dateConstraintText: '(fallback) For date, use YYYY-MM-DD.',
  dateTimeConstraintText: '(fallback) For date, use YYYY-MM-DD. For time, use 24 hour format.',
  monthConstraintText: '(fallback) For month, use YYYY-MM.',
  modeSelectionLabel: 'Date range mode',
  relativeModeTitle: 'Relative range',
  absoluteModeTitle: 'Absolute range',
  relativeRangeSelectionHeading: 'Choose a range',
  startMonthLabel: 'Start month',
  startDateLabel: 'Start date',
  endMonthLabel: 'End month',
  endDateLabel: 'End date',
  startTimeLabel: 'Start time',
  endTimeLabel: 'End time',
  clearButtonLabel: 'Clear and dismiss',
  cancelButtonLabel: 'Cancel',
  applyButtonLabel: 'Apply',
  renderSelectedAbsoluteRangeAriaLive: () => `Range selected from A to B`,
};

export const i18nStringsWithExtraFormatConstraints: DateRangePickerProps.I18nStrings = {
  ...i18nStrings,
  slashedDateConstraintText: 'For date, use YYYY/MM/DD.',
  slashedDateTimeConstraintText: 'For date, use YYYY/MM/DD. For time, use 24 hour format.',
  isoDateConstraintText: 'For date, use YYYY-MM-DD.',
  isoDateTimeConstraintText: 'For date, use YYYY-MM-DD. For time, use 24 hour format.',
  slashedMonthConstraintText: 'For month, use YYYY/MM.',
  isoMonthConstraintText: 'For month, use YYYY-MM.',
};

function createI18nMessages(i18nStrings: DateRangePickerProps.I18nStrings) {
  return Object.entries(i18nStrings).reduce(
    (acc, [key, value]) => {
      if (typeof value === 'string') {
        acc['date-range-picker'][`i18nStrings.${key}`] = `(i18n) ${value}`;
      }
      return acc;
    },
    { 'date-range-picker': {} } as Record<string, Record<string, string>>
  );
}

export const i18nMessages = createI18nMessages(i18nStrings);

export const i18nMessagesWithExtraFormatConstraints = createI18nMessages(i18nStringsWithExtraFormatConstraints);

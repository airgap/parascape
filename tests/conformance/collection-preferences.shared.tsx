// AUTO-ADAPTED from cloudscape-design/components src/collection-preferences/__tests__/
// collection-preferences.test.tsx via tests/conformance/codemod.mjs.
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

import CollectionPreferences from '@components/CollectionPreferences.pui';
const TestI18nProvider = (({ children }: any) => children) as any;
import { createWrapper } from '@conformance/adapter';
import { CollectionPreferencesWrapper } from '@conformance/adapter';

const i18nMessages = {
  'collection-preferences': {
    'contentDisplayPreference.i18nStrings.columnFilteringPlaceholder': 'Filter columns',
    'contentDisplayPreference.i18nStrings.columnFilteringAriaLabel': 'Filter columns',
    'contentDisplayPreference.i18nStrings.columnFilteringNoMatchText': 'No matches found',
    'contentDisplayPreference.i18nStrings.columnFilteringClearFilterText': 'Clear filter',
    'contentDisplayPreference.i18nStrings.columnFilteringCountText':
      '{count, select, zero {0 matches} one {1 match} other {{count} matches}}',
    'contentDisplayPreference.dragHandleAriaLabel': 'Drag handle',
    'contentDisplayPreference.dragHandleAriaDescription':
      "Use Space or Enter to activate drag for an item, then use the arrow keys to move the item's position. To complete the position move, use Space or Enter, or to discard the move, use Escape.",
    'contentDisplayPreference.liveAnnouncementDndStarted': 'Picked up item at position {position} of {total}',
    'contentDisplayPreference.liveAnnouncementDndDiscarded': 'Reordering canceled',
    'contentDisplayPreference.liveAnnouncementDndItemReordered':
      '{isInitialPosition, select, true {Moving item back to position {currentPosition} of {total}} false {Moving item to position {currentPosition} of {total}} other {}}',
    'contentDisplayPreference.liveAnnouncementDndItemCommitted':
      '{isInitialPosition, select, true {Item moved back to its original position {initialPosition} of {total}} false {Item moved from position {initialPosition} to position {finalPosition} of {total}} other {}}',
  },
};

export function renderCollectionPreferences(
  props: Partial<any>,
  withI18nProvider = false
): CollectionPreferencesWrapper {
  let contentToRender = (
    <CollectionPreferences title="Preferences title" confirmLabel="Confirm" cancelLabel="Cancel" {...props} />
  );

  if (withI18nProvider) {
    contentToRender = <TestI18nProvider messages={i18nMessages}>{contentToRender}</TestI18nProvider>;
  }

  render(contentToRender);
  return createWrapper().findCollectionPreferences()!;
}

export const visibleContentPreference: any.VisibleContentPreference = {
  title: 'Content selection title',
  options: [
    {
      label: 'Group label one',
      options: [
        { id: 'id', label: 'Distribution ID', editable: false },
        { id: 'domainName', label: 'Domain name' },
      ],
    },
    {
      label: 'Group label two',
      options: [
        { id: 'priceClass', label: 'Price class' },
        { id: 'origin', label: 'Origin' },
        { id: 'status', label: 'Status' },
        { id: 'state', label: 'State' },
        { id: 'logging', label: 'Logging' },
      ],
    },
  ],
};

export const pageSizePreference: any.PageSizePreference = {
  title: 'Select page size',
  options: [
    { value: 10, label: '10 items' },
    { value: 20, label: '20 items' },
    { value: 50, label: '50 items' },
  ],
};

export const wrapLinesPreference: any.WrapLinesPreference = {
  label: 'Wrap lines label',
  description: 'Wrap lines description',
};

export const stripedRowsPreference: any.StripedRowsPreference = {
  label: 'Striped rows label',
  description: 'Striped rows description',
};

export const contentDensityPreference: any.ContentDensityPreference = {
  label: 'Compact mode',
  description: 'Display the content in a denser, more compact mode',
};

export const stickyColumnsPreference: any.StickyColumnsPreference = {
  firstColumns: {
    title: 'Stick first column(s)',
    description: 'Keep the first column(s) visible while horizontally scrolling table content.',
    options: [
      { label: 'None', value: 0 },
      { label: 'First column', value: 1 },
      { label: 'First two columns', value: 2 },
    ],
  },
  lastColumns: {
    title: 'Stick last column',
    description: 'Keep the last column visible while horizontally scrolling table content.',
    options: [
      { label: 'None', value: 0 },
      { label: 'Last column', value: 1 },
    ],
  },
};

export const contentDisplayPreference: any.ContentDisplayPreference = {
  title: 'Content display title',
  description: 'Content display description',
  options: [
    { id: 'id1', label: 'Item 1', alwaysVisible: true },
    { id: 'id2', label: 'Item 2' },
    { id: 'id3', label: 'Item 3' },
    { id: 'id4', label: 'Item 4' },
  ],
  enableColumnFiltering: true,
};

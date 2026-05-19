// AUTO-ADAPTED from cloudscape-design/components src/tag-editor/__tests__/
// tag-editor.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../../../lib/components/tag-editor.
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
const { TagEditorProps } = __STUB; // stub: ../../../lib/components/tag-editor

export const MAX_KEY_LENGTH = 128;
export const MAX_VALUE_LENGTH = 256;

export const i18nStrings: Required<TagEditorProps.I18nStrings> = {
  keyPlaceholder: 'Enter key',
  valuePlaceholder: 'Enter value',
  addButton: 'Add new tag',
  removeButton: 'Remove',
  undoButton: 'Undo',
  undoPrompt: 'This tag will be removed upon saving changes',
  loading: 'Loading tags that are associated with this resource',
  keyHeader: 'Key',
  valueHeader: 'Value',
  optional: 'optional',
  keySuggestion: 'Custom tag key',
  valueSuggestion: 'Custom tag value',
  emptyTags: 'No tags associated with the resource.',
  errorIconAriaLabel: 'Error',
  tooManyKeysSuggestion: 'Unable to display the long list of keys available for this account',
  tooManyValuesSuggestion: 'This tag has too many values to display',
  keysSuggestionLoading: 'Loading key values',
  keysSuggestionError: 'Error loading items',
  valuesSuggestionLoading: 'Loading tag values',
  valuesSuggestionError: 'Error loading items',
  emptyKeyError: 'You must specify a tag key',
  maxKeyCharLengthError: 'The maximum number of characters you can use in a tag key is 128.',
  maxValueCharLengthError: 'The maximum number of characters you can use in a tag value is 256.',
  duplicateKeyError: 'You must specify a unique tag key.',
  invalidKeyError:
    'Invalid key. Keys can only contain alphanumeric characters, spaces and any of the following: _.:/=+@-',
  invalidValueError:
    'Invalid value. Values can only contain alphanumeric characters, spaces and any of the following: _.:/=+@-',
  awsPrefixError: 'Cannot start with aws:',
  clearAriaLabel: 'Clear',
  tagLimit: availableTags => `You can add ${availableTags} more tag(s).`,
  tagLimitReached: tagLimit => `You have reached the limit of ${tagLimit} tag(s).`,
  tagLimitExceeded: tagLimit => `You have exceeded the limit of ${tagLimit} tag(s).`,
  enteredKeyLabel: (text: string) => `Use ${text}`,
  enteredValueLabel: (text: string) => `Use ${text}`,
  itemRemovedAriaLive: 'An item was removed.',
  removeButtonAriaLabel: tag => `Remove ${tag.key}`,
};

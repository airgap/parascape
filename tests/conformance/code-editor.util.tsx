// AUTO-ADAPTED from cloudscape-design/components src/code-editor/__tests__/
// code-editor.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ./common; interaction (manual-triage tier).
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

import CodeEditor from '@components/CodeEditor.pui';
import { createWrapper } from '@conformance/adapter';
const { i18nStrings } = __STUB; // stub: ./common

export let annotationCallback: (event?: any) => void;

const textInput = { setAttribute: jest.fn() };

export const editorMock = {
  getValue: jest.fn(),
  setValue: jest.fn(),
  setTheme: jest.fn(),
  container: { focus: jest.fn() },
  textInput: {
    getElement: jest.fn(() => textInput),
  },
  renderer: {
    textarea: document.createElement('textarea'),
  },
  focus: jest.fn(),
  session: {
    setMode: jest.fn(),
    setUseWrapMode: jest.fn(),
    selection: {
      on: jest.fn(),
      fromJSON: jest.fn(),
      toJSON: jest.fn(),
    },
    on: jest.fn((name: string, _callback: (event?: any) => void) => {
      switch (name) {
        case 'changeAnnotation':
          annotationCallback = _callback;
          break;
      }
    }),
    getAnnotations: jest.fn(),
    setAnnotations: jest.fn(),
    clearAnnotations: jest.fn(),
  },
  getOption: jest.fn(),
  setOption: jest.fn(),
  setOptions: jest.fn(),
  setAutoScrollEditorIntoView: jest.fn(),
  setHighlightActiveLine: jest.fn(),
  commands: {
    addCommand: jest.fn(),
    removeCommand: jest.fn(),
  },
  on: jest.fn(),
  off: jest.fn(),
  gotoLine: jest.fn(),
  removeAllListeners: jest.fn(),
  destroy: jest.fn(),
  resize: jest.fn(),
};

export const aceMock = {
  get version() {
    return '1.0.0';
  },
  edit: jest.fn(() => editorMock),
  config: {
    loadModule: jest.fn(),
  },
};

export const defaultProps: any = {
  ace: aceMock,
  value: 'const pi = 3.14;',
  language: 'javascript',
  onChange: jest.fn(),
  onValidate: jest.fn(),
  onPreferencesChange: jest.fn(),
  onRecoveryClick: jest.fn(),
  preferences: undefined,
  loading: false,
  i18nStrings,
};

export function renderCodeEditor(props: Partial<any> = {}, ref?: React.Ref<any.Ref>) {
  const renderProps = { ...defaultProps, ...props };
  const { container, rerender, unmount } = render(<CodeEditor ref={ref} {...renderProps} />);
  return {
    wrapper: createWrapper(container).findCodeEditor()!,
    rerender,
    unmount,
  };
}

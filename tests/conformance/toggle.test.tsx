// AUTO-ADAPTED from cloudscape-design/components src/toggle/__tests__/
// toggle.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../../checkbox/__tests__/common-tests; stubbed unresolvable ../../internal/generated/custom-css-properties; stubbed unresolvable ../../../lib/components/internal/components/abstract-switch/styles.css.js; interaction (manual-triage tier).
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
import { act, render } from '@conformance/adapter';

import '../../__a11y__/to-validate-a11y';
import FormField from '@components/FormField.pui';
import { createWrapper, ToggleWrapper } from '@conformance/adapter';
import Toggle from '@components/Toggle.pui';
const { createCommonTests } = __STUB; // stub: ../../checkbox/__tests__/common-tests
const customCssProps = __STUB; // stub: ../../internal/generated/custom-css-properties

const abstractSwitchStyles = __STUB; // stub: ../../../lib/components/internal/components/abstract-switch/styles.css.js
import styles from '@cloudscape/toggle.styles.js';

function renderToggle(jsx: React.ReactElement) {
  const { container, rerender } = render(jsx);
  const wrapper = createWrapper(container).findToggle()!;
  return { wrapper, rerender };
}

function findStyledElement(wrapper: ToggleWrapper) {
  return wrapper.findByClassName(styles['toggle-handle'])!.getElement();
}

createCommonTests(Toggle);

test('renders an input element', () => {
  const { wrapper } = renderToggle(<Toggle checked={false} />);
  const nativeInput = wrapper.findNativeInput().getElement();
  expect(nativeInput.type).toEqual('checkbox');
});

test('synchronizes native and styled controls', () => {
  const { wrapper, rerender } = renderToggle(<Toggle checked={false} />);
  const nativeInput = wrapper.findNativeInput().getElement();
  expect(nativeInput.checked).toEqual(false);
  expect(findStyledElement(wrapper)).not.toHaveClass(styles['toggle-handle-checked']);
  rerender(<Toggle checked={true} />);
  expect(nativeInput.checked).toEqual(true);
  expect(findStyledElement(wrapper)).toHaveClass(styles['toggle-handle-checked']);
});

test('fires a single onChange event on label click', () => {
  const onChange = jest.fn();
  const { wrapper } = renderToggle(<Toggle checked={false} onChange={onChange} />);
  wrapper.findLabel().click();
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { checked: true } }));
});

test('fires a single onChange event on input click', () => {
  const onChange = jest.fn();
  const { wrapper } = renderToggle(<Toggle checked={false} onChange={onChange} />);
  wrapper.findNativeInput().click();
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { checked: true } }));
});

test('works in controlled component pattern', () => {
  function StateWrapper() {
    const [checked, setChecked] = useState(false);
    return <Toggle checked={checked} onChange={event => setChecked(event.detail.checked)} />;
  }
  const { wrapper } = renderToggle(<StateWrapper />);
  expect(wrapper.findNativeInput().getElement()).not.toBeChecked();

  wrapper.findLabel().click();
  expect(wrapper.findNativeInput().getElement()).toBeChecked();

  wrapper.findLabel().click();
  expect(wrapper.findNativeInput().getElement()).not.toBeChecked();
});

test('does not trigger change handler if disabled', () => {
  const onChange = jest.fn();
  const { wrapper } = renderToggle(<Toggle checked={false} disabled={true} onChange={onChange} />);

  act(() => wrapper.findLabel().click());

  expect(wrapper.findNativeInput().getElement()).not.toBeChecked();
  expect(onChange).not.toHaveBeenCalled();
});

test('does not trigger change handler if readOnly', () => {
  const onChange = jest.fn();
  const { wrapper } = renderToggle(<Toggle checked={false} readOnly={true} onChange={onChange} />);

  act(() => wrapper.findLabel().click());

  expect(wrapper.findNativeInput().getElement()).not.toBeChecked();
  expect(onChange).not.toHaveBeenCalled();
});

test('can receive focus if readOnly', () => {
  let toggleRef: any.Ref | null = null;

  const { wrapper } = renderToggle(<Toggle ref={ref => (toggleRef = ref)} checked={false} readOnly={true} />);
  expect(toggleRef).toBeDefined();

  toggleRef!.focus();
  expect(wrapper.findNativeInput().getElement()).toHaveFocus();
});

test('should set aria-disabled to native input for readOnly state', () => {
  const { wrapper } = renderToggle(<Toggle checked={false} readOnly={true} />);

  expect(wrapper.findNativeInput().getElement()).toHaveAttribute('aria-disabled', 'true');
});

test('should not set aria-disabled to native input when both readOnly and disabled are true', () => {
  const { wrapper } = renderToggle(<Toggle checked={false} readOnly={true} disabled={true} />);

  expect(wrapper.findNativeInput().getElement()).toHaveAttribute('disabled');
  expect(wrapper.findNativeInput().getElement()).not.toHaveAttribute('aria-disabled', 'true');
});

test('can be focused via API', () => {
  const onFocus = jest.fn();
  let toggleRef: any.Ref | null = null;

  const { wrapper } = renderToggle(<Toggle ref={ref => (toggleRef = ref)} checked={false} onFocus={onFocus} />);
  expect(toggleRef).toBeDefined();

  toggleRef!.focus();
  expect(onFocus).toHaveBeenCalled();
  expect(wrapper.findNativeInput().getElement()).toHaveFocus();
});

test('does not trigger any change events when value is changed through api', () => {
  const onChange = jest.fn();
  const { wrapper, rerender } = renderToggle(<Toggle checked={false} onChange={onChange} />);
  expect(wrapper.findNativeInput().getElement()).not.toBeChecked();

  rerender(<Toggle checked={true} onChange={onChange} />);
  expect(wrapper.findNativeInput().getElement()).toBeChecked();

  rerender(<Toggle checked={false} onChange={onChange} />);
  expect(onChange).not.toHaveBeenCalled();
});

test('check a11y', async () => {
  const { wrapper } = renderToggle(
    <Toggle checked={false} onChange={() => {}}>
      Toggle label
    </Toggle>
  );
  await expect(wrapper.getElement()).toValidateA11y();
});

test('Should set aria-describedby and aria-labelledby from Formfield', () => {
  const { container } = render(
    <FormField description="This is a formfield description." label="Form field label">
      <Toggle checked={false} description="This is description">
        Toggle label
      </Toggle>
    </FormField>
  );
  const formFieldWrapper = createWrapper(container).findFormField();
  const toggleWrapper = createWrapper(container).findToggle()!;
  const toggleInputAriaDescribedby = toggleWrapper.findNativeInput().getElement().getAttribute('aria-describedby');
  const toggleInputAriaLabelledby = toggleWrapper.findNativeInput().getElement().getAttribute('aria-labelledby');

  const formFieldLabelId = formFieldWrapper?.findLabel()?.getElement().id;
  const formFieldDescriptionId = formFieldWrapper?.findDescription()?.getElement().id;
  const toggleLabelId = container?.querySelector(`.${abstractSwitchStyles.label}`)?.id;
  const toggleDescriptionId = container?.querySelector(`.${abstractSwitchStyles.description}`)?.id;

  expect(toggleInputAriaLabelledby).toBe(toggleLabelId + ' ' + formFieldLabelId);
  expect(toggleInputAriaDescribedby).toBe(formFieldDescriptionId + ' ' + toggleDescriptionId);
});

test('Should set aria-describedby and aria-labelledby from ariaLabelledby and ariaDescribedby', () => {
  const { container } = render(
    <FormField description="This is a description." label="Form field label">
      <div id="label-id">it is label</div>
      <div id="description-id">it is label</div>
      <Toggle
        checked={false}
        description="This is description"
        ariaLabelledby="label-id"
        ariaDescribedby="description-id"
      >
        Toggle label
      </Toggle>
    </FormField>
  );
  const toggleWrapper = createWrapper(container).findToggle()!;
  const toggleInputAriaDescribedby = toggleWrapper.findNativeInput().getElement().getAttribute('aria-describedby');
  const toggleInputAriaLabelledby = toggleWrapper.findNativeInput().getElement().getAttribute('aria-labelledby');

  const toggleLabelId = container?.querySelector(`.${abstractSwitchStyles.label}`)?.id;
  const toggleDescriptionId = container?.querySelector(`.${abstractSwitchStyles.description}`)?.id;

  expect(toggleInputAriaDescribedby).toBe('description-id' + ' ' + toggleDescriptionId);
  expect(toggleInputAriaLabelledby).toBe(toggleLabelId + ' ' + 'label-id');
});

test('all style api properties', () => {
  const { wrapper } = renderToggle(
    <Toggle
      checked={true}
      style={{
        input: {
          background: { checked: 'green' },
          handle: {
            background: { checked: 'blue' },
          },
          focusRing: {
            borderColor: 'magenta',
            borderRadius: '10px',
            borderWidth: '5px',
          },
        },
        label: {
          color: { checked: 'orange' },
        },
      }}
    >
      Toggle
    </Toggle>
  );

  const toggleControl = wrapper.findByClassName(styles['toggle-control'])!.getElement();
  const toggleHandle = wrapper.findByClassName(styles['toggle-handle'])!.getElement();
  const toggleLabel = wrapper.findByClassName(abstractSwitchStyles.label)!.getElement();

  expect(getComputedStyle(toggleControl).getPropertyValue('background-color')).toBe('green');
  expect(getComputedStyle(toggleControl).getPropertyValue(customCssProps.styleFocusRingBorderColor)).toBe('magenta');
  expect(getComputedStyle(toggleControl).getPropertyValue(customCssProps.styleFocusRingBorderRadius)).toBe('10px');
  expect(getComputedStyle(toggleControl).getPropertyValue(customCssProps.styleFocusRingBorderWidth)).toBe('5px');
  expect(getComputedStyle(toggleHandle).getPropertyValue('background-color')).toBe('blue');
  expect(getComputedStyle(toggleLabel).getPropertyValue('color')).toBe('orange');
});

describe('native attributes', () => {
  it('adds native attributes', () => {
    const { container } = render(<Toggle checked={true} nativeInputAttributes={{ 'data-testid': 'my-test-id' }} />);
    expect(container.querySelectorAll('[data-testid="my-test-id"]')).toHaveLength(1);
    expect(container.querySelectorAll('input[data-testid="my-test-id"]')).toHaveLength(1);
  });
  it('concatenates class names', () => {
    const { container } = render(<Toggle checked={true} nativeInputAttributes={{ className: 'additional-class' }} />);
    const input = container.querySelector('input');
    expect(input).toHaveClass(abstractSwitchStyles['native-input']);
    expect(input).toHaveClass('additional-class');
  });
});

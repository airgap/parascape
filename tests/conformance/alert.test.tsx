// AUTO-ADAPTED from cloudscape-design/components src/alert/__tests__/
// alert.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, i18n/testing → passthrough provider; jest.mock → hoisted vi.mock; stubbed unresolvable ../../../lib/components/internal/analytics/selectors; stubbed unresolvable ../../../lib/components/internal/hooks/use-visual-mode; stubbed unresolvable ../../internal/generated/custom-css-properties; interaction (manual-triage tier).
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
import { fireEvent, render } from '@conformance/adapter';

import '../../__a11y__/to-validate-a11y';
import Alert from '@components/Alert.pui';
import Button from '@components/Button.pui';
const TestI18nProvider = (({ children }: any) => children) as any;
const { DATA_ATTR_ANALYTICS_ALERT } = __STUB; // stub: ../../../lib/components/internal/analytics/selectors
const { useVisualRefresh } = __STUB; // stub: ../../../lib/components/internal/hooks/use-visual-mode
import { createWrapper } from '@conformance/adapter';
const customCssProps = __STUB; // stub: ../../internal/generated/custom-css-properties

import styles from '@cloudscape/alert.styles.js';

vi.mock('../../../lib/components/internal/hooks/use-visual-mode', async (importOriginal) => ({
  ...(await importOriginal()),
  useVisualRefresh: jest.fn().mockReturnValue(false),
}));

function renderAlert(props: any = {}) {
  const { container } = render(<Alert {...props} />);
  return { wrapper: createWrapper(container).findAlert()!, container };
}

const i18nStrings: any.I18nStrings = {
  successIconAriaLabel: 'status: success',
  infoIconAriaLabel: 'status: info',
  warningIconAriaLabel: 'status: warning',
  errorIconAriaLabel: 'status: error',
  dismissAriaLabel: 'dismiss',
};

beforeEach(() => {
  jest.mocked(useVisualRefresh).mockReset();
});

describe('Alert Component', () => {
  describe('structure', () => {
    it('has no header container when no header is set', () => {
      const { wrapper } = renderAlert();
      expect(wrapper.findHeader()).toBeNull();
    });
    it('displays header - string', () => {
      const { wrapper } = renderAlert({ header: 'Hello' });
      expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Hello');
    });
    it('displays header - custom html', () => {
      const header = <b>Title</b>;
      const { wrapper } = renderAlert({ header });
      expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Title');
    });
    it('displays body', () => {
      const content = <b>Some text</b>;
      const { wrapper } = renderAlert({ children: content });
      expect(wrapper.findContent().getElement()).toHaveTextContent('Some text');
    });
    it('shows a dismiss icon', () => {
      const { wrapper } = renderAlert({ dismissible: true });
      expect(wrapper.findDismissButton()).not.toBe(null);
    });
    it("doesn't show a dismiss icon when dissmisible is not set", () => {
      const { wrapper } = renderAlert();
      expect(wrapper.findDismissButton()).toBe(null);
    });
    it('shows an action button', () => {
      const { wrapper } = renderAlert({ buttonText: 'Button text' });
      expect(wrapper.findActionButton()).not.toBe(null);
    });
    it("doesn't show an action button when buttonText is not set", () => {
      const { wrapper } = renderAlert();
      expect(wrapper.findActionButton()).toBe(null);
    });
    it('correct button text', () => {
      const { wrapper } = renderAlert({ buttonText: 'Button text' });
      expect(wrapper.findActionButton()!.findTextRegion()!.getElement()).toHaveTextContent('Button text');
    });
    it('dismiss button has no default label', () => {
      const { wrapper } = renderAlert({ dismissible: true });
      expect(wrapper.findDismissButton()!.getElement()).not.toHaveAttribute('aria-label');
    });
    it('dismiss button can have specified label', () => {
      const { wrapper } = renderAlert({ dismissible: true, i18nStrings });
      expect(wrapper.findDismissButton()!.getElement()).toHaveAttribute('aria-label', 'dismiss');
    });
    it('status icon does not have a label by default', () => {
      const { wrapper } = renderAlert({});
      expect(wrapper.find('[role="img"]')).toBeNull();
    });
    it('status icon can have a label', () => {
      const { wrapper } = renderAlert({ i18nStrings });
      expect(wrapper.find('[role="img"]')!.getElement()).toHaveAttribute('aria-label', 'status: info');
    });
  });
  describe('visibility', () => {
    it('shows the alert by default', () => {
      const { wrapper } = renderAlert();
      expect(wrapper.getElement()).toBeVisible();
    });
    it('hides the alert when visible is false', () => {
      const { wrapper } = renderAlert({ visible: false });
      expect(wrapper.getElement()).toHaveClass(styles.hidden);
    });
    it('shows the alert when visible is true', () => {
      const { wrapper } = renderAlert({ visible: true });
      expect(wrapper.getElement()).toBeVisible();
    });
    it('displays correct type', () => {
      (['error', 'warning', 'info', 'success'] as any.Type[]).forEach(alertType => {
        const { wrapper } = renderAlert({ type: alertType });
        expect(wrapper.findRootElement().getElement()).toHaveClass(styles[`type-${alertType}`]);
      });
    });
  });

  describe('functionality', () => {
    it('action button callback gets called', () => {
      const onButtonClickSpy = jest.fn();
      const { wrapper } = renderAlert({ buttonText: 'Button', onButtonClick: onButtonClickSpy });
      wrapper.findActionButton()!.click();
      expect(onButtonClickSpy).toHaveBeenCalled();
    });
    it('fires dismiss callback', () => {
      const onDismissSpy = jest.fn();
      const { wrapper } = renderAlert({ dismissible: true, onDismiss: onDismissSpy });
      wrapper.findDismissButton()!.click();
      expect(onDismissSpy).toHaveBeenCalled();
    });
    it('can be focused through the API', () => {
      let ref: any.Ref | null = null;
      render(<Alert header="Important" ref={element => (ref = element)} />);
      ref!.focus();
      expect(document.activeElement).toHaveClass(styles['alert-focus-wrapper']);
    });
    it('manages tabindex dynamically when focused programmatically', () => {
      let ref: any.Ref | null = null;
      const { container } = render(
        <Alert header="Important" ref={(element: any.Ref | null) => (ref = element)} />
      );
      const wrapper = createWrapper(container).findAlert()!;

      const focusWrapper = wrapper.findByClassName(styles['alert-focus-wrapper'])!;

      // Initially no tabindex
      expect(focusWrapper.getElement()).not.toHaveAttribute('tabindex');

      // Focus programmatically - should add tabindex
      ref!.focus();
      expect(focusWrapper.getElement()).toHaveAttribute('tabindex', '-1');
      expect(document.activeElement).toBe(focusWrapper.getElement());

      // Blur should remove tabindex
      fireEvent.blur(focusWrapper.getElement());
      expect(focusWrapper.getElement()).not.toHaveAttribute('tabindex');
    });
  });

  it('renders `action` content', () => {
    const { wrapper } = renderAlert({ children: 'Message body', action: <Button>Click</Button> });
    expect(wrapper.findActionSlot()!.findButton()!.getElement()).toHaveTextContent('Click');
  });

  it('when both `buttonText` and `action` provided, prefers the latter', () => {
    const { wrapper } = renderAlert({
      children: 'Message body',
      buttonText: 'buttonText',
      action: <Button>Action</Button>,
    });

    expect(wrapper.findActionButton()).toBeNull();
    expect(wrapper.findActionSlot()!.findButton()!.getElement()).toHaveTextContent('Action');
  });

  test('a11y', async () => {
    const { container } = renderAlert({
      dismissible: true,
      header: 'Header',
      i18nStrings,
      action: <button type="button">Action</button>,
    });
    await expect(container).toValidateA11y();
  });

  describe('a11y', () => {
    it('has role group on the element referenced by the focus ref', () => {
      let ref: any.Ref | null = null;
      render(<Alert header="Important" ref={element => (ref = element)} />);
      ref!.focus();
      expect(document.activeElement).toHaveAttribute('role', 'group');
    });
  });

  describe('analytics', () => {
    test(`adds ${DATA_ATTR_ANALYTICS_ALERT} attribute with the alert type`, () => {
      const { container } = renderAlert({
        type: 'success',
        children: 'Message body',
      });

      const wrapper = createWrapper(container).findAlert()!;
      expect(wrapper.getElement()).toHaveAttribute(DATA_ATTR_ANALYTICS_ALERT, 'success');
    });
  });

  describe('icon size', () => {
    test('classic - big if has header and content', () => {
      const { wrapper } = renderAlert({ header: 'Header', children: ['Content'] });
      expect(wrapper.findByClassName(styles['icon-size-normal'])).toBeFalsy();
      expect(wrapper.findByClassName(styles['icon-size-big'])).toBeTruthy();
    });
    test('classic - normal if only header', () => {
      const { wrapper } = renderAlert({ header: 'Header' });
      expect(wrapper.findByClassName(styles['icon-size-big'])).toBeFalsy();
      expect(wrapper.findByClassName(styles['icon-size-normal'])).toBeTruthy();
    });
    test('classic - normal if only content', () => {
      const { wrapper } = renderAlert({ children: ['Content'] });
      expect(wrapper.findByClassName(styles['icon-size-big'])).toBeFalsy();
      expect(wrapper.findByClassName(styles['icon-size-normal'])).toBeTruthy();
    });
    test('visual refresh - always normal', () => {
      jest.mocked(useVisualRefresh).mockReturnValue(true);
      const { wrapper } = renderAlert({ header: 'Header', children: ['Content'] });
      expect(wrapper.findByClassName(styles['icon-size-big'])).toBeFalsy();
      expect(wrapper.findByClassName(styles['icon-size-normal'])).toBeTruthy();
    });
  });

  describe('i18n', () => {
    const alertTypes: any.Type[] = ['info', 'success', 'error', 'warning'];
    const i18nMessages = {
      alert: {
        'i18nStrings.successIconAriaLabel': 'success default label',
        'i18nStrings.infoIconAriaLabel': 'info default label',
        'i18nStrings.warningIconAriaLabel': 'warning default label',
        'i18nStrings.errorIconAriaLabel': 'error default label',
        'i18nStrings.dismissAriaLabel': 'dismiss default label',
      },
    };

    function renderAlertForI18n(props: any = {}) {
      const { container } = render(
        <TestI18nProvider messages={i18nMessages}>
          <Alert {...props} />
        </TestI18nProvider>
      );
      const wrapper = createWrapper(container)!.findAlert()!;
      const statusIcon = wrapper.findByClassName(styles.icon)!.findIcon()!.getElement();
      const dismissButton = wrapper.findDismissButton()!.getElement();
      return { statusIcon, dismissButton };
    }

    describe.each(alertTypes)('alert type: %s', type => {
      it('assigns the specified aria labels via i18nStrings prop', () => {
        const { statusIcon, dismissButton } = renderAlertForI18n({ dismissible: true, type, i18nStrings });
        expect(statusIcon).toHaveAccessibleName(`status: ${type}`);
        expect(dismissButton).toHaveAccessibleName('dismiss');
      });

      it('assigns the labels from i18n provider, when not specified', () => {
        const { statusIcon, dismissButton } = renderAlertForI18n({ dismissible: true, type });
        expect(statusIcon).toHaveAccessibleName(`${type} default label`);
        expect(dismissButton).toHaveAccessibleName('dismiss default label');
      });
    });

    describe('deprecated aria labels', () => {
      it('ignores the deprecated values if i18nStrings is specified', () => {
        const { statusIcon, dismissButton } = renderAlertForI18n({
          dismissible: true,
          dismissAriaLabel: 'deprecated dismiss label',
          statusIconAriaLabel: 'deprecated status icon label',
          i18nStrings,
        });
        expect(statusIcon).toHaveAccessibleName('status: info');
        expect(dismissButton).toHaveAccessibleName('dismiss');
      });

      it('uses the deprecated values if i18nStrings is not specified', () => {
        const { statusIcon, dismissButton } = renderAlertForI18n({
          dismissible: true,
          dismissAriaLabel: 'deprecated dismiss label',
          statusIconAriaLabel: 'deprecated status icon label',
        });
        expect(statusIcon).toHaveAccessibleName('deprecated status icon label');
        expect(dismissButton).toHaveAccessibleName('deprecated dismiss label');
      });
    });
  });
});

describe('Style API', () => {
  test('custom properties', () => {
    const { wrapper } = renderAlert({
      dismissible: true,
      children: 'Alert',
      style: {
        root: {
          background: 'rgb(255, 255, 255)',
          borderColor: 'rgb(0, 0, 0)',
          borderRadius: '8px',
          borderWidth: '2px',
          color: 'rgb(0, 0, 0)',
          focusRing: {
            borderColor: 'rgb(23, 31, 118)',
            borderRadius: '6px',
            borderWidth: '4px',
          },
        },
        icon: {
          color: 'rgb(255, 0, 0)',
        },
        dismissButton: {
          color: {
            active: 'rgb(12, 136, 22)',
            default: 'rgb(189, 37, 40)',
            hover: 'rgb(119, 12, 12)',
          },
          focusRing: {
            borderColor: 'rgb(23, 31, 118)',
            borderRadius: '6px',
            borderWidth: '4px',
          },
        },
      },
    });

    expect(getComputedStyle(wrapper.findRootElement().getElement()).getPropertyValue('background')).toBe(
      'rgb(255, 255, 255)'
    );
    expect(getComputedStyle(wrapper.findRootElement().getElement()).getPropertyValue('border-color')).toBe(
      'rgb(0, 0, 0)'
    );
    expect(getComputedStyle(wrapper.findRootElement().getElement()).getPropertyValue('border-radius')).toBe('8px');
    expect(getComputedStyle(wrapper.findRootElement().getElement()).getPropertyValue('border-width')).toBe('2px');
    expect(getComputedStyle(wrapper.findRootElement().getElement()).getPropertyValue('color')).toBe('rgb(0, 0, 0)');
    expect(
      getComputedStyle(wrapper.findRootElement().getElement()).getPropertyValue(
        customCssProps.alertFocusRingBorderColor
      )
    ).toBe('rgb(23, 31, 118)');
    expect(
      getComputedStyle(wrapper.findRootElement().getElement()).getPropertyValue(
        customCssProps.alertFocusRingBorderRadius
      )
    ).toBe('6px');
    expect(
      getComputedStyle(wrapper.findRootElement().getElement()).getPropertyValue(
        customCssProps.alertFocusRingBorderWidth
      )
    ).toBe('4px');

    const dismissButton = wrapper.findDismissButton()!.getElement();
    expect(getComputedStyle(dismissButton).getPropertyValue(customCssProps.styleColorActive)).toBe('rgb(12, 136, 22)');
    expect(getComputedStyle(dismissButton).getPropertyValue(customCssProps.styleColorDefault)).toBe('rgb(189, 37, 40)');
    expect(getComputedStyle(dismissButton).getPropertyValue(customCssProps.styleColorHover)).toBe('rgb(119, 12, 12)');
    expect(getComputedStyle(dismissButton).getPropertyValue(customCssProps.styleFocusRingBorderColor)).toBe(
      'rgb(23, 31, 118)'
    );
    expect(getComputedStyle(dismissButton).getPropertyValue(customCssProps.styleFocusRingBorderRadius)).toBe('6px');
    expect(getComputedStyle(dismissButton).getPropertyValue(customCssProps.styleFocusRingBorderWidth)).toBe('4px');

    const iconElement = wrapper.findByClassName(styles.icon)!.getElement();
    expect(getComputedStyle(iconElement).getPropertyValue(customCssProps.alertIconColor)).toBe('rgb(255, 0, 0)');
  });
});

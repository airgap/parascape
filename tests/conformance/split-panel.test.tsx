// AUTO-ADAPTED from cloudscape-design/components src/split-panel/__tests__/
// split-panel.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, jest.mock → hoisted vi.mock; stubbed unresolvable ../../__tests__/utils; stubbed unresolvable ../../app-layout/__tests__/utils; interaction (manual-triage tier).
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

import { KeyCode } from '@cloudscape-design/test-utils-core/utils';

import SplitPanel from '@components/SplitPanel.pui';
import { createWrapper } from '@conformance/adapter';
const { testIf } = __STUB; // stub: ../../__tests__/utils
const { describeEachAppLayout } = __STUB; // stub: ../../app-layout/__tests__/utils
import { defaultProps, renderSplitPanel } from '@conformance/split-panel.common';
import { defaultSplitPanelContextProps } from '@conformance/split-panel.helpers';

import styles from '@cloudscape/split-panel.styles.js';
import tooltipStyles from '@cloudscape/tooltip.test-classes.js';

const onKeyDown = jest.fn();
vi.mock('../../../lib/components/app-layout/utils/use-keyboard-events', async (importOriginal) => ({
  useKeyboardEvents: () => ({ onKeyDown }),
}));

const onSliderPointerDown = jest.fn();
vi.mock('../../../lib/components/app-layout/utils/use-pointer-events', async (importOriginal) => ({
  usePointerEvents: () => onSliderPointerDown,
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('Split panel', () => {
  describeEachAppLayout({ sizes: ['desktop', 'mobile'] }, ({ theme }) => {
    describe.each(['collapse', 'hide'] as const)('closeBehavior=%s', closeBehavior => {
      test('throws error when split panel is used outside its context', () => {
        expect(() => render(<SplitPanel {...defaultProps} closeBehavior={closeBehavior} />)).toThrow(
          'Split panel can only be used inside app layout'
        );
      });

      test('renders panel in bottom position', () => {
        const { wrapper } = renderSplitPanel({ contextProps: { position: 'bottom' }, props: { closeBehavior } });
        expect(wrapper!.findOpenPanelBottom()).not.toBeNull();
        expect(wrapper!.findOpenPanelSide()).toBeNull();
      });

      test('renders panel in side position', () => {
        const { wrapper } = renderSplitPanel({ contextProps: { position: 'side' }, props: { closeBehavior } });
        expect(wrapper!.findOpenPanelBottom()).toBeNull();
        expect(wrapper!.findOpenPanelSide()).not.toBeNull();
      });

      describe.each(['bottom', 'side'] as const)('Position %s', position => {
        test('displays header, content and aria-label', () => {
          const { wrapper } = renderSplitPanel({ contextProps: { position }, props: { closeBehavior } });
          expect(wrapper!.findHeader().getElement()).toHaveTextContent('Split panel header');
          expect(wrapper!.getElement()).toHaveTextContent('Split panel content');
          expect(wrapper!.findSlider()!.getElement()).toHaveAttribute('aria-label', 'resizeHandleAriaLabel');
        });

        describe('Toggling', () => {
          test('shows close button on open', () => {
            const { wrapper } = renderSplitPanel({
              contextProps: { position, isOpen: true },
              props: { closeBehavior },
            });
            expect(wrapper!.findCloseButton()).not.toBeNull();
            expect(wrapper!.findCloseButton()!.getElement()).toHaveAttribute('aria-label', 'closeButtonAriaLabel');
          });

          test('does not show close button on closed panel', () => {
            const { wrapper } = renderSplitPanel({
              contextProps: { position, isOpen: false },
              props: { closeBehavior },
            });
            expect(wrapper?.findCloseButton()).toBeFalsy();
          });

          testIf(closeBehavior === 'collapse' && theme !== 'refresh')('shows open button on closed', () => {
            const { wrapper } = renderSplitPanel({
              contextProps: { position, isOpen: false },
              props: { closeBehavior },
            });
            expect(wrapper!.findOpenButton()).not.toBeNull();
            expect(wrapper!.findOpenButton()!.getElement()).toHaveAttribute('aria-label', 'openButtonAriaLabel');
          });

          testIf(closeBehavior === 'hide')('does not show open button on closed', () => {
            const { wrapper } = renderSplitPanel({
              contextProps: { position, isOpen: false },
              props: { closeBehavior },
            });
            expect(wrapper?.findOpenButton()).toBeFalsy();
          });

          test('does not show open button on open panel', () => {
            const { wrapper } = renderSplitPanel({
              contextProps: { position, isOpen: true },
              props: { closeBehavior },
            });
            expect(wrapper!.findOpenButton()).toBeNull();
          });

          test('hides panel', () => {
            (defaultSplitPanelContextProps.onToggle as jest.Mock).mockClear();

            const { wrapper } = renderSplitPanel({
              contextProps: { position, isOpen: true },
              props: { closeBehavior },
            });
            wrapper!.findCloseButton()!.getElement().click();
            expect(defaultSplitPanelContextProps.onToggle).toHaveBeenCalledTimes(1);
          });

          testIf(closeBehavior === 'collapse' && theme !== 'refresh')('opens panel by clicking on open button', () => {
            (defaultSplitPanelContextProps.onToggle as jest.Mock).mockClear();

            const { wrapper } = renderSplitPanel({
              contextProps: { position, isOpen: false },
              props: { closeBehavior },
            });
            wrapper!.findOpenButton()!.getElement().click();
            expect(defaultSplitPanelContextProps.onToggle).toHaveBeenCalledTimes(1);
          });
        });

        describe('Slider', () => {
          test('shows slider on open panel', () => {
            const { wrapper } = renderSplitPanel({
              contextProps: { position, isOpen: true },
              props: { closeBehavior },
            });
            expect(wrapper!.findSlider()).not.toBeNull();
          });

          test('does not show slider button on closed panel', () => {
            const { wrapper } = renderSplitPanel({
              contextProps: { position, isOpen: false },
              props: { closeBehavior },
            });
            expect(wrapper?.findSlider()).toBeFalsy();
          });

          test('fires keyDown', () => {
            onKeyDown.mockClear();
            const { wrapper } = renderSplitPanel({ contextProps: { position }, props: { closeBehavior } });
            fireEvent.keyDown(wrapper!.findSlider()!.getElement(), { keyCode: KeyCode.up });
            expect(onKeyDown).toHaveBeenCalledTimes(1);
          });

          test('fires pointerDown', () => {
            onSliderPointerDown.mockClear();
            const { wrapper } = renderSplitPanel({ contextProps: { position }, props: { closeBehavior } });
            fireEvent.pointerDown(wrapper!.findSlider()!.getElement());
            expect(onSliderPointerDown).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe('Preferences', () => {
        test('shows preferences button by default', () => {
          const { wrapper } = renderSplitPanel({ props: { closeBehavior } });
          expect(wrapper!.findPreferencesButton()).not.toBeNull();
        });

        test('hides preferences button', () => {
          const { wrapper } = renderSplitPanel({ props: { hidePreferencesButton: true, closeBehavior } });
          expect(wrapper!.findPreferencesButton()).toBeNull();
        });

        test('opens preferences modal', () => {
          const { wrapper } = renderSplitPanel({ props: { closeBehavior } });
          wrapper!.findPreferencesButton()!.click();
          const modalWrapper = createWrapper().findModal();
          expect(modalWrapper).not.toBeNull();
        });

        test('applies preferencesCloseAriaLabel to the modal close button', () => {
          const { wrapper } = renderSplitPanel({
            props: { closeBehavior, i18nStrings: { preferencesCloseAriaLabel: 'Close' } },
          });
          wrapper!.findPreferencesButton()!.click();
          const modalWrapper = createWrapper().findModal()!;
          expect(modalWrapper.findDismissButton().getElement()).toHaveAccessibleName('Close');
        });

        test('cancels modal', () => {
          const { wrapper } = renderSplitPanel({ props: { closeBehavior } });
          wrapper!.findPreferencesButton()!.click();
          const modalWrapper = createWrapper().findModal()!;

          modalWrapper.findFooter()!.findAllButtons()[0].getElement().click();

          expect(defaultSplitPanelContextProps.onPreferencesChange).not.toHaveBeenCalled();
          expect(createWrapper().findModal()).toBeNull();
        });

        test('confirms modal', () => {
          const { wrapper } = renderSplitPanel({ props: { closeBehavior } });
          wrapper!.findPreferencesButton()!.click();
          const modalWrapper = createWrapper().findModal()!;

          modalWrapper.findFooter()!.findAllButtons()[1].getElement().click();

          expect(defaultSplitPanelContextProps.onPreferencesChange).toHaveBeenCalledTimes(1);
          expect(defaultSplitPanelContextProps.onPreferencesChange).toHaveBeenCalledWith({
            position: defaultSplitPanelContextProps.position,
          });
          expect(createWrapper().findModal()).toBeNull();
        });

        test('disables "side" position option in forced "bottom" position', () => {
          const { wrapper } = renderSplitPanel({ contextProps: { isForcedPosition: true }, props: { closeBehavior } });
          wrapper!.findPreferencesButton()!.click();
          const sidePositionTileElement = createWrapper()
            .findModal()!
            .findContent()!
            .findTiles()!
            .findInputByValue('side')!
            .getElement();
          expect(sidePositionTileElement?.disabled).toBeTruthy();
        });
      });

      describe('has proper aria properties', () => {
        test('split panel content has correct role', () => {
          const { wrapper } = renderSplitPanel({ contextProps: { position: 'side' }, props: { closeBehavior } });
          const sidePanelElem = wrapper!.findByClassName(styles['drawer-content-side'])?.getElement();
          expect(sidePanelElem).toHaveAttribute('role', 'region');
        });

        test('split panel is labelled by panel header', () => {
          const { wrapper } = renderSplitPanel({ contextProps: { position: 'side' }, props: { closeBehavior } });
          const sidePanelElem = wrapper!.findByClassName(styles['drawer-content-side'])?.getElement();
          const labelId = sidePanelElem?.getAttribute('aria-labelledby');

          expect(sidePanelElem?.querySelector(`#${labelId}`)!.textContent).toBe('Split panel header');
        });

        test('split panel uses ARIA label if provided instead of being labelled by panel header', () => {
          const { wrapper } = renderSplitPanel({
            contextProps: { position: 'side' },
            props: { closeBehavior, ariaLabel: 'Custom ARIA label' },
          });
          const sidePanelElem = wrapper!.findByClassName(styles['drawer-content-side'])?.getElement();
          expect(sidePanelElem?.getAttribute('aria-labelledby')).toBeFalsy();
          expect(sidePanelElem?.getAttribute('aria-label')).toBe('Custom ARIA label');
        });
      });

      describe('i18n', () => {
        test("should use preferencesCancel when preferencesCloseAriaLabel isn't provided", () => {
          const { wrapper } = renderSplitPanel({
            props: { i18nStrings: { preferencesCancel: 'Custom cancel' }, closeBehavior },
            contextProps: { position: 'bottom', isOpen: true },
          });
          wrapper!.findPreferencesButton()!.click();
          expect(createWrapper().findModal()!.findDismissButton().getElement()).toHaveAccessibleName('Custom cancel');
        });

        testIf(closeBehavior === 'collapse')(
          'supports using i18nStrings.openButtonAriaLabel from i18n provider',
          () => {
            const { wrapper } = renderSplitPanel({
              props: { i18nStrings: undefined, closeBehavior },
              contextProps: { position: 'bottom', isOpen: false },
              messages: { 'i18nStrings.openButtonAriaLabel': 'Custom open button' },
            });
            expect(wrapper!.findOpenButton()!.getElement()).toHaveAttribute('aria-label', 'Custom open button');
          }
        );

        test('supports using i18nStrings.closeButtonAriaLabel and i18nStrings.resizeHandle* from i18n provider', () => {
          const { wrapper } = renderSplitPanel({
            props: { i18nStrings: undefined, closeBehavior },
            contextProps: { position: 'bottom', isOpen: true },
            messages: {
              'i18nStrings.closeButtonAriaLabel': 'Custom close button',
              'i18nStrings.resizeHandleAriaLabel': 'Custom resize',
              'i18nStrings.resizeHandleTooltipText': 'Custom tooltip text',
            },
          });
          expect(wrapper!.findCloseButton()!.getElement()).toHaveAttribute('aria-label', 'Custom close button');
          expect(wrapper!.findSlider()!.getElement()).toHaveAttribute('aria-label', 'Custom resize');
          fireEvent.pointerOver(wrapper!.findSlider()!.getElement());
          expect(document.querySelector(`.${tooltipStyles.root}`)).toHaveTextContent('Custom tooltip text');
        });

        test('supports using preferences props from i18n provider', () => {
          const { wrapper } = renderSplitPanel({
            props: { i18nStrings: undefined, closeBehavior },
            contextProps: { position: 'bottom', isOpen: true },
            messages: {
              'i18nStrings.preferencesTitle': 'Custom title',
              'i18nStrings.preferencesPositionLabel': 'Custom position',
              'i18nStrings.preferencesPositionDescription': 'Custom position description',
              'i18nStrings.preferencesPositionSide': 'Custom side',
              'i18nStrings.preferencesPositionBottom': 'Custom bottom',
              'i18nStrings.preferencesConfirm': 'Custom confirm',
              'i18nStrings.preferencesCancel': 'Custom cancel',
            },
            modalMessages: {
              closeAriaLabel: 'Custom modal close',
            },
          });
          wrapper!.findPreferencesButton()!.click();
          const modalWrapper = createWrapper().findModal()!;
          expect(modalWrapper.findDismissButton().getElement()).toHaveAccessibleName('Custom modal close');
          expect(modalWrapper.findHeader().getElement()).toHaveTextContent('Custom title');
          expect(modalWrapper.findContent().findFormField()!.findLabel()!.getElement()).toHaveTextContent(
            'Custom position'
          );
          expect(modalWrapper.findContent().findFormField()!.findDescription()!.getElement()).toHaveTextContent(
            'Custom position description'
          );
          const tileItems = modalWrapper.findContent().findTiles()!.findItems();
          expect(tileItems[0].findLabel().getElement()).toHaveTextContent('Custom bottom');
          expect(tileItems[1].findLabel().getElement()).toHaveTextContent('Custom side');
          const footerItems = modalWrapper.findFooter()!.findSpaceBetween()!;
          expect(footerItems.find(':nth-child(1)')!.findButton()!.getElement()).toHaveTextContent('Custom cancel');
          expect(footerItems.find(':nth-child(2)')!.findButton()!.getElement()).toHaveTextContent('Custom confirm');
        });
      });
    });
  });
});

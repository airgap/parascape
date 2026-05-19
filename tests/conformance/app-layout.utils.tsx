// AUTO-ADAPTED from cloudscape-design/components src/app-layout/__tests__/
// app-layout.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable @cloudscape-design/component-toolkit/internal/testing; shimmed ../../../lib/components/internal/generated/custom-css-properties; stubbed unresolvable ../../../lib/components/internal/hooks/use-mobile; stubbed unresolvable ../../../lib/components/split-panel; stubbed unresolvable ../../../lib/components/app-layout/visual-refresh/styles.css.js; stubbed unresolvable ../../../lib/components/app-layout/visual-refresh-toolbar/skeleton/styles.css.js.
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

/* eslint-disable jest/no-export */
import { React } from '@conformance/adapter';
import { render } from '@conformance/adapter';

const { clearVisualRefreshState, setGlobalFlag } = __STUB; // stub: @cloudscape-design/component-toolkit/internal/testing
import { ComponentWrapper } from '@cloudscape-design/test-utils-core/dom';

import AppLayout from '@components/AppLayout.pui';
const customCssProps = {"contentLayoutMaxContentWidth":"--awsui-content-layout-max-content-width-6b9ypa","maxContentWidth":"--awsui-max-content-width-6b9ypa","minContentWidth":"--awsui-min-content-width-6b9ypa","defaultMaxContentWidth":"--awsui-default-max-content-width-6b9ypa","defaultMinContentWidth":"--awsui-default-min-content-width-6b9ypa"}; // shim: ../../../lib/components/internal/generated/custom-css-properties
const { forceMobileModeSymbol } = __STUB; // stub: ../../../lib/components/internal/hooks/use-mobile
const { SplitPanelProps } = __STUB; // stub: ../../../lib/components/split-panel
import { createWrapper, AppLayoutWrapper,
  ButtonGroupWrapper,
  ButtonWrapper,
  ElementWrapper, } from '@conformance/adapter';

import testutilStyles from '@cloudscape/app-layout.test-classes.js';
const visualRefreshStyles = __STUB; // stub: ../../../lib/components/app-layout/visual-refresh/styles.css.js
import globalDrawerStyles from '@cloudscape/drawer.styles.js';
const visualRefreshToolbarStyles = __STUB; // stub: ../../../lib/components/app-layout/visual-refresh-toolbar/skeleton/styles.css.js

export function renderComponent(jsx: React.ReactElement) {
  const { container, rerender, ...rest } = render(jsx);
  const wrapper = createWrapper(container).findAppLayout()!;

  const isUsingGridLayout = wrapper.getElement().classList.contains(visualRefreshStyles.layout);

  return { wrapper, rerender, isUsingGridLayout, container, ...rest };
}

type Theme = 'refresh' | 'refresh-toolbar' | 'classic';
type Size = 'desktop' | 'mobile';

interface AppLayoutTestConfig {
  themes: Array<Theme>;
  sizes: Array<Size>;
}

type AppLayoutTestSuite = (config: { theme: Theme; size: Size }) => void;

const defaultTestConfig: AppLayoutTestConfig = {
  themes: ['classic', 'refresh', 'refresh-toolbar'],
  sizes: ['desktop', 'mobile'],
};

const globalWithFlags = globalThis as any;

export function describeEachAppLayout(callback: AppLayoutTestSuite): void;
export function describeEachAppLayout(config: Partial<AppLayoutTestConfig>, callback: AppLayoutTestSuite): void;
export function describeEachAppLayout(
  ...args: [AppLayoutTestSuite] | [Partial<AppLayoutTestConfig>, AppLayoutTestSuite]
) {
  const config = args.length === 1 ? defaultTestConfig : { ...defaultTestConfig, ...args[0] };
  const callback = args.length === 1 ? args[0] : args[1];

  for (const theme of config.themes) {
    for (const size of config.sizes) {
      describe(`Theme=${theme}, Size=${size}`, () => {
        beforeEach(() => {
          globalWithFlags[forceMobileModeSymbol] = size === 'mobile';
          globalWithFlags[Symbol.for('awsui-visual-refresh-flag')] = () => theme !== 'classic';
          setGlobalFlag('appLayoutToolbar', theme === 'refresh-toolbar');
        });
        afterEach(() => {
          delete globalWithFlags[forceMobileModeSymbol];
          delete globalWithFlags[Symbol.for('awsui-visual-refresh-flag')];
          setGlobalFlag('appLayoutToolbar', undefined);
          clearVisualRefreshState();
        });
        test('mocks applied correctly', () => {
          const { wrapper } = renderComponent(<AppLayout />);
          expect(!!wrapper.matches(`.${visualRefreshStyles.layout}`)).toEqual(theme === 'refresh');
          expect(!!wrapper.matches(`.${visualRefreshToolbarStyles.root}`)).toEqual(theme === 'refresh-toolbar');
          expect(!!wrapper.findByClassName(testutilStyles['mobile-bar'])).toEqual(size === 'mobile');
        });
        callback({ theme, size });
      });
    }
  }
}

export function findActiveDrawerLandmark(wrapper: AppLayoutWrapper) {
  const drawer = wrapper.findActiveDrawer();
  if (!drawer) {
    return null;
  }
  // <aside> tag is rendered differently in classic and refresh designs
  if (drawer.getElement().tagName === 'ASIDE') {
    return drawer;
  }
  return drawer.find('aside');
}

export function getActiveDrawerWidth(wrapper: AppLayoutWrapper): string {
  const drawerElement = wrapper.findActiveDrawer()!.getElement();
  let value = drawerElement.style.getPropertyValue(customCssProps.drawerSize);
  // Visual refresh implementation
  if (value) {
    return value;
  }
  // Visual refresh toolbar implementation
  value = wrapper.getElement()!.style.getPropertyValue(customCssProps.toolsWidth);
  if (value) {
    return value;
  }
  // Classic implementation
  return drawerElement.style.width;
}

export function getGlobalDrawerWidth(
  wrapper: ReturnType<typeof getGlobalDrawersTestUtils>,
  drawerId: string
): string | null {
  const drawerElement = wrapper.findDrawerById(drawerId)!.getElement();
  const value = drawerElement.style.getPropertyValue(customCssProps.drawerSize);
  return value ?? null;
}

export function getBottomDrawerHeight(
  wrapper: ReturnType<typeof getGlobalDrawersTestUtils>,
  drawerId: string
): string | null {
  const drawerElement = wrapper.findDrawerById(drawerId)!.getElement();
  const value = drawerElement.style.getPropertyValue(customCssProps.bottomDrawerSize);
  return value ?? null;
}

export const splitPanelI18nStrings: SplitPanelProps.I18nStrings = {
  closeButtonAriaLabel: 'Close panel',
  openButtonAriaLabel: 'Open panel',
  preferencesTitle: 'Preferences',
  preferencesPositionLabel: 'Position',
  preferencesPositionDescription: 'Choose the default split panel position.',
  preferencesPositionSide: 'Side',
  preferencesPositionBottom: 'Bottom',
  preferencesConfirm: 'Confirm',
  preferencesCancel: 'Cancel',
  resizeHandleAriaLabel: 'Resize panel',
};

export const testDrawer: any.Drawer = {
  ariaLabels: {
    closeButton: 'Security close button',
    drawerName: 'Security drawer content',
    triggerButton: 'Security trigger button',
    resizeHandle: 'Security resize handle',
  },
  content: <span>Security</span>,
  id: 'security',
  trigger: {
    iconName: 'security',
  },
};

export const testDrawerWithoutLabels = {
  ...testDrawer,
  // not allowed by types, but we still would like to test this
  ariaLabels: undefined as unknown as any.DrawerAriaLabels,
};

const getDrawerItem = (id: string, badge: boolean): any.Drawer => {
  return {
    ariaLabels: {
      closeButton: `${id} close button`,
      drawerName: `${id} drawer content`,
      triggerButton: `${id} trigger button`,
      resizeHandle: `${id} resize handle`,
    },
    content: <span>{id}</span>,
    badge,
    id,
    trigger: {
      iconName: 'security',
    },
  };
};

export const manyDrawers: Array<any.Drawer> = [
  getDrawerItem('security', true),
  ...Array.from({ length: 100 }, (_, index) => getDrawerItem(`${index}`, false)),
];

export const manyDrawersWithBadges: Array<any.Drawer> = Array.from({ length: 100 }, (_, index) =>
  getDrawerItem(`${index}`, true)
);

class AppLayoutDrawerWrapper extends ComponentWrapper {
  isActive(): boolean {
    return this.element.classList.contains(testutilStyles['active-drawer']);
  }

  isDrawerInExpandedMode(): boolean {
    return this.element.classList.contains(globalDrawerStyles['drawer-expanded']);
  }
}

export const getGlobalDrawersTestUtils = (wrapper: AppLayoutWrapper) => {
  return {
    findActiveDrawers(): Array<ElementWrapper> {
      return wrapper.findAllByClassName(testutilStyles['active-drawer']);
    },

    findDrawerById(id: string): AppLayoutDrawerWrapper | null {
      const element = wrapper.find(`[data-testid="awsui-app-layout-drawer-${id}"]`);
      return element ? new AppLayoutDrawerWrapper(element.getElement()) : null;
    },

    findGlobalDrawersTriggers(): ElementWrapper<HTMLButtonElement>[] {
      return wrapper.findAllByClassName<HTMLButtonElement>(testutilStyles['drawers-trigger-global']);
    },

    findResizeHandleByActiveDrawerId(id: string): ElementWrapper | null {
      return wrapper.find(
        `.${testutilStyles['active-drawer']}[data-testid="awsui-app-layout-drawer-${id}"] .${testutilStyles['drawers-slider']}`
      );
    },

    findCloseButtonByActiveDrawerId(id: string): ButtonWrapper | null {
      return wrapper
        .findComponent(
          `.${testutilStyles['active-drawer']}[data-testid="awsui-app-layout-drawer-${id}"]`,
          ButtonGroupWrapper
        )!
        .findButtonById('close');
    },

    findExpandedModeButtonByActiveDrawerId(id: string): ButtonWrapper | null {
      return wrapper
        .findComponent(
          `.${testutilStyles['active-drawer']}[data-testid="awsui-app-layout-drawer-${id}"]`,
          ButtonGroupWrapper
        )!
        .findButtonById('expand');
    },

    findLeaveExpandedModeButtonInAIDrawer(): ElementWrapper | null {
      return wrapper.find(
        `.${testutilStyles['active-drawer']} .${testutilStyles['active-ai-drawer-leave-expanded-mode-custom-button']}`
      );
    },

    isLayoutInDrawerExpandedMode(): boolean {
      return !!wrapper.matches(`.${visualRefreshToolbarStyles['drawer-expanded-mode']}`);
    },

    findAiDrawerTrigger(): ElementWrapper | null {
      return wrapper.find(`.${testutilStyles['ai-drawer-toggle']}`);
    },
  };
};

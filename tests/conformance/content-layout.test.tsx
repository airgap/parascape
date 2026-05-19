// AUTO-ADAPTED from cloudscape-design/components src/content-layout/__tests__/
// content-layout.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, jest.mock → hoisted vi.mock; stubbed unresolvable ../../../lib/components/internal/generated/custom-css-properties; stubbed unresolvable ../../../lib/components/internal/hooks/use-visual-mode; stubbed unresolvable ../../../lib/components/internal/utils/content-header-utils; interaction (manual-triage tier).
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

import ContentLayout from '@components/ContentLayout.pui';
const customCssProps = __STUB; // stub: ../../../lib/components/internal/generated/custom-css-properties
const { useVisualRefresh } = __STUB; // stub: ../../../lib/components/internal/hooks/use-visual-mode
const { highContrastHeaderClassName } = __STUB; // stub: ../../../lib/components/internal/utils/content-header-utils
import { createWrapper } from '@conformance/adapter';

import styles from '@cloudscape/content-layout.styles.js';

vi.mock('../../../lib/components/internal/hooks/use-visual-mode', async (importOriginal) => ({
  useVisualRefresh: jest.fn().mockReturnValue(false),
}));

function renderContentLayout(props: any = {}) {
  const { container, rerender } = render(<ContentLayout {...props} />);
  const wrapper = createWrapper(container).findContentLayout()!;

  return {
    wrapper,
    isOverlapEnabled() {
      return !wrapper.getElement().classList.contains(styles['is-overlap-disabled']);
    },
    rerender: (props: any) => rerender(<ContentLayout {...props} />),
  };
}
['classic', 'visual-refresh'].forEach(theme => {
  describe(`ContentLayout component - ${theme}`, () => {
    beforeEach(() => {
      (useVisualRefresh as jest.Mock).mockReturnValue(theme === 'visual-refresh');
    });
    afterEach(() => {
      (useVisualRefresh as jest.Mock).mockReset();
    });
    describe('slots', () => {
      test('renders the header slot', () => {
        const { wrapper } = renderContentLayout({
          header: <>Header text</>,
        });

        expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Header text');
      });

      test('renders the content slot', () => {
        const { wrapper } = renderContentLayout({
          children: <>Content text</>,
        });

        expect(wrapper.findHeader()).toBeNull();
        expect(wrapper.findContent()!.getElement()).toHaveTextContent('Content text');
      });

      test('renders the secondaryHeader slot if the header slot is present', () => {
        const { wrapper } = renderContentLayout({
          header: <>Header text</>,
          secondaryHeader: <>Secondary text</>,
        });

        expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Header text');
        expect(wrapper.findSecondaryHeader()!.getElement()).toHaveTextContent('Secondary text');
      });

      test('does not render the secondaryHeader slot if the header slot is not present', () => {
        const { wrapper } = renderContentLayout({
          secondaryHeader: <>Secondary text</>,
        });
        expect(wrapper.findSecondaryHeader()).toBeNull();
      });

      test('renders notifications slot', () => {
        const { wrapper } = renderContentLayout({
          notifications: <>Notifications</>,
        });
        expect(wrapper.findNotifications()!.getElement()).toHaveTextContent('Notifications');
      });

      test('renders breadcrumbs slot', () => {
        const { wrapper } = renderContentLayout({
          breadcrumbs: <>Breadcrumbs</>,
        });
        expect(wrapper.findBreadcrumbs()!.getElement()).toHaveTextContent('Breadcrumbs');
      });

      test('renders all slots', () => {
        const { wrapper } = renderContentLayout({
          notifications: <>Notifications</>,
          breadcrumbs: <>Breadcrumbs</>,
          children: <>Content text</>,
          header: <>Header text</>,
          secondaryHeader: <>Secondary text</>,
        });

        expect(wrapper.findHeader()!.getElement()).toHaveTextContent('Header text');
        expect(wrapper.findContent()!.getElement()).toHaveTextContent('Content text');
        expect(wrapper.findBreadcrumbs()!.getElement()).toHaveTextContent('Breadcrumbs');
        expect(wrapper.findNotifications()!.getElement()).toHaveTextContent('Notifications');
        expect(wrapper.findSecondaryHeader()!.getElement()).toHaveTextContent('Secondary text');
      });

      test('renders no optional slots', () => {
        const { wrapper } = renderContentLayout({});

        expect(wrapper.findHeader()).toBeNull();
        expect(wrapper.findBreadcrumbs()).toBeNull();
        expect(wrapper.findNotifications()).toBeNull();
        expect(wrapper.findSecondaryHeader()).toBeNull();
      });
    });
    if (theme === 'visual-refresh') {
      describe('overlap', () => {
        test('renders the overlap by default', () => {
          const { isOverlapEnabled } = renderContentLayout({ children: <>Content text</>, header: <>Header text</> });
          expect(isOverlapEnabled()).toBe(true);
        });

        test('does not render the overlap if disableOverlap is set', () => {
          const { isOverlapEnabled } = renderContentLayout({
            children: <>Content text</>,
            header: <>Header text</>,
            disableOverlap: true,
          });
          expect(isOverlapEnabled()).toBe(false);
        });

        test('does not render the overlap if the content is empty', () => {
          const { isOverlapEnabled } = renderContentLayout({
            header: <>Header text</>,
          });
          expect(isOverlapEnabled()).toBe(false);
        });

        test('renders the overlap if the header is empty', () => {
          const { isOverlapEnabled } = renderContentLayout({
            children: <>Content text</>,
          });
          expect(isOverlapEnabled()).toBe(true);
        });

        test('does not render the overlap if the content is toggled', () => {
          const { isOverlapEnabled, rerender } = renderContentLayout({
            children: <>Content text</>,
            header: <>Header text</>,
          });
          expect(isOverlapEnabled()).toBe(true);

          rerender({
            header: <>Header text</>,
          });
          expect(isOverlapEnabled()).toBe(false);

          rerender({
            children: <>Content text</>,
            header: <>Header text</>,
          });
          expect(isOverlapEnabled()).toBe(true);
        });
      });
    }

    describe('headerVariant', () => {
      test('default', () => {
        const { wrapper } = renderContentLayout({
          notifications: <>Notifications</>,
          breadcrumbs: <>Breadcrumbs</>,
          children: <>Content text</>,
          header: <>Header text</>,
          secondaryHeader: <>Secondary text</>,
        });
        expect(wrapper.findByClassName(styles.background)!.getElement()).not.toHaveClass(highContrastHeaderClassName);
        expect(wrapper.findHeader()!.getElement()).not.toHaveClass(highContrastHeaderClassName);
        expect(wrapper.findNotifications()!.getElement()).not.toHaveClass(highContrastHeaderClassName);
        expect(wrapper.findBreadcrumbs()!.getElement()).not.toHaveClass(highContrastHeaderClassName);
        expect(wrapper.findSecondaryHeader()!.getElement()).not.toHaveClass(highContrastHeaderClassName);

        expect(wrapper.findByClassName(styles['header-wrapper'])!.getElement()).not.toHaveClass(styles['with-divider']);
      });
      if (theme === 'visual-refresh') {
        test('high-contrast', () => {
          const { wrapper } = renderContentLayout({
            notifications: <>Notifications</>,
            breadcrumbs: <>Breadcrumbs</>,
            children: <>Content text</>,
            header: <>Header text</>,
            secondaryHeader: <>Secondary text</>,
            headerVariant: 'high-contrast',
          });
          expect(wrapper.findByClassName(styles.background)!.getElement()).toHaveClass(highContrastHeaderClassName);
          expect(wrapper.findHeader()!.getElement()).toHaveClass(highContrastHeaderClassName);
          expect(wrapper.findNotifications()!.getElement()).toHaveClass(highContrastHeaderClassName);
          expect(wrapper.findBreadcrumbs()!.getElement()).toHaveClass(highContrastHeaderClassName);
          expect(wrapper.findSecondaryHeader()!.getElement()).not.toHaveClass(highContrastHeaderClassName);

          expect(wrapper.findByClassName(styles['header-wrapper'])!.getElement()).not.toHaveClass(
            styles['with-divider']
          );
        });
      }

      test('divider', () => {
        const { wrapper } = renderContentLayout({
          notifications: <>Notifications</>,
          breadcrumbs: <>Breadcrumbs</>,
          children: <>Content text</>,
          header: <>Header text</>,
          secondaryHeader: <>Secondary text</>,
          headerVariant: 'divider',
        });
        expect(wrapper.findByClassName(styles.background)!.getElement()).not.toHaveClass(highContrastHeaderClassName);
        expect(wrapper.findHeader()!.getElement()).not.toHaveClass(highContrastHeaderClassName);
        expect(wrapper.findNotifications()!.getElement()).not.toHaveClass(highContrastHeaderClassName);
        expect(wrapper.findBreadcrumbs()!.getElement()).not.toHaveClass(highContrastHeaderClassName);
        expect(wrapper.findSecondaryHeader()!.getElement()).not.toHaveClass(highContrastHeaderClassName);

        expect(wrapper.findByClassName(styles['header-wrapper'])!.getElement()).toHaveClass(styles['with-divider']);
      });
    });

    describe('maxContentWidth', () => {
      const halfGeckoMaxCssLength = ((1 << 30) - 1) / 120;
      test('is set to maximum value if not specified', () => {
        const { wrapper } = renderContentLayout({
          header: <>Header text</>,
        });
        const maxWidthInGrid = wrapper.getElement().style.getPropertyValue(customCssProps.contentLayoutMaxContentWidth);
        expect(maxWidthInGrid).toBe(`${halfGeckoMaxCssLength}px`);
      });

      test('is set to maximum value when maxContentWidth=Nuber.MAX_VALUE', () => {
        const { wrapper } = renderContentLayout({
          header: <>Header text</>,
          maxContentWidth: Number.MAX_VALUE,
        });
        const maxWidthInGrid = wrapper.getElement().style.getPropertyValue(customCssProps.contentLayoutMaxContentWidth);
        expect(maxWidthInGrid).toBe(`${halfGeckoMaxCssLength}px`);
      });

      test('is set correctly when numeric value is specified', () => {
        const { wrapper } = renderContentLayout({
          header: <>Header text</>,
          maxContentWidth: 1200,
        });
        const maxWidthInGrid = wrapper.getElement().style.getPropertyValue(customCssProps.contentLayoutMaxContentWidth);
        expect(maxWidthInGrid).toBe('1200px');
      });
    });

    describe('defaultPadding', () => {
      test('adds defaultPadding className when specified', () => {
        const { wrapper } = renderContentLayout({
          header: <>Header text</>,
          defaultPadding: true,
        });
        expect(wrapper.getElement()).toHaveClass(styles['default-padding']);
      });
      test('does not add defaultPadding className when not specified', () => {
        const { wrapper } = renderContentLayout({
          header: <>Header text</>,
          secondaryHeader: <>Secondary text</>,
        });
        expect(wrapper.getElement()).not.toHaveClass(styles['default-padding']);
      });
    });

    describe('defaultBackgroundStyle', () => {
      test('adds style property when string is specified', () => {
        const { wrapper } = renderContentLayout({
          headerBackgroundStyle: 'blue',
        });

        expect(wrapper.findByClassName(styles['header-background'])!.getElement()).toHaveStyle('background: blue;');
      });
      test('adds style property when function is specified', () => {
        const { wrapper } = renderContentLayout({
          headerBackgroundStyle: () => 'blue',
        });
        expect(wrapper.findByClassName(styles['header-background'])!.getElement()).toHaveStyle('background: blue;');
      });
    });
  });
});

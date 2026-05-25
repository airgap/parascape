// AUTO-ADAPTED from cloudscape-design/components src/token-group/__tests__/
// token-group.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, i18n/testing → passthrough provider; stubbed unresolvable ../../icon/__tests__/utils; stubbed unresolvable ../../../lib/components/internal/components/option/styles.selectors.js; interaction (manual-triage tier).
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
      : k === Symbol.toPrimitive || k === "toString" || k === "valueOf"
        ? () => ""
        : __STUB,
  apply: () => __STUB,
  construct: () => ({}),
});
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { React } from "@conformance/adapter";
import { render } from "@conformance/adapter";

const TestI18nProvider = (({ children }: any) => children) as any;
import { createWrapper, IconWrapper, TokenGroupWrapper } from "@conformance/adapter";
import TokenGroup from "@components/TokenGroup.pui";
const { getIconHTML } = __STUB; // stub: ../../icon/__tests__/utils

import optionSelectors from "@cloudscape/option.styles.js";
import tokenListSelectors from "@cloudscape/token-list.styles.js";
import selectors from "@cloudscape/token-group.styles.js";

function renderTokenGroup(props: any = {}): TokenGroupWrapper {
  const { container } = render(<TokenGroup {...props} />);
  return createWrapper(container).findTokenGroup()!;
}

function renderStatefulTokenGroup(props: Omit<any, "onDismiss"> = {}): TokenGroupWrapper {
  const { container } = render(<StatefulTokenGroup {...props} />);
  return createWrapper(container).findTokenGroup()!;
}

function StatefulTokenGroup({ items: initialItems = [], ...rest }: Omit<any, "onDismiss">) {
  const [items, setItems] = useState(initialItems);
  return (
    <TokenGroup
      {...rest}
      items={items}
      onDismiss={event => setItems(prev => prev.filter((_, index) => index !== event.detail.itemIndex))}
    />
  );
}

const onDismiss = () => {};
const generateItems = (count: number) => [...new Array(count)].map((_, index) => ({ label: `label-${index}` }));
const i18nStrings = { limitShowMore: "Show more", limitShowFewer: "Show less" };

describe("TokenGroup", () => {
  const items = [
    {
      label: "Item label",
      labelTag: "128Gb",
      iconName: "close",
      description: "Item description",
      tags: ["2-CPU", "2Gb RAM"],
    },
  ] as any.Item[];

  test("raises warning without onDismiss property", () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    renderTokenGroup({ items });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `[AwsUi] [TokenGroup] You provided \`items\` prop without an \`onDismiss\` handler. This will render a read-only component. If the component should be mutable, set an \`onDismiss\` handler.`,
    );
    consoleWarnSpy.mockRestore();
  });

  test('does not apply "has-items" class when provided an empty items list', () => {
    const wrapper = renderTokenGroup({ items: [], onDismiss });
    expect(wrapper.getElement()).not.toHaveClass(selectors["has-items"]);
  });

  test('applies "has-items" class with a non-empty list', () => {
    const wrapper = renderTokenGroup({ items, onDismiss });
    expect(wrapper.getElement()).toHaveClass(selectors["has-items"]);
  });

  test("aligns tokens horizontally by default", () => {
    const wrapper = renderTokenGroup({ items, onDismiss });
    expect(wrapper.find(`ul.${tokenListSelectors.horizontal}`)).not.toBeNull();
  });

  test("applies the alignment correctly", () => {
    const wrapper = renderTokenGroup({ alignment: "vertical", items, onDismiss });
    expect(wrapper.find(`ul.${tokenListSelectors.horizontal}`)).toBeNull();
    expect(wrapper.find(`ul.${tokenListSelectors.vertical}`)).not.toBeNull();
  });

  describe("Token", () => {
    const findToken = (wrapper: TokenGroupWrapper) => wrapper.findToken(1);

    test("displays option", () => {
      const wrapper = renderTokenGroup({ items, onDismiss });
      expect(wrapper.findToken(1)!.findOption()).not.toBeNull();
    });

    test("displays dismiss area", () => {
      const wrapper = renderTokenGroup({ items, onDismiss });

      expect(findToken(wrapper)!.findDismiss()).not.toBeNull();
      expect(findToken(wrapper)!.findDismiss().findByClassName(IconWrapper.rootSelector)).not.toBeNull();
    });

    test("sets no alternative text on the dismiss area by default", () => {
      const wrapper = renderTokenGroup({ items, onDismiss });

      expect(findToken(wrapper)!.findDismiss().getElement()).not.toHaveAttribute("aria-label");
    });

    test("sets the alternative text on the dismiss area", () => {
      const wrapper = renderTokenGroup({ items: [{ ...items[0], dismissLabel: "dismiss" }], onDismiss });

      expect(findToken(wrapper)!.findDismiss().getElement()).toHaveAttribute("aria-label", "dismiss");
    });

    test("correctly disables the option when disabled", () => {
      const wrapper = renderTokenGroup({ items: [{ ...items[0], disabled: true }], onDismiss });
      expect(findToken(wrapper)!.findByClassName(optionSelectors.disabled)).not.toBeNull();
    });

    test("sets aria-disabled on the token when disabled", () => {
      const wrapper = renderTokenGroup({ items: [{ ...items[0], disabled: true }], onDismiss });
      expect(wrapper.findToken(1)!.getElement()).toHaveAttribute("aria-disabled", "true");
    });

    test("sets aria-disabled and no disabled attribute on the token dismiss button when disabled", () => {
      const wrapper = renderTokenGroup({ items: [{ ...items[0], disabled: true }], onDismiss });
      const dismissButton = findToken(wrapper)!.findDismiss().getElement();
      expect(dismissButton).toHaveAttribute("aria-disabled", "true");
      expect(dismissButton).not.toHaveAttribute("disabled");
    });

    test("does not set aria-disabled on the token when not disabled", () => {
      const wrapper = renderTokenGroup({ items: [{ ...items[0], disabled: false }], onDismiss });
      expect(wrapper.findByClassName(tokenListSelectors["list-item"])!.getElement()).not.toHaveAttribute(
        "aria-disabled",
      );
    });

    test("does not set aria-disabled on the token dismiss button when not disabled", () => {
      const wrapper = renderTokenGroup({ items: [{ ...items[0], disabled: false }], onDismiss });
      expect(findToken(wrapper)!.findDismiss().getElement()).not.toHaveAttribute("aria-disabled");
    });

    test("does not trigger onDismiss when readOnly", () => {
      const onDismissSpy = jest.fn();
      const wrapper = renderTokenGroup({ items, readOnly: true, onDismiss: onDismissSpy });

      findToken(wrapper)!.findDismiss().click();

      expect(onDismissSpy).not.toHaveBeenCalled();
    });

    test("fires dismiss event on mouse click", () => {
      const onDismissSpy = jest.fn();
      const wrapper = renderTokenGroup({ items, onDismiss: onDismissSpy });

      findToken(wrapper)!.findDismiss().click();

      expect(onDismissSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { itemIndex: 0 },
        }),
      );
    });

    test("does not fire dismiss event when disabled", () => {
      const onDismissSpy = jest.fn();
      const wrapper = renderTokenGroup({ items: [{ ...items[0], disabled: true }], onDismiss });

      findToken(wrapper)!.findDismiss().click();

      expect(onDismissSpy).not.toHaveBeenCalled();
    });

    test("does not automatically remove the token after firing dismiss event", () => {
      const wrapper = renderTokenGroup({ items, onDismiss: onDismiss });

      findToken(wrapper)!.findDismiss().click();

      expect(findToken(wrapper)).not.toBeNull();
    });

    test("tokens are hidden by default when given a limit", () => {
      const wrapper = renderTokenGroup({ items: generateItems(5), i18nStrings, limit: 2 });
      expect(wrapper.findTokens().length).toBe(2);
      expect(wrapper.findTokenToggle()!.getElement()).toHaveTextContent("Show more (+3)");
    });

    test("tokens are expanded on token toggle", () => {
      const wrapper = renderTokenGroup({ items: generateItems(5), i18nStrings, limit: 2 });
      wrapper.findTokenToggle()!.click();

      expect(wrapper.findTokens().length).toBe(5);
      expect(wrapper.findTokenToggle()!.getElement()).toHaveTextContent("Show less");
    });

    test("tokens are hidden when clicking token toggle twice", () => {
      const wrapper = renderTokenGroup({ items: generateItems(5), i18nStrings, limit: 2 });
      wrapper.findTokenToggle()!.click();

      expect(wrapper.findTokens().length).toBe(5);
      expect(wrapper.findTokenToggle()!.getElement()).toHaveTextContent("Show less");
      wrapper.findTokenToggle()!.click();
      expect(wrapper.findTokenToggle()!.getElement()).toHaveTextContent("Show more (+3)");
    });

    test("toggle button has aria-controls property that points to the token container", () => {
      const wrapper = renderTokenGroup({ items: generateItems(5), i18nStrings, limit: 2 });

      const id = wrapper.findByClassName(tokenListSelectors.list)!.getElement().getAttribute("id");
      expect(wrapper.findTokenToggle()!.getElement()).toHaveAttribute("aria-controls", id);
    });

    test("shows expand icon when there tokens hidden", () => {
      const wrapper = renderTokenGroup({ items: generateItems(5), i18nStrings, limit: 2 });
      const icon = wrapper.findTokenToggle()!.find("svg");

      expect(icon!.getElement()).toContainHTML(getIconHTML("treeview-expand"));
    });

    test("shows collapse icon when there tokens hidden", () => {
      const wrapper = renderTokenGroup({ items: generateItems(5), i18nStrings, limit: 2 });
      wrapper.findTokenToggle()!.click();

      const icon = wrapper.findTokenToggle()!.find("svg");
      expect(icon!.getElement()).toContainHTML(getIconHTML("treeview-collapse"));
    });

    test("sets no aria-label text on the expand button by default", () => {
      const wrapper = renderTokenGroup({ items: generateItems(2), i18nStrings, limit: 1 });
      expect(wrapper.findTokenToggle()!.getElement()).toHaveTextContent("Show more (+1)");
      expect(wrapper.findTokenToggle()!.getElement()).not.toHaveAttribute("aria-label");
    });

    test("sets aria-label text on the expand button when provided", () => {
      const wrapper = renderTokenGroup({
        items: generateItems(2),
        limit: 1,
        limitShowMoreAriaLabel: "Show more dummy token",
      });
      expect(wrapper.findTokenToggle()!.getElement()!.getAttribute("aria-label")).toBe("Show more dummy token");
    });

    test("sets no aria-label text on the collapse button by default", () => {
      const wrapper = renderTokenGroup({ items: generateItems(2), i18nStrings, limit: 1 });
      wrapper.findTokenToggle()!.click();
      expect(wrapper.findTokenToggle()!.getElement()).toHaveTextContent("Show less");
      expect(wrapper.findTokenToggle()!.getElement()).not.toHaveAttribute("aria-label");
    });

    test("sets aria-label text on the collapse button when provided", () => {
      const wrapper = renderTokenGroup({
        items: generateItems(2),
        limit: 1,
        limitShowFewerAriaLabel: "Show fewer dummy token",
      });
      wrapper.findTokenToggle()!.click();
      expect(wrapper.findTokenToggle()!.getElement()!.getAttribute("aria-label")).toBe("Show fewer dummy token");
    });
  });

  describe("Focus management", () => {
    test("Focus is dispatched to the next token when non-last token is removed", () => {
      const wrapper = renderStatefulTokenGroup({
        items: [
          { label: "1", dismissLabel: "Remove 1" },
          { label: "2", dismissLabel: "Remove 2" },
          { label: "3", dismissLabel: "Remove 3", disabled: true },
          { label: "4", dismissLabel: "Remove 4" },
        ],
      });
      wrapper.findToken(2)!.findDismiss().click();

      expect(wrapper.findToken(2)!.findDismiss().getElement()).toHaveFocus();
    });

    test("Focus is dispatched to the previous token when last active token is removed", () => {
      const wrapper = renderStatefulTokenGroup({
        items: [
          { label: "1", dismissLabel: "Remove 1" },
          { label: "2", dismissLabel: "Remove 2" },
          { label: "3", dismissLabel: "Remove 3", disabled: true },
          { label: "4", dismissLabel: "Remove 4" },
        ],
      });
      wrapper.findToken(4)!.findDismiss().click();

      expect(wrapper.findToken(3)!.findDismiss().getElement()).toHaveFocus();
    });

    test('Focus returns to body when no token and no "show more" button after token removal', () => {
      const wrapper = renderStatefulTokenGroup({
        items: [
          { label: "1", dismissLabel: "Remove 1" },
          { label: "2", dismissLabel: "Remove 2" },
          { label: "3", dismissLabel: "Remove 3" },
        ],
      });
      wrapper.findToken(3)!.findDismiss().click();
      wrapper.findToken(2)!.findDismiss().click();
      wrapper.findToken(1)!.findDismiss().click();

      expect(document.body).toHaveFocus();
    });

    test('Focus moves to the first token which got visible after clicking "show more" get clicked', () => {
      const wrapper = renderStatefulTokenGroup({
        items: [
          { label: "1", dismissLabel: "Remove 1" },
          { label: "2", dismissLabel: "Remove 2" },
          { label: "3", dismissLabel: "Remove 3" },
          { label: "4", dismissLabel: "Remove 4" },
          { label: "5", dismissLabel: "Remove 5" },
        ],
        limit: 3,
      });
      wrapper.findTokenToggle()!.click();

      expect(wrapper.findToken(4)!.findDismiss().getElement()).toHaveFocus();
    });
  });
});

describe("i18n", () => {
  test("supports rendering limitShowFewer and limitShowMore using i18n provider", () => {
    const { container } = render(
      <TestI18nProvider
        messages={{
          "token-group": {
            "i18nStrings.limitShowFewer": "Custom show fewer",
            "i18nStrings.limitShowMore": "Custom show more",
          },
        }}
      >
        <TokenGroup limit={1} items={[{ label: "1" }, { label: "2" }]} />
      </TestI18nProvider>,
    );
    const wrapper = createWrapper(container).findTokenGroup()!;
    expect(wrapper.findTokenToggle()!.getElement()).toHaveTextContent("Custom show more");
    wrapper.findTokenToggle()!.click();
    expect(wrapper.findTokenToggle()!.getElement()).toHaveTextContent("Custom show fewer");
  });
});

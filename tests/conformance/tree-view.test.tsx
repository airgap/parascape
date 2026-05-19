// AUTO-ADAPTED from cloudscape-design/components src/tree-view/__tests__/
// tree-view.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, collapsed any<…>→any; interaction (manual-triage tier).
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

import { warnOnce } from '@cloudscape-design/component-toolkit/internal';

import ButtonDropdown from '@components/ButtonDropdown.pui';
import Icon from '@components/Icon.pui';
import Link from '@components/Link.pui';
import Popover from '@components/Popover.pui';
import { createWrapper } from '@conformance/adapter';
import TreeView from '@components/TreeView.pui';

jest.mock('@cloudscape-design/component-toolkit/internal', () => ({
  ...jest.requireActual('@cloudscape-design/component-toolkit/internal'),
  warnOnce: jest.fn(),
}));

afterEach(() => {
  (warnOnce as jest.Mock).mockReset();
});

interface Item {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  hasActions?: boolean;
  items?: Item[];
}

const defaultActions = (
  <ButtonDropdown
    items={[
      { id: 'start', text: 'Start' },
      { id: 'stop', text: 'Stop', disabled: true },
      { id: 'terminate', text: 'Terminate' },
    ]}
    ariaLabel="Control instance"
    variant="icon"
  />
);

const defaultData: Item[] = [
  {
    id: '1',
    title: 'Item 1',
    description: 'Description 1',
    hasActions: true,
    items: [
      {
        id: '1.1',
        title: 'Item 1.1',
        description: 'Description 1.1',
        hasActions: true,
      },
      {
        id: '1.2',
        title: 'Item 1.2',
        description: 'Description 1.2',
        items: [
          {
            id: '1.2.1',
            title: 'Item 1.2.1',
            description: 'Description 1.2.1',
            hasActions: true,
          },
        ],
      },
      {
        id: '1.3',
        title: 'Item 1.3',
        description: 'Description 1.3',
        items: [
          {
            id: '1.3.1',
            title: 'Item 1.3.1',
            description: 'Description 1.3.1',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: (
      <Popover content="This is a popover" dismissButton={false}>
        Item 2
      </Popover>
    ),
    hasActions: true,
    description: <Link href="#">Link in description</Link>,
  },
  {
    id: '3',
    title: 'Item 3',
    description: 'Description 3',
  },
];

const defaultProps: any = {
  items: defaultData,
  getItemId: item => item.id,
  getItemChildren: item => item.items,
  renderItem: item => ({
    icon: <Icon name="folder" />,
    content: item.title,
    secondaryContent: item.description,
    actions: item.hasActions ? defaultActions : undefined,
  }),
};

function renderTreeView(props: Partial<any> = {}) {
  const { container, rerender } = render(<TreeView {...defaultProps} {...props} />);
  const wrapper = createWrapper(container).findTreeView()!;
  return { wrapper, rerender };
}

test('should render with only content', () => {
  const { wrapper } = renderTreeView({ renderItem: item => ({ content: item.title }) });

  const items = wrapper.findItems();
  expect(items).toHaveLength(3);

  items.forEach((item, index) => {
    expect(item.findContent()?.getElement()).toHaveTextContent(`Item ${index + 1}`);
    expect(item.findIcon()).toBeNull();
    expect(item.findSecondaryContent()).toBeNull();
    expect(item.findActions()).toBeNull();
  });
});

test('should render with various slots', () => {
  const { wrapper } = renderTreeView();

  const items = wrapper.findItems();
  expect(items).toHaveLength(3);

  defaultData.forEach((data, index) => {
    const item = items[index];

    expect(item.findContent()!.getElement()).toHaveTextContent(`Item ${index + 1}`);
    expect(item.findIcon()!.getElement()).toBeVisible();
    if (data.description) {
      expect(item.findSecondaryContent()!.getElement()).toBeVisible();

      if (index !== 1) {
        // index 1 (item 2)'s description is a link
        expect(item.findSecondaryContent()!.getElement()).toHaveTextContent(`Description ${index + 1}`);
      }
    }
    if (data.hasActions) {
      expect(item.findActions()!.findButtonDropdown()!.getElement()).toBeVisible();
    }
  });
});

test('should render with other components inside', () => {
  const { wrapper } = renderTreeView();

  const item = wrapper.findItemById('2')!;

  const contentPopover = item.findContent()!.findPopover()!;
  const descriptionLink = item.findSecondaryContent()!.findLink()!;
  const actionsButtonDropdown = item.findActions()!.findButtonDropdown()!;

  expect(contentPopover.getElement()).toBeVisible();
  expect(descriptionLink.getElement()).toBeVisible();
  expect(actionsButtonDropdown.getElement()).toBeVisible();

  contentPopover.findTrigger().click();
  expect(contentPopover.findContent()?.getElement()).toHaveTextContent('This is a popover');

  actionsButtonDropdown.findNativeButton().click();
  expect(actionsButtonDropdown.findItems()).toHaveLength(3);
});

test('expand/collapse state should be controlled by expandedItems', () => {
  const expandedItems = ['1', '1.2'];
  const { wrapper, rerender } = renderTreeView({
    expandedItems,
    onItemToggle: () => {},
  });
  expect(wrapper.findItems({ expanded: true })).toHaveLength(2);

  rerender(<TreeView {...defaultProps} expandedItems={[...expandedItems, '1.3']} />);
  expect(wrapper.findItems({ expanded: true })).toHaveLength(3);

  rerender(<TreeView {...defaultProps} expandedItems={['1']} />);
  expect(wrapper.findItems({ expanded: true })).toHaveLength(1);
});

test('should warn when expandedItems is provided without onItemToggle', () => {
  renderTreeView({
    expandedItems: [],
  });

  expect(warnOnce).toHaveBeenCalledWith(
    'TreeView',
    'You provided a `expandedItems` prop without an `onItemToggle` handler. This will render a non-interactive component.'
  );
});

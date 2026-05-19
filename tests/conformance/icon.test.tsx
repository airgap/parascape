// AUTO-ADAPTED from cloudscape-design/components src/icon/__tests__/
// icon.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, firstChild→firstElementChild.
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

import Icon from '@components/Icon.pui';
import { createWrapper } from '@conformance/adapter';

import styles from '@cloudscape/icon.styles.js';

let consoleWarnSpy: jest.SpyInstance;
afterEach(() => {
  consoleWarnSpy?.mockRestore();
});

describe('Icon Component', () => {
  test('renders with accessibility-related attributes', () => {
    const { container } = render(<Icon name="calendar" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  test('renders with normal size by default', () => {
    const { container } = render(<Icon name="calendar" />);
    expect(container.firstElementChild).toHaveClass(styles['size-normal']);
  });

  test('renders with proper size class correctly', () => {
    const { container } = render(<Icon name="calendar" size="large" />);
    expect(container.firstElementChild).toHaveClass(styles['size-large']);
  });

  test('renders with proper variant class correctly', () => {
    const { container } = render(<Icon name="calendar" variant="inverted" />);
    expect(container.firstElementChild).toHaveClass(styles['variant-inverted']);
  });

  describe('size = inherit', () => {
    test('renders with proper class name', () => {
      const { container } = render(<Icon size="inherit" name="settings" />);
      expect(container.firstElementChild).toHaveClass(styles['icon-flex-height']);
    });
  });

  describe('gen ai icon', () => {
    test('filled icon renders with accessibility-related attributes', () => {
      const { container } = render(<Icon name="gen-ai" size="small" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('data-testid', 'gen-ai-filled');
      expect(svg).toHaveAttribute('focusable', 'false');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    test('only renders filled icon only for small size', () => {
      const sizes: any.Size[] = ['normal', 'medium', 'big', 'large', 'inherit'];

      sizes.forEach(size => {
        const { container } = render(<Icon name="gen-ai" size={size} />);
        const svg = container.querySelector('svg');
        expect(svg).not.toHaveAttribute('data-testid', 'gen-ai-filled');
      });
    });
  });

  describe('custom icons', () => {
    const url = 'data:image/png;base64,aaaa';
    const svg = (
      <svg className="test-svg" focusable="false">
        <circle className="test-svg-inner" cx="8" cy="8" r="7" />
      </svg>
    );

    test('should render a custom icon when a url is provided', () => {
      const { container } = render(<Icon url={url} />);
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('src', url);
      expect(img).not.toHaveAttribute('alt');
    });

    test('should render a custom icon with alternate text when a url and alt are provided', () => {
      const { container } = render(<Icon url={url} alt="custom icon" />);
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('src', url);
      expect(img).toHaveAttribute('alt', 'custom icon');
    });

    test('should render a custom icon with alternate text when a url and ariaLabel are provided', () => {
      const { container } = render(<Icon url={url} ariaLabel="custom icon" />);
      const wrapper = createWrapper(container);
      expect(wrapper.findIcon()!.getElement()).not.toHaveAttribute('aria-label');
      expect(container.querySelector('img')).toHaveAttribute('alt', 'custom icon');
    });

    test('should prefer ariaLabel when alt is also provided', () => {
      const { container } = render(<Icon url={url} alt="icon alt" ariaLabel="custom icon" />);
      const wrapper = createWrapper(container);
      expect(wrapper.findIcon()!.getElement()).not.toHaveAttribute('aria-label');
      expect(container.querySelector('img')).toHaveAttribute('alt', 'custom icon');
    });

    test('should not set aria-hidden="true" for custom svg icons if an ariaLabel is provided', () => {
      const { container } = render(<Icon svg={svg} ariaLabel="custom icon" />);
      const wrapper = createWrapper(container);
      expect(wrapper.findIcon()!.getElement()).not.toHaveAttribute('aria-hidden', 'true');
      expect(wrapper.findIcon()!.getElement()).toHaveAttribute('role', 'img');
      expect(wrapper.findIcon()!.getElement()).toHaveAttribute('aria-label', 'custom icon');
    });

    test('should render a custom icon when both name and url are provided', () => {
      const { container } = render(<Icon url={url} name="calendar" />);
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('src', url);
    });

    test('should render an svg when provided', () => {
      const { container } = render(<Icon svg={svg} />);
      const wrapper = createWrapper(container);
      expect(wrapper.findByClassName('test-svg')).not.toBeNull();
    });

    test('should set aria-hidden="true" when svg is provided', () => {
      const { container } = render(<Icon svg={svg} />);
      const wrapper = createWrapper(container);
      expect(wrapper.findIcon()!.getElement()).toHaveAttribute('aria-hidden', 'true');
    });

    test('should raise a warning when both url and svg are provided', () => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      render(<Icon url={url} svg={svg} />);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AwsUi] [Icon] You have specified both `url` and `svg`. `svg` will take precedence and `url` will be ignored.'
      );
    });

    test('should render the svg if url, name, and svg are provided', () => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { container } = render(<Icon url={url} svg={svg} name="calendar" />);
      const wrapper = createWrapper(container);
      expect(wrapper.find('img')).toBeNull();
      expect(wrapper.findByClassName('test-svg')).not.toBeNull();
    });
  });

  test('should not render anything when neither name, url, or svg are provided', () => {
    const { container } = render(<Icon />);
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  test('sets role="img" and the label on the wrapper element when provided', () => {
    const { container } = render(<Icon name="calendar" ariaLabel="Calendar" />);
    const wrapper = createWrapper(container);
    expect(wrapper.findIcon()!.getElement()).toHaveAttribute('role', 'img');
    expect(wrapper.findIcon()!.getElement()).toHaveAttribute('aria-label', 'Calendar');
  });

  test('sets role="img" and the label on the wrapper element even when ariaLabel is an empty string', () => {
    const { container } = render(<Icon name="calendar" ariaLabel="" />);
    const wrapper = createWrapper(container);
    expect(wrapper.findIcon()!.getElement()).toHaveAttribute('role', 'img');
    expect(wrapper.findIcon()!.getElement()).toHaveAttribute('aria-label', '');
  });

  describe('Prototype Pollution attack', () => {
    beforeEach(() => {
      (Object.prototype as any).attack = '<b>vulnerable</b>';
    });

    afterEach(() => {
      delete (Object.prototype as any).attack;
    });

    test('name property is not vulnerable', () => {
      const props = { name: 'attack' };
      const { container } = render(<Icon {...(props as any)} />);

      expect(container).not.toHaveTextContent('vulnerable');
    });
  });
});

describe.each(['plain', 'svg', 'url'])('native attributes: %s', type => {
  const attributes: Partial<any> =
    type === 'plain' ? { name: 'add-plus' } : type === 'svg' ? { svg: <svg /> } : { url: 'https://example.com' };
  it('adds native attributes', () => {
    const { container } = render(<Icon nativeAttributes={{ 'data-testid': 'my-test-id' }} {...attributes} />);
    expect(container.querySelector('[data-testid="my-test-id"]')).not.toBeNull();
  });
  it('concatenates class names', () => {
    const { container } = render(<Icon nativeAttributes={{ className: 'additional-class' }} {...attributes} />);
    expect(container.firstElementChild).toHaveClass(styles.icon);
    expect(container.firstElementChild).toHaveClass('additional-class');
  });
});

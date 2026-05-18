// AUTO-ADAPTED from cloudscape-design/components src/spinner/__tests__/
// spinner.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, firstChild→firstElementChild.
// JSX is compiled to the adapter h() descriptor by vitest esbuild.
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { React } from '@conformance/adapter';
import { render } from '@conformance/adapter';

import Spinner from '@components/Spinner.pui';

import styles from '@cloudscape/spinner.styles.js';

describe('Spinner', () => {
	test('Renders the size correctly', function () {
		const { container } = render(<Spinner size="big" />);
		expect(container.firstElementChild).toHaveClass(styles['size-big']);
	});

	it('Renders the variant correctly', function () {
		const { container } = render(<Spinner variant="inverted" />);
		expect(container.firstElementChild).toHaveClass(styles['variant-inverted']);
	});

	describe('native attributes', () => {
		it('adds native attributes', () => {
			const { container } = render(<Spinner nativeAttributes={{ 'data-testid': 'my-test-id' }} />);
			expect(container.querySelector('[data-testid="my-test-id"]')).not.toBeNull();
		});
		it('concatenates class names', () => {
			const { container } = render(
				<Spinner nativeAttributes={{ className: 'additional-class' }} />,
			);
			expect(container.firstElementChild).toHaveClass(styles.root);
			expect(container.firstElementChild).toHaveClass('additional-class');
		});
	});
});

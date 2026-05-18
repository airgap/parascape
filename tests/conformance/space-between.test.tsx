// AUTO-ADAPTED from cloudscape-design/components src/space-between/__tests__/
// space-between.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, firstChild→firstElementChild.
// JSX is compiled to the adapter h() descriptor by vitest esbuild.
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { React } from '@conformance/adapter';
import { render } from '@conformance/adapter';

import SpaceBetween from '@components/SpaceBetween.pui';
import { createWrapper } from '@conformance/adapter';

import styles from '@cloudscape/space-between.styles.js';

describe('SpaceBetween', () => {
  test('Renders the direction correctly', function () {
    const { container: verticalContainer } = render(
      <SpaceBetween direction="vertical" size="s">
        <button />
        <button />
      </SpaceBetween>
    );
    expect(verticalContainer.firstElementChild).toHaveClass(styles.vertical);

    const { container: horizontalContainer } = render(
      <SpaceBetween direction="horizontal" size="s">
        <button />
        <button />
      </SpaceBetween>
    );
    expect(horizontalContainer.firstElementChild).toHaveClass(styles.horizontal);
  });

  test('Renders the default direction correctly', function () {
    const { container } = render(
      <SpaceBetween size="s">
        <button />
        <button />
      </SpaceBetween>
    );
    expect(container.firstElementChild).toHaveClass(styles.vertical);
  });

  it('Renders the spacing correctly', function () {
    {
      const { container } = render(
        <SpaceBetween direction="vertical" size="s">
          <button />
          <button />
        </SpaceBetween>
      );

      expect(container.firstElementChild).toHaveClass(styles['vertical-s']);
    }
    {
      const { container } = render(
        <SpaceBetween direction="vertical" size="m">
          <button />
          <button />
        </SpaceBetween>
      );

      expect(container.firstElementChild).toHaveClass(styles['vertical-m']);
    }
    {
      const { container } = render(
        <SpaceBetween direction="vertical" size="xxl">
          <button />
          <button />
        </SpaceBetween>
      );

      expect(container.firstElementChild).toHaveClass(styles['vertical-xxl']);
    }
  });

  it('Renders its content correctly', function () {
    const { container } = render(
      <SpaceBetween direction="vertical" size="s">
        <button id="button-one" />
        <button id="button-two" />
      </SpaceBetween>
    );
    const wrapper = createWrapper(container).findSpaceBetween()!;

    const content = wrapper.findAll('button');

    expect(content).toHaveLength(2);
    expect(content[0].getElement()).toHaveAttribute('id', 'button-one');
    expect(content[1].getElement()).toHaveAttribute('id', 'button-two');
  });
});

describe('native attributes', () => {
  it('adds native attributes', () => {
    const { container } = render(
      <SpaceBetween direction="vertical" size="s" nativeAttributes={{ 'data-testid': 'my-test-id' }}>
        <button id="button-one" />
      </SpaceBetween>
    );
    expect(container.querySelector('[data-testid="my-test-id"]')).not.toBeNull();
  });
  it('concatenates class names', () => {
    const { container } = render(
      <SpaceBetween direction="vertical" size="s" nativeAttributes={{ className: 'additional-class' }}>
        <button id="button-one" />
      </SpaceBetween>
    );
    expect(container.firstElementChild).toHaveClass(styles.vertical);
    expect(container.firstElementChild).toHaveClass('additional-class');
  });
});

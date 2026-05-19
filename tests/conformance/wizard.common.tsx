// AUTO-ADAPTED from cloudscape-design/components src/wizard/__tests__/
// wizard.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../interfaces.
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

import Container from '@components/Container.pui';
import Header from '@components/Header.pui';
const { WizardProps } = __STUB; // stub: ../interfaces

export const DEFAULT_I18N_SETS = [
  {
    stepNumberLabel: stepNumber => `Step ${stepNumber}`,
    collapsedStepsLabel: (stepNumber, stepsCount) => `Step ${stepNumber} of ${stepsCount}`,
    skipToButtonLabel: (step: WizardProps.Step, stepNumber) => `Skip to ${step.title}(${stepNumber})`,
    navigationAriaLabel: 'Steps',
    cancelButton: 'Cancel',
    previousButton: 'Previous',
    nextButton: 'Next',
    submitButton: 'Create record',
    optional: 'optional',
    nextButtonLoadingAnnouncement: 'Loading next step',
    submitButtonLoadingAnnouncement: 'Submitting form',
  },
  {
    stepNumberLabel: stepNumber => `第 ${stepNumber} 步`,
    collapsedStepsLabel: (stepNumber, stepsCount) => `第 ${stepNumber} 步 / 共 ${stepsCount} 步`,
    navigationAriaLabel: 'Steps',
    cancelButton: '取消',
    previousButton: '上一步',
    nextButton: '下一步',
    submitButton: '提交',
    optional: '視需要',
    nextButtonLoadingAnnouncement: 'Lade nächsten Schritt',
    submitButtonLoadingAnnouncement: 'Schicke Formular ab',
  },
] as ReadonlyArray<WizardProps.I18nStrings>;

export const DEFAULT_STEPS = [
  {
    title: 'Step 1',
    content: (
      <>
        <Container header={<Header>Step 1, substep one</Header>}></Container>
        <Container header={<Header>Step 1, substep two</Header>}></Container>
      </>
    ),
  },
  {
    title: 'Step 2',
    content: (
      <>
        <Container header={<Header>Step 2, substep one</Header>}></Container>
        <Container header={<Header>Step 2, substep two</Header>}></Container>
      </>
    ),
    isOptional: true,
  },
  {
    title: 'Step 3',
    content: (
      <>
        <Container header={<Header>Step 3, substep one</Header>}></Container>
        <Container header={<Header>Step 3, substep two</Header>}></Container>
      </>
    ),
  },
] as ReadonlyArray<WizardProps.Step>;

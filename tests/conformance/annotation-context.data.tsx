// AUTO-ADAPTED from cloudscape-design/components src/annotation-context/__tests__/
// annotation-context.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../../../lib/components/annotation-context/interfaces; stubbed unresolvable ../../../lib/components/tutorial-panel/interfaces.
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

const { AnnotationContextProps } = __STUB; // stub: ../../../lib/components/annotation-context/interfaces
const { TutorialPanelProps } = __STUB; // stub: ../../../lib/components/tutorial-panel/interfaces

export const i18nStrings: AnnotationContextProps.I18nStrings = {
  nextButtonText: 'NEXT_BUTTON_TEST',
  previousButtonText: 'PREVIOUS_BUTTON_TEST',
  finishButtonText: 'FINISH_BUTTON_TEST',
  labelDismissAnnotation: 'DISMISS_ANNOTATION_TEST',
  labelHotspot: (openState: boolean, stepIndex: number, totalStepCount: number) =>
    openState
      ? `CLOSE_HOTSPOT_TEST_FOR_STEP_${stepIndex + 1}_OF_${totalStepCount}_TEST`
      : `OPEN_HOTSPOT_TEST_FOR_STEP_${stepIndex + 1}_OF_${totalStepCount}_TEST`,
  stepCounterText: (stepIndex: number, totalStepCount: number) => `STEP_${stepIndex + 1}_OF_${totalStepCount}_TEST`,
  taskTitle: (taskIndex: number, taskTitle: string) => `TASK_${taskIndex + 1}_${taskTitle}`,
};

export function getTutorial(): TutorialPanelProps.Tutorial {
  return {
    title: 'TUTORIAL_TITLE_TEST',
    description: 'TUTORIAL_DESCRIPTION_TEST',
    completed: false,
    completedScreenDescription: 'COMPLETED_SCREEN_DESCRIPTION_TEST',
    tasks: [
      {
        title: 'FIRST_TASK_TEST',
        steps: [{ title: 'FIRST_STEP_TEST', content: <div>First step content</div>, hotspotId: 'first-hotspot' }],
      },
      {
        title: 'SECOND_TASK_TEST',
        steps: [
          { title: 'SECOND_STEP_TEST', content: <div>Second step content</div>, hotspotId: 'second-hotspot' },
          { title: 'THIRD_STEP_TEST', content: <div>Third step content</div>, hotspotId: 'third-hotspot' },
        ],
      },
    ],
  };
}

export function getTutorialWithMultipleStepsPerHotspot(): TutorialPanelProps.Tutorial {
  return {
    title: 'TUTORIAL_TITLE_TEST',
    description: 'TUTORIAL_DESCRIPTION_TEST',
    completed: false,
    completedScreenDescription: 'COMPLETED_SCREEN_DESCRIPTION_TEST',
    tasks: [
      {
        title: 'FIRST_TASK_TEST',
        steps: [
          { title: 'FIRST_STEP_TEST', content: <div>First step content</div>, hotspotId: 'first-hotspot' },
          { title: 'SECOND_STEP_TEST', content: <div>Second step content</div>, hotspotId: 'first-hotspot' },
        ],
      },
      {
        title: 'SECOND_TASK_TEST',
        steps: [
          { title: 'THIRD_STEP_TEST', content: <div>Third step content</div>, hotspotId: 'second-hotspot' },
          { title: 'FOURTH_STEP_TEST', content: <div>Fourth step content</div>, hotspotId: 'second-hotspot' },
          { title: 'FIFTH_STEP_TEST', content: <div>Fifth step content</div>, hotspotId: 'second-hotspot' },
        ],
      },
    ],
  };
}

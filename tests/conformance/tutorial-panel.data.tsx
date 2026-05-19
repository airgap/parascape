// AUTO-ADAPTED from cloudscape-design/components src/tutorial-panel/__tests__/
// tutorial-panel.test.tsx via tests/conformance/codemod.mjs.
// Mechanical rewrites only: component import → .pui, createWrapper +
// render → adapter, styles → vendored, stubbed unresolvable ../../../lib/components/tutorial-panel/interfaces.
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

const { TutorialPanelProps } = __STUB; // stub: ../../../lib/components/tutorial-panel/interfaces

export const i18nStrings: TutorialPanelProps.I18nStrings = {
  loadingText: 'LOADING',

  tutorialListTitle: 'TUTORIAL_LIST_TITLE',
  tutorialListDescription: <span>TUTORIAL_LIST_DESCRIPTION</span>,
  tutorialListDownloadLinkText: 'DOWNLOAD_LINK_TEXT',
  labelTutorialListDownloadLink: 'DOWNLOAD_THIS_TUTORIAL_LINK',

  tutorialCompletedText: 'TUTORIAL_COMPLETED',
  learnMoreLinkText: 'LEARN_MORE_LINK_TEXT',
  labelLearnMoreLink: 'LEARN_MORE_ABOUT_TUTORIA',

  startTutorialButtonText: 'START_TUTORIAL',
  restartTutorialButtonText: 'RESTART_TUTORIAL',

  completionScreenTitle: 'COMPLETION_SCREEN_TITLE',

  feedbackLinkText: 'FEEDBACK_LINK_TEXT',
  dismissTutorialButtonText: 'DISMISS_TUTORIAL_BUTTON',

  taskTitle: (taskIndex: number, taskTitle: string) => `TASK_${taskIndex + 1}_${taskTitle}`,
  stepTitle: (stepIndex: number, stepTitle: string) => `STEP_${stepIndex + 1}_${stepTitle}`,

  labelExitTutorial: 'EXIT_TUTORIAL',
  labelTotalSteps: (totalStepCount: number) => `TOTAL_STEPS_${totalStepCount}`,
  labelLearnMoreExternalIcon: 'LEARN_MORE_ICON_LABEL',

  labelsTaskStatus: {
    pending: 'LABEL_PENDING',
    'in-progress': 'LABEL_IN_PROGRESS',
    success: 'LABEL_SUCCESS',
  },
};

export function getTutorials(): TutorialPanelProps.Tutorial[] {
  return [
    {
      title: 'TUTORIAL_1_TITLE_TEST',
      description: 'TUTORIAL_DESCRIPTION_TEST',
      learnMoreUrl: 'LEARN_MORE_URL',
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
            { title: 'SECOND_STEP_TEST', content: <div>Second step content</div>, hotspotId: 'third-hotspot' },
            { title: 'THIRD_STEP_TEST', content: <div>Third step content</div>, hotspotId: 'second-hotspot' },
          ],
        },
      ],
    },
    {
      title: 'TUTORIAL_2_TITLE_TEST',
      description: 'TUTORIAL_DESCRIPTION_TEST',
      completed: true,
      completedScreenDescription: 'COMPLETED_SCREEN_DESCRIPTION_TEST',
      prerequisitesAlert: 'PREREQUISITES_ALERT_TEXT',
      prerequisitesNeeded: true,
      tasks: [
        {
          title: 'FIRST_TASK_TEST',
          steps: [{ title: 'FIRST_STEP_TEST', content: <div>First step content</div>, hotspotId: 'first-hotspot' }],
        },
        {
          title: 'SECOND_TASK_TEST',
          steps: [
            { title: 'SECOND_STEP_TEST', content: <div>Second step content</div>, hotspotId: 'third-hotspot' },
            { title: 'THIRD_STEP_TEST', content: <div>Third step content</div>, hotspotId: 'second-hotspot' },
          ],
        },
      ],
    },
  ];
}

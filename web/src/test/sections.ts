/**
 * Helpers for the Section* component tests: the shared props builder and DOM lookups on
 * QuestionCard's class-based expanded/answered state.
 */
import { screen } from '@testing-library/react';

import type { SurveySectionProps } from '../components/sectionProps.ts';
import { completeSurveyData, makeProject } from './fixtures/project.ts';

/** Complete answers, editable, validation off, default two-collaborator project. */
export function sectionProps(overrides: Partial<SurveySectionProps> = {}): SurveySectionProps {
  return {
    formData: completeSurveyData(),
    handleChange: vi.fn(),
    isReadOnly: false,
    showValidation: false,
    project: makeProject(),
    ...overrides,
  };
}

/** The `.question-card` whose title (or any text inside it) is `text`. */
export function cardFor(text: string | RegExp): HTMLElement {
  const card = screen.getByText(text).closest('.question-card');
  if (!(card instanceof HTMLElement)) throw new Error(`No question card contains "${text}"`);
  return card;
}

export const isExpanded = (card: HTMLElement) => card.classList.contains('expanded');
export const isAnswered = (card: HTMLElement) => card.classList.contains('answered');

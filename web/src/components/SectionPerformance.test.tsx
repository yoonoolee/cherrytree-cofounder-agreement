import { fireEvent, render, screen } from '@testing-library/react';
import { FIELDS, PERFORMANCE_CONSEQUENCES } from '@cherrytree/shared';

import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { makeSurveyData } from '../test/fixtures/project.ts';
import { cardFor, isAnswered, isExpanded, sectionProps } from '../test/sections.ts';
import SectionPerformance from './SectionPerformance.tsx';

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ currentUser: { id: 'user_admin' } }),
}));

const CONSEQUENCES = QUESTION_CONFIG[FIELDS.PERFORMANCE_CONSEQUENCES].question;
const REMEDY = QUESTION_CONFIG[FIELDS.REMEDY_PERIOD_DAYS].question;
const WITH_CAUSE = QUESTION_CONFIG[FIELDS.TERMINATION_WITH_CAUSE].question;
const NOTICE = 'How many days is the notice period if a Cofounder wishes to voluntarily leave?';

const numberInput = (card: HTMLElement) => card.querySelector('input[type="number"]')!;

describe('SectionPerformance', () => {
  it('renders the heading and the four question cards without a project', () => {
    render(<SectionPerformance {...sectionProps({ project: undefined })} />);
    expect(
      screen.getByRole('heading', { name: 'Cofounder Performance & Departure' }),
    ).toBeInTheDocument();
    for (const question of [CONSEQUENCES, REMEDY, WITH_CAUSE, NOTICE]) {
      expect(cardFor(question)).toBeInTheDocument();
    }
  });

  it('shows day previews and marks complete answers', () => {
    render(<SectionPerformance {...sectionProps()} />);
    expect(cardFor(REMEDY).querySelector('.card-answer-preview')).toHaveTextContent('30 days');
    expect(cardFor(NOTICE).querySelector('.card-answer-preview')).toHaveTextContent('30 days');
    for (const question of [CONSEQUENCES, REMEDY, WITH_CAUSE, NOTICE]) {
      expect(isAnswered(cardFor(question))).toBe(true);
    }
    expect(isExpanded(cardFor(CONSEQUENCES))).toBe(true);
  });

  it('opens on the first unanswered field and flags it when validation is on', () => {
    const formData = makeSurveyData({
      performanceConsequences: ['Warning'],
      terminationWithCause: ['Fraud'],
      voluntaryNoticeDays: '14',
    });
    render(<SectionPerformance {...sectionProps({ formData, showValidation: true })} />);
    expect(isExpanded(cardFor(REMEDY))).toBe(true);
    expect(isAnswered(cardFor(REMEDY))).toBe(false);
    expect(cardFor(REMEDY)).toHaveTextContent('* Required');
    expect(cardFor(NOTICE)).not.toHaveTextContent('* Required');
  });

  it('accepts only non-negative whole numbers for the remedy period', () => {
    const props = sectionProps(); // remedyPeriodDays '30'
    render(<SectionPerformance {...props} />);
    const input = numberInput(cardFor(REMEDY));
    fireEvent.change(input, { target: { value: '1.5' } });
    expect(props.handleChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '45' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.REMEDY_PERIOD_DAYS, '45');
    fireEvent.change(input, { target: { value: '' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.REMEDY_PERIOD_DAYS, '');
  });

  it('writes the notice period as typed', () => {
    const props = sectionProps({ formData: makeSurveyData() });
    render(<SectionPerformance {...props} />);
    fireEvent.change(numberInput(cardFor(NOTICE)), { target: { value: '60' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.VOLUNTARY_NOTICE_DAYS, '60');
  });

  it('writes a checkbox choice through handleChange', () => {
    const props = sectionProps({ formData: makeSurveyData() });
    render(<SectionPerformance {...props} />);
    const first = PERFORMANCE_CONSEQUENCES[0]!;
    fireEvent.click(screen.getByLabelText(first));
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.PERFORMANCE_CONSEQUENCES, [first]);
  });

  it('advances through the cards on Enter', () => {
    render(<SectionPerformance {...sectionProps()} />);
    fireEvent.keyDown(cardFor(CONSEQUENCES), { key: 'Enter' });
    expect(isExpanded(cardFor(REMEDY))).toBe(true);
    fireEvent.keyDown(cardFor(REMEDY), { key: 'Enter' });
    expect(isExpanded(cardFor(WITH_CAUSE))).toBe(true);
    fireEvent.keyDown(cardFor(WITH_CAUSE), { key: 'Enter' });
    expect(isExpanded(cardFor(NOTICE))).toBe(true);
  });

  it('disables every input when read-only', () => {
    const { container } = render(<SectionPerformance {...sectionProps({ isReadOnly: true })} />);
    for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
  });
});

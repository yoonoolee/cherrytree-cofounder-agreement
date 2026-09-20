import { fireEvent, render, screen } from '@testing-library/react';
import { FIELDS } from '@cherrytree/shared';

import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { ADMIN_ID, MEMBER_ID, makeSurveyData } from '../test/fixtures/project.ts';
import { cardFor, isAnswered, isExpanded, sectionProps } from '../test/sections.ts';
import SectionFinal from './SectionFinal.tsx';

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ currentUser: { id: 'user_admin' } }),
}));

const DISPUTE = QUESTION_CONFIG[FIELDS.DISPUTE_RESOLUTION].question;
const GOVERNING_LAW = QUESTION_CONFIG[FIELDS.GOVERNING_LAW].question;
const AMENDMENT = QUESTION_CONFIG[FIELDS.AMENDMENT_PROCESS].question;
const REVIEW_MONTHS = 'How often (in months) should this agreement be reviewed by the cofounders?';
const PERIODIC_REVIEW = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW].question;
const AMENDMENT_REQUEST = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST].question;
const ENTIRE_AGREEMENT = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT].question;
const SEVERABILITY = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_SEVERABILITY].question;
const ALL = [
  DISPUTE,
  GOVERNING_LAW,
  AMENDMENT,
  REVIEW_MONTHS,
  PERIODIC_REVIEW,
  AMENDMENT_REQUEST,
  ENTIRE_AGREEMENT,
  SEVERABILITY,
];

describe('SectionFinal', () => {
  it('renders the heading, the eight cards and the attorney note', () => {
    render(<SectionFinal {...sectionProps()} />);
    expect(screen.getByRole('heading', { name: 'General Provisions' })).toBeInTheDocument();
    for (const question of ALL) expect(cardFor(question)).toBeInTheDocument();
    expect(screen.getByText(/reviewed by a qualified attorney/)).toBeInTheDocument();
  });

  it('marks every card answered and opens the first one when all answers are in', () => {
    render(<SectionFinal {...sectionProps()} />);
    for (const question of ALL) expect(isAnswered(cardFor(question))).toBe(true);
    expect(isExpanded(cardFor(DISPUTE))).toBe(true);
    expect(cardFor(REVIEW_MONTHS).querySelector('.card-answer-preview')).toHaveTextContent(
      'Every 12 months',
    );
  });

  it('opens on the first unanswered field, acknowledgments included', () => {
    const formData = makeSurveyData({
      ...sectionProps().formData,
      acknowledgeEntireAgreement: { [ADMIN_ID]: true, [MEMBER_ID]: false },
    });
    render(<SectionFinal {...sectionProps({ formData })} />);
    expect(isExpanded(cardFor(ENTIRE_AGREEMENT))).toBe(true);
    expect(isAnswered(cardFor(ENTIRE_AGREEMENT))).toBe(false);
  });

  it('writes the review frequency and resets the periodic-review acknowledgment', () => {
    const props = sectionProps();
    render(<SectionFinal {...props} />);
    const input = cardFor(REVIEW_MONTHS).querySelector('input[type="number"]')!;
    fireEvent.change(input, { target: { value: '6' } });
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.REVIEW_FREQUENCY_MONTHS, '6');
    expect(props.handleChange).toHaveBeenNthCalledWith(2, FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW, {});
    fireEvent.change(input, { target: { value: '-3' } });
    expect(props.handleChange).toHaveBeenCalledTimes(2);
  });

  it('shows "* Required" on an empty review frequency when validation is on', () => {
    const formData = makeSurveyData({ ...sectionProps().formData, reviewFrequencyMonths: '' });
    render(<SectionFinal {...sectionProps({ formData, showValidation: true })} />);
    expect(cardFor(REVIEW_MONTHS)).toHaveTextContent('* Required');
    expect(isExpanded(cardFor(REVIEW_MONTHS))).toBe(true);
  });

  it('writes a radio choice through handleChange', () => {
    const props = sectionProps({ formData: makeSurveyData() });
    render(<SectionFinal {...props} />);
    fireEvent.click(cardFor(DISPUTE).querySelector('input[type="radio"]')!);
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.DISPUTE_RESOLUTION, expect.any(String));
  });

  it('advances through the cards on Enter', () => {
    render(<SectionFinal {...sectionProps()} />);
    for (let i = 0; i < ALL.length - 1; i++) {
      fireEvent.keyDown(cardFor(ALL[i]!), { key: 'Enter' });
      expect(isExpanded(cardFor(ALL[i + 1]!))).toBe(true);
    }
  });

  it('disables every input when read-only', () => {
    const { container } = render(<SectionFinal {...sectionProps({ isReadOnly: true })} />);
    for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
  });
});

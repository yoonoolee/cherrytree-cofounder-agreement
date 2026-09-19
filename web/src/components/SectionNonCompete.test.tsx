import { fireEvent, render, screen } from '@testing-library/react';
import { FIELDS } from '@cherrytree/shared';

import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { ADMIN_ID, makeSurveyData } from '../test/fixtures/project.ts';
import { cardFor, isAnswered, isExpanded, sectionProps } from '../test/sections.ts';
import SectionNonCompete from './SectionNonCompete.tsx';

const mocks = vi.hoisted(() => ({ currentUser: { id: 'user_admin' } as { id: string } | null }));

vi.mock('../contexts/UserContext', () => ({
  useUser: () => ({ currentUser: mocks.currentUser }),
}));

const CONFIDENTIALITY = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY].question;
const NON_COMPETE = QUESTION_CONFIG[FIELDS.NON_COMPETE_DURATION].question;
const NON_SOLICIT = QUESTION_CONFIG[FIELDS.NON_SOLICIT_DURATION].question;

beforeEach(() => {
  mocks.currentUser = { id: ADMIN_ID };
});

describe('SectionNonCompete', () => {
  it('renders the heading and the three question cards', () => {
    render(<SectionNonCompete {...sectionProps()} />);
    expect(
      screen.getByRole('heading', { name: 'Confidentiality, Non-Competition & Non-Solicitation' }),
    ).toBeInTheDocument();
    for (const question of [CONFIDENTIALITY, NON_COMPETE, NON_SOLICIT]) {
      expect(cardFor(question)).toBeInTheDocument();
    }
  });

  it('marks every card answered and expands the first one when all answers are in', () => {
    render(<SectionNonCompete {...sectionProps()} />);
    expect(isAnswered(cardFor(CONFIDENTIALITY))).toBe(true);
    expect(isAnswered(cardFor(NON_COMPETE))).toBe(true);
    expect(isAnswered(cardFor(NON_SOLICIT))).toBe(true);
    expect(isExpanded(cardFor(CONFIDENTIALITY))).toBe(true);
    expect(isExpanded(cardFor(NON_COMPETE))).toBe(false);
  });

  it('opens on the first unanswered question', () => {
    render(
      <SectionNonCompete
        {...sectionProps({ formData: makeSurveyData({ nonSolicitDuration: '1 year' }) })}
      />,
    );
    // Acknowledgment map is empty and the non-compete duration is '' → both unanswered.
    expect(isAnswered(cardFor(CONFIDENTIALITY))).toBe(false);
    expect(isExpanded(cardFor(CONFIDENTIALITY))).toBe(true);
    expect(isAnswered(cardFor(NON_SOLICIT))).toBe(true);
  });

  it('treats a partially ticked acknowledgment as unanswered', () => {
    const formData = makeSurveyData({
      acknowledgeConfidentiality: { [ADMIN_ID]: true, other: false },
    });
    render(<SectionNonCompete {...sectionProps({ formData })} />);
    expect(isAnswered(cardFor(CONFIDENTIALITY))).toBe(false);
  });

  it('shows the "Other" text instead of the literal option in the preview', () => {
    const formData = makeSurveyData({
      nonCompeteDuration: 'Other',
      nonCompeteDurationOther: '18 months',
    });
    render(<SectionNonCompete {...sectionProps({ formData })} />);
    expect(cardFor(NON_COMPETE).querySelector('.card-answer-preview')).toHaveTextContent(
      '18 months',
    );
  });

  it('expands a collapsed card on header click and collapses it again', () => {
    render(<SectionNonCompete {...sectionProps()} />);
    const header = screen.getByText(NON_COMPETE);
    fireEvent.click(header);
    expect(isExpanded(cardFor(NON_COMPETE))).toBe(true);
    expect(isExpanded(cardFor(CONFIDENTIALITY))).toBe(false);
    fireEvent.click(header);
    expect(isExpanded(cardFor(NON_COMPETE))).toBe(false);
  });

  it('advances to the next card on Enter', () => {
    render(<SectionNonCompete {...sectionProps()} />);
    fireEvent.keyDown(cardFor(CONFIDENTIALITY), { key: 'Enter' });
    expect(isExpanded(cardFor(NON_COMPETE))).toBe(true);
    fireEvent.keyDown(cardFor(NON_COMPETE), { key: 'Enter' });
    expect(isExpanded(cardFor(NON_SOLICIT))).toBe(true);
    fireEvent.keyDown(cardFor(NON_SOLICIT), { key: 'Enter' });
    expect(isExpanded(cardFor(NON_SOLICIT))).toBe(true); // last card stays put
  });

  it('writes a radio choice through handleChange', () => {
    const props = sectionProps({ formData: makeSurveyData() });
    render(<SectionNonCompete {...props} />);
    fireEvent.click(cardFor(NON_COMPETE).querySelector('input[value="2 years"]')!);
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.NON_COMPETE_DURATION, '2 years');
  });

  it('lets only the signed-in collaborator tick their acknowledgment', () => {
    const props = sectionProps({ formData: makeSurveyData() });
    render(<SectionNonCompete {...props} />);
    const boxes = cardFor(CONFIDENTIALITY).querySelectorAll('input[type="checkbox"]');
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).toBeEnabled();
    expect(boxes[1]).toBeDisabled();
    fireEvent.click(boxes[0]!);
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY, {
      [ADMIN_ID]: true,
    });
  });

  it('disables every input when read-only', () => {
    const { container } = render(<SectionNonCompete {...sectionProps({ isReadOnly: true })} />);
    for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
  });
});

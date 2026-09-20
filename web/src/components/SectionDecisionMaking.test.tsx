import { fireEvent, render, screen } from '@testing-library/react';
import { FIELDS, TIE_RESOLUTION_OPTIONS } from '@cherrytree/shared';

import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { ADMIN_ID, MEMBER_ID, makeSurveyData } from '../test/fixtures/project.ts';
import { cardFor, isAnswered, isExpanded, sectionProps } from '../test/sections.ts';
import SectionDecisionMaking from './SectionDecisionMaking.tsx';

const mocks = vi.hoisted(() => ({ currentUser: { id: 'user_admin' } as { id: string } | null }));

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ currentUser: mocks.currentUser }),
}));

const MAJOR_DECISIONS = QUESTION_CONFIG[FIELDS.MAJOR_DECISIONS].question;
const VOTING_POWER = QUESTION_CONFIG[FIELDS.EQUITY_VOTING_POWER].question;
const TIE = QUESTION_CONFIG[FIELDS.TIE_RESOLUTION].question;
const SHOTGUN = QUESTION_CONFIG[FIELDS.INCLUDE_SHOTGUN_CLAUSE].question;
const MEDIATION = TIE_RESOLUTION_OPTIONS[1]!;
const SHOTGUN_ACK =
  'I acknowledge that no partial buy/sell is allowed and payment is due in cash within 60 days of acceptance.';

const radio = (card: HTMLElement, value: string) =>
  card.querySelector(`input[type="radio"][value="${value}"]`)!;

beforeEach(() => {
  mocks.currentUser = { id: ADMIN_ID };
});

describe('SectionDecisionMaking', () => {
  it('renders the heading and the four question cards', () => {
    render(<SectionDecisionMaking {...sectionProps()} />);
    expect(screen.getByRole('heading', { name: 'Decision-Making & Voting' })).toBeInTheDocument();
    for (const question of [MAJOR_DECISIONS, VOTING_POWER, TIE, SHOTGUN]) {
      expect(cardFor(question)).toBeInTheDocument();
    }
  });

  it('opens on the first unanswered field', () => {
    const formData = makeSurveyData({ majorDecisions: ['Raising capital'] });
    render(<SectionDecisionMaking {...sectionProps({ formData })} />);
    expect(isAnswered(cardFor(MAJOR_DECISIONS))).toBe(true);
    expect(isExpanded(cardFor(VOTING_POWER))).toBe(true);
  });

  it('treats an empty major-decisions list as unanswered', () => {
    render(<SectionDecisionMaking {...sectionProps({ formData: makeSurveyData() })} />);
    expect(isAnswered(cardFor(MAJOR_DECISIONS))).toBe(false);
  });

  it('choosing a tie resolution initializes its acknowledgment for every collaborator', () => {
    const props = sectionProps({ formData: makeSurveyData() });
    render(<SectionDecisionMaking {...props} />);
    fireEvent.click(radio(cardFor(TIE), MEDIATION));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.TIE_RESOLUTION, MEDIATION);
    expect(props.handleChange).toHaveBeenNthCalledWith(2, FIELDS.ACKNOWLEDGE_TIE_RESOLUTION, {
      [ADMIN_ID]: false,
      [MEMBER_ID]: false,
    });
  });

  it('clicking the chosen tie resolution again clears it and nulls the acknowledgment', () => {
    const props = sectionProps({ formData: makeSurveyData({ tieResolution: MEDIATION }) });
    render(<SectionDecisionMaking {...props} />);
    fireEvent.click(radio(cardFor(TIE), MEDIATION));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.TIE_RESOLUTION, '');
    expect(props.handleChange).toHaveBeenNthCalledWith(2, FIELDS.ACKNOWLEDGE_TIE_RESOLUTION, null);
  });

  it('shows the tie acknowledgment only once a resolution is chosen, and only the signed-in collaborator can tick it', () => {
    const props = sectionProps({
      formData: makeSurveyData({
        tieResolution: MEDIATION,
        acknowledgeTieResolution: { [ADMIN_ID]: false, [MEMBER_ID]: false },
      }),
      showValidation: true,
    });
    render(<SectionDecisionMaking {...props} />);
    const card = cardFor(TIE);
    expect(card).toHaveTextContent(`shall be resolved by ${MEDIATION}.`);
    expect(card).toHaveTextContent('* Required');
    const boxes = card.querySelectorAll('input[type="checkbox"]');
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).toBeEnabled();
    expect(boxes[1]).toBeDisabled();
    fireEvent.click(boxes[0]!);
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.ACKNOWLEDGE_TIE_RESOLUTION, {
      [ADMIN_ID]: true,
      [MEMBER_ID]: false,
    });
  });

  it('hides the tie acknowledgment while no resolution is chosen', () => {
    render(<SectionDecisionMaking {...sectionProps({ formData: makeSurveyData() })} />);
    expect(cardFor(TIE).querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
  });

  it('shotgun "Yes" initializes its acknowledgment; "No" nulls it', () => {
    const props = sectionProps({ formData: makeSurveyData() });
    render(<SectionDecisionMaking {...props} />);
    fireEvent.click(radio(cardFor(SHOTGUN), 'Yes'));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.INCLUDE_SHOTGUN_CLAUSE, 'Yes');
    expect(props.handleChange).toHaveBeenNthCalledWith(2, FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE, {
      [ADMIN_ID]: false,
      [MEMBER_ID]: false,
    });
    fireEvent.click(radio(cardFor(SHOTGUN), 'No'));
    expect(props.handleChange).toHaveBeenNthCalledWith(3, FIELDS.INCLUDE_SHOTGUN_CLAUSE, 'No');
    expect(props.handleChange).toHaveBeenNthCalledWith(4, FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE, null);
  });

  it('shows the shotgun acknowledgment under "Yes" with the admin tag', () => {
    render(<SectionDecisionMaking {...sectionProps()} />);
    const card = cardFor(SHOTGUN);
    expect(card).toHaveTextContent(SHOTGUN_ACK);
    expect(card.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(card).toHaveTextContent('Ada Lovelace(Admin)');
    expect(card).toHaveTextContent('Grace Hopper');
  });

  it('ignores radio clicks and disables every input when read-only', () => {
    const props = sectionProps({ isReadOnly: true });
    const { container } = render(<SectionDecisionMaking {...props} />);
    fireEvent.click(radio(cardFor(SHOTGUN), 'No'));
    expect(props.handleChange).not.toHaveBeenCalled();
    for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
  });
});

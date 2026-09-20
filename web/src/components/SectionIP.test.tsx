import { fireEvent, render, screen } from '@testing-library/react';
import { FIELDS } from '@cherrytree/shared';

import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { ADMIN_ID, MEMBER_ID, acknowledgedBy, makeSurveyData } from '../test/fixtures/project.ts';
import { cardFor, isAnswered, isExpanded, sectionProps } from '../test/sections.ts';
import SectionIP from './SectionIP.tsx';

const mocks = vi.hoisted(() => ({ currentUser: { id: 'user_admin' } as { id: string } | null }));

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ currentUser: mocks.currentUser }),
}));

const PRE_EXISTING_IP = QUESTION_CONFIG[FIELDS.HAS_PRE_EXISTING_IP].question;
const IP_ASSIGNMENT = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT].question;
const IP_OWNERSHIP = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_IP_OWNERSHIP].question;

beforeEach(() => {
  mocks.currentUser = { id: ADMIN_ID };
});

describe('SectionIP', () => {
  it('renders the heading and the three question cards', () => {
    render(<SectionIP {...sectionProps()} />);
    expect(screen.getByRole('heading', { name: 'IP & Ownership of Work' })).toBeInTheDocument();
    for (const question of [PRE_EXISTING_IP, IP_ASSIGNMENT, IP_OWNERSHIP]) {
      expect(cardFor(question)).toBeInTheDocument();
    }
  });

  it('opens on the first card and leaves the not-applicable assignment card unanswered', () => {
    // completeSurveyData: hasPreExistingIP 'No', acknowledgeIPAssignment {} (never initialized).
    render(<SectionIP {...sectionProps()} />);
    expect(isExpanded(cardFor(PRE_EXISTING_IP))).toBe(true);
    expect(isAnswered(cardFor(PRE_EXISTING_IP))).toBe(true);
    expect(isAnswered(cardFor(IP_ASSIGNMENT))).toBe(false);
    expect(isAnswered(cardFor(IP_OWNERSHIP))).toBe(true);
  });

  it('only renders the assignment checkboxes once pre-existing IP is "Yes"', () => {
    const { rerender } = render(<SectionIP {...sectionProps()} />);
    expect(cardFor(IP_ASSIGNMENT).querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    rerender(
      <SectionIP
        {...sectionProps({
          formData: makeSurveyData({
            hasPreExistingIP: 'Yes',
            acknowledgeIPAssignment: acknowledgedBy([ADMIN_ID, MEMBER_ID]),
          }),
        })}
      />,
    );
    expect(cardFor(IP_ASSIGNMENT).querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(isAnswered(cardFor(IP_ASSIGNMENT))).toBe(true);
  });

  it('opens on the first unanswered acknowledgment', () => {
    const formData = makeSurveyData({
      hasPreExistingIP: 'No',
      acknowledgeIPOwnership: { [ADMIN_ID]: true, [MEMBER_ID]: false },
    });
    render(<SectionIP {...sectionProps({ formData })} />);
    expect(isExpanded(cardFor(IP_OWNERSHIP))).toBe(true);
    expect(isAnswered(cardFor(IP_OWNERSHIP))).toBe(false);
  });

  it('initializes the assignment acknowledgment when "Yes" is chosen and nulls it on "No"', () => {
    const props = sectionProps({ formData: makeSurveyData() });
    render(<SectionIP {...props} />);
    fireEvent.click(cardFor(PRE_EXISTING_IP).querySelector('input[value="Yes"]')!);
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.HAS_PRE_EXISTING_IP, 'Yes');
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT, {
      [ADMIN_ID]: false,
      [MEMBER_ID]: false,
    });
    fireEvent.click(cardFor(PRE_EXISTING_IP).querySelector('input[value="No"]')!);
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.HAS_PRE_EXISTING_IP, 'No');
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT, null);
  });

  it('advances through the cards on Enter', () => {
    render(<SectionIP {...sectionProps()} />);
    fireEvent.keyDown(cardFor(PRE_EXISTING_IP), { key: 'Enter' });
    expect(isExpanded(cardFor(IP_ASSIGNMENT))).toBe(true);
    fireEvent.keyDown(cardFor(IP_ASSIGNMENT), { key: 'Enter' });
    expect(isExpanded(cardFor(IP_OWNERSHIP))).toBe(true);
  });

  it('disables every input when read-only', () => {
    const { container } = render(<SectionIP {...sectionProps({ isReadOnly: true })} />);
    for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { FIELDS } from '@cherrytree/shared';

import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { ADMIN_ID, MEMBER_ID, makeSurveyData } from '../test/fixtures/project.ts';
import { cardFor, isAnswered, isExpanded, sectionProps } from '../test/sections.ts';
import SectionEquityVesting from './SectionEquityVesting.tsx';

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ currentUser: { id: 'user_admin' } }),
}));

const START_DATE = QUESTION_CONFIG[FIELDS.VESTING_START_DATE].question;
const SCHEDULE = QUESTION_CONFIG[FIELDS.VESTING_SCHEDULE].question;
const CLIFF = QUESTION_CONFIG[FIELDS.CLIFF_PERCENTAGE].question;
const ACCELERATION = QUESTION_CONFIG[FIELDS.ACCELERATION_TRIGGER].question;
const SELL_NOTICE =
  'If a cofounder wants to sell their shares, how many days notice do they need to provide the Board and shareholders?';
const BUYBACK =
  'If a cofounder resigns, how many days does the company have to buy back the shares?';
const FORFEITURE = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_FORFEITURE].question;
const DISPOSAL = QUESTION_CONFIG[FIELDS.VESTED_SHARES_DISPOSAL].question;
const ALL = [START_DATE, SCHEDULE, CLIFF, ACCELERATION, SELL_NOTICE, BUYBACK, FORFEITURE, DISPOSAL];
const PROTECTION = 'For how long after the acquisition should this protection apply?';

const radio = (card: HTMLElement, value: string) =>
  card.querySelector(`input[type="radio"][value="${value}"]`)!;

describe('SectionEquityVesting', () => {
  it('renders the heading and the eight cards', () => {
    render(<SectionEquityVesting {...sectionProps()} />);
    expect(screen.getByRole('heading', { name: 'Vesting Schedule' })).toBeInTheDocument();
    for (const question of ALL) expect(cardFor(question)).toBeInTheDocument();
  });

  it('marks every card answered and opens the first one when all answers are in', () => {
    render(<SectionEquityVesting {...sectionProps()} />);
    for (const question of ALL) expect(isAnswered(cardFor(question))).toBe(true);
    expect(isExpanded(cardFor(START_DATE))).toBe(true);
    expect(cardFor(CLIFF).querySelector('.card-answer-preview')).toHaveTextContent('25%');
    expect(cardFor(SELL_NOTICE).querySelector('.card-answer-preview')).toHaveTextContent('30 days');
  });

  it('opens on the first unanswered field', () => {
    const formData = makeSurveyData({
      vestingStartDate: '2026-01-01',
      vestingSchedule: 'Immediate',
    });
    render(<SectionEquityVesting {...sectionProps({ formData, showValidation: true })} />);
    expect(isExpanded(cardFor(CLIFF))).toBe(true);
    expect(cardFor(CLIFF)).toHaveTextContent('* Required');
  });

  it('treats a partially ticked forfeiture acknowledgment as unanswered', () => {
    const formData = makeSurveyData({
      ...sectionProps().formData,
      acknowledgeForfeiture: { [ADMIN_ID]: true, [MEMBER_ID]: false },
    });
    render(<SectionEquityVesting {...sectionProps({ formData })} />);
    expect(isAnswered(cardFor(FORFEITURE))).toBe(false);
  });

  it('shows the cliff as a percentage and writes the bare number within 0–100', () => {
    const props = sectionProps();
    render(<SectionEquityVesting {...props} />);
    const input = screen.getByPlaceholderText('25%');
    expect(input).toHaveValue('25%');
    fireEvent.change(input, { target: { value: '30%' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.CLIFF_PERCENTAGE, '30');
    vi.mocked(props.handleChange).mockClear();
    fireEvent.change(input, { target: { value: '150%' } });
    fireEvent.change(input, { target: { value: 'ab%' } });
    expect(props.handleChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.CLIFF_PERCENTAGE, '');
  });

  it('shows the protection follow-up only under acceleration "Yes"', () => {
    const { rerender } = render(<SectionEquityVesting {...sectionProps()} />);
    expect(cardFor(ACCELERATION)).toHaveTextContent(PROTECTION);
    expect(cardFor(ACCELERATION).querySelectorAll('input[type="radio"]')).toHaveLength(5);
    rerender(
      <SectionEquityVesting
        {...sectionProps({ formData: makeSurveyData({ accelerationTrigger: 'No' }) })}
      />,
    );
    expect(cardFor(ACCELERATION)).not.toHaveTextContent(PROTECTION);
    expect(cardFor(ACCELERATION).querySelectorAll('input[type="radio"]')).toHaveLength(2);
  });

  it('writes the protection months and shows them in the sub-question preview', () => {
    const props = sectionProps();
    const { rerender } = render(<SectionEquityVesting {...props} />);
    fireEvent.click(radio(cardFor(ACCELERATION), '12 months'));
    expect(props.handleChange).toHaveBeenCalledWith(
      FIELDS.ACCELERATION_PROTECTION_MONTHS,
      '12 months',
    );
    rerender(
      <SectionEquityVesting
        {...props}
        formData={makeSurveyData({ ...props.formData, accelerationProtectionMonths: '12 months' })}
      />,
    );
    expect(cardFor(ACCELERATION).querySelector('.sub-question-row')).toHaveTextContent('12 months');
    fireEvent.click(radio(cardFor(ACCELERATION), '12 months'));
    expect(props.handleChange).toHaveBeenLastCalledWith(FIELDS.ACCELERATION_PROTECTION_MONTHS, '');
  });

  it('choosing acceleration "No" clears the protection months', () => {
    const props = sectionProps();
    render(<SectionEquityVesting {...props} />);
    fireEvent.click(radio(cardFor(ACCELERATION), 'No'));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.ACCELERATION_TRIGGER, 'No');
    expect(props.handleChange).toHaveBeenNthCalledWith(
      2,
      FIELDS.ACCELERATION_PROTECTION_MONTHS,
      '',
    );
  });

  it('accepts only non-negative whole numbers for the day counts', () => {
    const props = sectionProps();
    render(<SectionEquityVesting {...props} />);
    const sell = screen.getByPlaceholderText('30');
    const buyback = screen.getByPlaceholderText('90');
    fireEvent.change(sell, { target: { value: '2.5' } });
    expect(props.handleChange).not.toHaveBeenCalled();
    fireEvent.change(sell, { target: { value: '45' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.SHARES_SELL_NOTICE_DAYS, '45');
    fireEvent.change(buyback, { target: { value: '120' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.SHARES_BUYBACK_DAYS, '120');
  });

  it('advances through the cards on Enter', () => {
    render(<SectionEquityVesting {...sectionProps()} />);
    for (let i = 0; i < ALL.length - 1; i++) {
      fireEvent.keyDown(cardFor(ALL[i]!), { key: 'Enter' });
      expect(isExpanded(cardFor(ALL[i + 1]!))).toBe(true);
    }
  });

  it('disables every input when read-only', () => {
    const { container } = render(<SectionEquityVesting {...sectionProps({ isReadOnly: true })} />);
    for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
  });
});

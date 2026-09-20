import { fireEvent, render, screen, within } from '@testing-library/react';
import { FIELDS } from '@cherrytree/shared';

import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { makeSurveyData } from '../test/fixtures/project.ts';
import { cardFor, isAnswered, isExpanded, sectionProps } from '../test/sections.ts';
import SectionCompensation from './SectionCompensation.tsx';

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ currentUser: { id: 'user_admin' } }),
}));

const TAKING = QUESTION_CONFIG[FIELDS.TAKING_COMPENSATION].question;
const SPENDING =
  "What's the spending limit, in USD, before a cofounder needs to check with other cofounders?";

/** Complete answers with compensation on and one entry. */
function withCompensation(entries = [{ who: 'Founder 1', amount: '120000' }]) {
  return makeSurveyData({
    ...sectionProps().formData,
    takingCompensation: 'Yes',
    compensations: entries,
  });
}

const amountInputs = () => screen.getAllByPlaceholderText('$100,000.00');

describe('SectionCompensation', () => {
  it('renders the heading and the two cards', () => {
    render(<SectionCompensation {...sectionProps()} />);
    expect(screen.getByRole('heading', { name: 'Compensation & Expenses' })).toBeInTheDocument();
    expect(cardFor(TAKING)).toBeInTheDocument();
    expect(cardFor(SPENDING)).toBeInTheDocument();
    expect(isAnswered(cardFor(TAKING))).toBe(true);
    expect(isAnswered(cardFor(SPENDING))).toBe(true);
    expect(isExpanded(cardFor(TAKING))).toBe(true);
  });

  it('formats the spending limit as currency in the preview', () => {
    const formData = makeSurveyData({ ...sectionProps().formData, spendingLimit: '2500.5' });
    render(<SectionCompensation {...sectionProps({ formData })} />);
    expect(cardFor(SPENDING).querySelector('.card-answer-preview')).toHaveTextContent('$2,500.5');
  });

  it('hides compensation details unless taking compensation is "Yes"', () => {
    const { rerender } = render(<SectionCompensation {...sectionProps()} />);
    expect(screen.queryByText('Compensation Details')).not.toBeInTheDocument();
    rerender(<SectionCompensation {...sectionProps({ formData: withCompensation([]) })} />);
    // Once: the sub-question row (collapsed preview) and the details heading.
    expect(screen.getAllByText('Compensation Details')).toHaveLength(2);
    expect(screen.getByText('Click "Add" to add compensation entries')).toBeInTheDocument();
  });

  it('adds an empty entry and caps entries at the collaborator count', () => {
    const props = sectionProps({ formData: withCompensation([]) });
    const { rerender } = render(<SectionCompensation {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.COMPENSATIONS, [
      { who: '', amount: '' },
    ]);
    rerender(
      <SectionCompensation
        {...props}
        formData={withCompensation([
          { who: 'Founder 1', amount: '1' },
          { who: 'Founder 2', amount: '2' },
        ])}
      />,
    );
    expect(screen.getByRole('button', { name: '+ Add' })).toBeDisabled();
    expect(screen.getByText('All cofounders assigned')).toBeInTheDocument();
  });

  it('shows each entry with the formatted amount and removes one', () => {
    const props = sectionProps({
      formData: withCompensation([
        { who: 'Founder 1', amount: '120000' },
        { who: '', amount: '' },
      ]),
    });
    render(<SectionCompensation {...props} />);
    expect(amountInputs()[0]).toHaveValue('$120,000');
    expect(cardFor(TAKING).querySelector('.sub-question-row')).toHaveTextContent(
      'Founder 1: $120,000 Unnamed:',
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]!);
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.COMPENSATIONS, [
      { who: '', amount: '' },
    ]);
  });

  it('strips currency formatting from a typed amount and rejects non-numbers', () => {
    const props = sectionProps({ formData: withCompensation() });
    render(<SectionCompensation {...props} />);
    const input = amountInputs()[0]!;
    fireEvent.change(input, { target: { value: '$1,500.25' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.COMPENSATIONS, [
      { who: 'Founder 1', amount: '1500.25' },
    ]);
    vi.mocked(props.handleChange).mockClear();
    fireEvent.change(input, { target: { value: '$1,500.255' } }); // > 2 decimals
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(props.handleChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.COMPENSATIONS, [
      { who: 'Founder 1', amount: '' },
    ]);
  });

  it('offers only cofounders not already picked by another entry', () => {
    const props = sectionProps({
      formData: withCompensation([
        { who: 'Founder 1', amount: '1' },
        { who: '', amount: '' },
      ]),
    });
    render(<SectionCompensation {...props} />);
    const second = screen.getByText('Compensation 2').closest('div[style]')!;
    fireEvent.click(within(second as HTMLElement).getByText('Select a cofounder'));
    expect(screen.getByText('Founder 2')).toBeInTheDocument();
    expect(screen.queryAllByText('Founder 1')).toHaveLength(1); // only the first entry's button
    fireEvent.click(screen.getByText('Founder 2'));
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.COMPENSATIONS, [
      { who: 'Founder 1', amount: '1' },
      { who: 'Founder 2', amount: '' },
    ]);
  });

  it('writes the spending limit without formatting characters', () => {
    const props = sectionProps();
    render(<SectionCompensation {...props} />);
    const input = screen.getByPlaceholderText('$5000.00');
    expect(input).toHaveValue('$1,000');
    fireEvent.change(input, { target: { value: '$12,000' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.SPENDING_LIMIT, '12000');
  });

  it('flags empty entries and the spending limit when validation is on', () => {
    const formData = makeSurveyData({
      ...withCompensation([{ who: '', amount: '' }]),
      spendingLimit: '',
    });
    render(<SectionCompensation {...sectionProps({ formData, showValidation: true })} />);
    expect(cardFor(SPENDING)).toHaveTextContent('* Required');
    expect(cardFor(TAKING).querySelectorAll('.validation-error')).toHaveLength(2);
  });

  it('disables every input and button when read-only', () => {
    const { container } = render(
      <SectionCompensation {...sectionProps({ formData: withCompensation(), isReadOnly: true })} />,
    );
    for (const el of container.querySelectorAll('input, button')) expect(el).toBeDisabled();
  });
});

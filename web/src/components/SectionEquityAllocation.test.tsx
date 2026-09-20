import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { FIELDS, type EquityCalculatorDraft } from '@cherrytree/shared';

import {
  ADMIN_ID,
  MEMBER_ID,
  completeSurveyData,
  makeSurveyData,
} from '../test/fixtures/project.ts';
import { sectionProps } from '../test/sections.ts';
import SectionEquityAllocation from './SectionEquityAllocation.tsx';

const mocks = vi.hoisted(() => ({
  currentUser: { id: 'user_admin' } as { id: string } | null,
  modalProps: null as null | Record<string, unknown>,
}));

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ currentUser: mocks.currentUser }),
}));

// The calculator has its own tests; here it is a stub that exposes its callbacks.
vi.mock('./EquityCalculatorModal', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.modalProps = props;
    return <div data-testid="calculator-modal" />;
  },
}));

const DRAFT: EquityCalculatorDraft = { importance: { a: 3 }, scores: { a: { '0': 2 } } };

const finalCard = () =>
  screen.getByText('Final Equity Allocation').closest('.question-card') as HTMLElement;
const entryRows = () => finalCard().querySelectorAll('.eq-entry-row');
const signRow = (name: string) =>
  screen.getByText(name, { selector: '.eq-sign-name' }).closest('.eq-sign-row') as HTMLElement;

beforeEach(() => {
  mocks.currentUser = { id: ADMIN_ID };
  mocks.modalProps = null;
  Element.prototype.scrollIntoView = vi.fn();
});

describe('SectionEquityAllocation', () => {
  it('renders the calculator card, the entries, the total and one sign row per collaborator', () => {
    render(<SectionEquityAllocation {...sectionProps()} />);
    expect(screen.getByRole('heading', { name: 'Equity Allocation' })).toBeInTheDocument();
    expect(screen.getByText('Equity Calculator')).toBeInTheDocument();
    expect(entryRows()).toHaveLength(2);
    expect(finalCard().querySelector('.eq-total-row')).toHaveTextContent('Total Equity: 100.00%');
    expect(finalCard().querySelector('.eq-total-row')).not.toHaveClass('error');
    expect(signRow('Ada Lovelace')).toHaveTextContent('(Admin)');
    expect(signRow('Grace Hopper')).not.toHaveTextContent('(Admin)');
    expect(signRow('Ada Lovelace')).toHaveClass('signed');
    expect(screen.getByRole('button', { name: '+ Add Cofounder' })).toBeDisabled();
    expect(screen.getByText('All cofounders added.')).toBeInTheDocument();
  });

  it('adds an empty entry and resets the acknowledgment', () => {
    const props = sectionProps({
      formData: makeSurveyData({ ...completeSurveyData(), equityEntries: [] }),
    });
    render(<SectionEquityAllocation {...props} />);
    expect(
      screen.getByText('Click "+ Add Cofounder" to add equity allocations'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ Add Cofounder' }));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.EQUITY_ENTRIES, [
      { name: '', percentage: '' },
    ]);
    expect(props.handleChange).toHaveBeenNthCalledWith(2, FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {});
  });

  it('asks for cofounders first when the Cofounder Info section is empty', () => {
    render(
      <SectionEquityAllocation
        {...sectionProps({ formData: makeSurveyData({ cofounders: [], equityEntries: [] }) })}
      />,
    );
    expect(
      screen.getByText('Add cofounders in the Cofounder Info section first.'),
    ).toBeInTheDocument();
  });

  it('removes an entry and resets the acknowledgment', () => {
    const props = sectionProps();
    render(<SectionEquityAllocation {...props} />);
    fireEvent.click(within(entryRows()[0] as HTMLElement).getByRole('button', { name: 'Remove' }));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.EQUITY_ENTRIES, [
      props.formData.equityEntries[1],
    ]);
    expect(props.handleChange).toHaveBeenNthCalledWith(2, FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {});
  });

  it('steps a percentage by 0.5 within 0–100 and accepts typed values in range', () => {
    const props = sectionProps();
    render(<SectionEquityAllocation {...props} />);
    const row = entryRows()[0] as HTMLElement;
    const [minus, plus] = within(row).getAllByRole('button', { name: /[−+]/ });
    fireEvent.click(plus!);
    expect(props.handleChange).toHaveBeenLastCalledWith(FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {});
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.EQUITY_ENTRIES, [
      { name: 'Founder 1', percentage: '50.5' },
      props.formData.equityEntries[1],
    ]);
    fireEvent.click(minus!);
    expect(props.handleChange).toHaveBeenNthCalledWith(3, FIELDS.EQUITY_ENTRIES, [
      { name: 'Founder 1', percentage: '49.5' },
      props.formData.equityEntries[1],
    ]);
    const input = within(row).getByPlaceholderText('25');
    fireEvent.change(input, { target: { value: '101' } });
    expect(props.handleChange).toHaveBeenCalledTimes(4);
    fireEvent.change(input, { target: { value: '33.3' } });
    expect(props.handleChange).toHaveBeenNthCalledWith(5, FIELDS.EQUITY_ENTRIES, [
      { name: 'Founder 1', percentage: '33.3' },
      props.formData.equityEntries[1],
    ]);
  });

  it('clamps the steppers at 0 and 100', () => {
    const entries = [
      { name: 'Founder 1', percentage: '0' },
      { name: 'Founder 2', percentage: '100' },
    ];
    const props = sectionProps({
      formData: makeSurveyData({ ...completeSurveyData(), equityEntries: entries }),
    });
    render(<SectionEquityAllocation {...props} />);
    fireEvent.click(within(entryRows()[0] as HTMLElement).getByRole('button', { name: '−' }));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.EQUITY_ENTRIES, [
      { name: 'Founder 1', percentage: '0.0' },
      entries[1],
    ]);
    fireEvent.click(within(entryRows()[1] as HTMLElement).getByRole('button', { name: '+' }));
    expect(props.handleChange).toHaveBeenNthCalledWith(3, FIELDS.EQUITY_ENTRIES, [
      entries[0],
      { name: 'Founder 2', percentage: '100.0' },
    ]);
  });

  it('flags a total over 100% and blocks acknowledgment', () => {
    const props = sectionProps({
      formData: makeSurveyData({
        ...completeSurveyData(),
        equityEntries: [
          { name: 'Founder 1', percentage: '60' },
          { name: 'Founder 2', percentage: '50' },
        ],
        acknowledgeEquityAllocation: {},
      }),
    });
    render(<SectionEquityAllocation {...props} />);
    expect(finalCard().querySelector('.eq-total-row')).toHaveClass('error');
    expect(screen.getByText('Total equity exceeds 100%. Please adjust.')).toBeInTheDocument();
    expect(signRow('Ada Lovelace')).toHaveClass('disabled');
    fireEvent.click(signRow('Ada Lovelace'));
    expect(props.handleChange).not.toHaveBeenCalled();
  });

  it('lets only the signed-in collaborator toggle their own acknowledgment', () => {
    const props = sectionProps({
      formData: makeSurveyData({
        ...completeSurveyData(),
        acknowledgeEquityAllocation: { [MEMBER_ID]: true },
      }),
      showValidation: true,
    });
    render(<SectionEquityAllocation {...props} />);
    expect(signRow('Grace Hopper')).toHaveClass('disabled');
    expect(within(signRow('Ada Lovelace')).getByText('*')).toBeInTheDocument();
    fireEvent.click(signRow('Grace Hopper'));
    expect(props.handleChange).not.toHaveBeenCalled();
    fireEvent.click(signRow('Ada Lovelace'));
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {
      [MEMBER_ID]: true,
      [ADMIN_ID]: true,
    });
  });

  it('offers only cofounders not already picked by another entry', () => {
    const props = sectionProps({
      formData: makeSurveyData({
        ...completeSurveyData(),
        equityEntries: [
          { name: 'Founder 1', percentage: '50' },
          { name: '', percentage: '' },
        ],
      }),
    });
    render(<SectionEquityAllocation {...props} />);
    fireEvent.click(within(entryRows()[1] as HTMLElement).getByText('Select a cofounder'));
    expect(screen.getByText('Founder 2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Founder 2'));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.EQUITY_ENTRIES, [
      { name: 'Founder 1', percentage: '50' },
      { name: 'Founder 2', percentage: '' },
    ]);
  });

  describe('calculator', () => {
    it('opens with first names, my draft and the other cofounders’ submissions', () => {
      const formData = makeSurveyData({
        ...completeSurveyData(),
        cofounders: completeSurveyData().cofounders.map((cf, i) => ({
          ...cf,
          fullName: i === 0 ? 'Ada Lovelace' : '',
        })),
        equityCalculatorDraft: { [ADMIN_ID]: DRAFT },
        equityCalculatorSubmitted: {
          [MEMBER_ID]: { ...DRAFT, submittedAt: '2026-01-01T00:00:00.000Z' },
        },
      });
      render(<SectionEquityAllocation {...sectionProps({ formData })} />);
      expect(screen.queryByTestId('calculator-modal')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Open Calculator' }));
      expect(screen.getByTestId('calculator-modal')).toBeInTheDocument();
      expect(mocks.modalProps).toMatchObject({
        cofounderNames: ['Ada', 'Cofounder B'],
        myDraft: DRAFT,
        otherSubmissions: {
          statusList: [{ name: 'Grace Hopper', submitted: true }],
          entries: [{ name: 'Grace Hopper', importance: DRAFT.importance, scores: DRAFT.scores }],
        },
      });
    });

    it('saves my draft and submission under my user id', () => {
      vi.useFakeTimers({ now: new Date('2026-09-19T12:00:00Z') });
      const props = sectionProps({ formData: makeSurveyData({ ...completeSurveyData() }) });
      render(<SectionEquityAllocation {...props} />);
      fireEvent.click(screen.getByRole('button', { name: 'Open Calculator' }));
      (mocks.modalProps!.onDraftChange as (d: EquityCalculatorDraft) => void)(DRAFT);
      expect(props.handleChange).toHaveBeenLastCalledWith(FIELDS.EQUITY_CALCULATOR_DRAFT, {
        [ADMIN_ID]: DRAFT,
      });
      (mocks.modalProps!.onSubmit as (d: EquityCalculatorDraft) => void)(DRAFT);
      expect(props.handleChange).toHaveBeenLastCalledWith(FIELDS.EQUITY_CALCULATOR_SUBMITTED, {
        [ADMIN_ID]: { ...DRAFT, submittedAt: '2026-09-19T12:00:00.000Z' },
      });
      vi.useRealTimers();
    });

    it('writes nothing for the calculator without a signed-in user', () => {
      mocks.currentUser = null;
      const props = sectionProps();
      render(<SectionEquityAllocation {...props} />);
      fireEvent.click(screen.getByRole('button', { name: 'Open Calculator' }));
      (mocks.modalProps!.onDraftChange as (d: EquityCalculatorDraft) => void)(DRAFT);
      (mocks.modalProps!.onSubmit as (d: EquityCalculatorDraft) => void)(DRAFT);
      expect(props.handleChange).not.toHaveBeenCalled();
    });

    it('"Use this split" fills the entries from the cofounder names, resets the acknowledgment and closes', () => {
      const props = sectionProps();
      render(<SectionEquityAllocation {...props} />);
      fireEvent.click(screen.getByRole('button', { name: 'Open Calculator' }));
      act(() => (mocks.modalProps!.onUseSplit as (p: number[]) => void)([66.66, 33.34]));
      expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.EQUITY_ENTRIES, [
        { name: 'Founder', percentage: '66.7' },
        { name: 'Founder', percentage: '33.3' },
      ]);
      expect(props.handleChange).toHaveBeenNthCalledWith(
        2,
        FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION,
        {},
      );
      expect(screen.queryByTestId('calculator-modal')).not.toBeInTheDocument();
    });

    it('closes on onClose', () => {
      render(<SectionEquityAllocation {...sectionProps()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Open Calculator' }));
      act(() => (mocks.modalProps!.onClose as () => void)());
      expect(screen.queryByTestId('calculator-modal')).not.toBeInTheDocument();
    });
  });

  it('disables every control when read-only', () => {
    const { container } = render(
      <SectionEquityAllocation {...sectionProps({ isReadOnly: true })} />,
    );
    for (const el of container.querySelectorAll('input, button')) expect(el).toBeDisabled();
    expect(signRow('Ada Lovelace')).toHaveClass('disabled');
  });
});

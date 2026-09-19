import { fireEvent, render, screen, within } from '@testing-library/react';

import EquityCalculatorModal from './EquityCalculatorModal.tsx';

const CATEGORY_COUNT = 18;

function renderModal(overrides: Partial<Parameters<typeof EquityCalculatorModal>[0]> = {}) {
  const props = {
    cofounderNames: ['Ada', 'Grace'],
    myDraft: undefined,
    otherSubmissions: { statusList: [], entries: [] },
    onDraftChange: vi.fn(),
    onSubmit: vi.fn(),
    onUseSplit: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<EquityCalculatorModal {...props} />);
  return props;
}

const slider = () => screen.getByRole('slider');
const currentCategory = () => document.querySelector('.eq-quiz-cat-name')!.textContent;
const scoreButton = (cofounder: string, n: number) => {
  const row = Array.from(document.querySelectorAll<HTMLElement>('.eq-quiz-cf-row')).find(
    (r) => r.querySelector('.eq-quiz-cf-name')?.textContent === cofounder,
  )!;
  return within(row).getByRole('button', { name: String(n) });
};
const next = () => fireEvent.click(screen.getByRole('button', { name: /Next|See Results/ }));

describe('EquityCalculatorModal', () => {
  it('starts on the first category and cancels from there', () => {
    const { onClose } = renderModal();
    expect(currentCategory()).toBe('Cash Invested');
    expect(screen.getByText(`1 / ${CATEGORY_COUNT}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('persists importance and scores through onDraftChange as they change', () => {
    const { onDraftChange } = renderModal();
    fireEvent.change(slider(), { target: { value: '7' } });
    expect(onDraftChange).toHaveBeenLastCalledWith({
      importance: { 'Cash Invested': 7 },
      scores: {},
    });
    fireEvent.click(scoreButton('Grace', 9));
    expect(onDraftChange).toHaveBeenLastCalledWith({
      importance: { 'Cash Invested': 7 },
      scores: { 1: { 'Cash Invested': 9 } },
    });
  });

  it('resumes from a saved draft', () => {
    renderModal({
      myDraft: { importance: { 'Cash Invested': 4 }, scores: { 0: { 'Cash Invested': 6 } } },
    });
    expect(slider()).toHaveValue('4');
    expect(scoreButton('Ada', 6)).toHaveClass('selected');
  });

  it('shows a live estimate that defaults unscored cofounders to a neutral 1', () => {
    renderModal();
    expect(screen.getAllByText('—')).toHaveLength(2);
    fireEvent.change(slider(), { target: { value: '5' } });
    fireEvent.click(scoreButton('Ada', 9));
    // Ada 5*9 = 45, Grace 5*1 = 5 → 90% / 10%
    const preview = screen.getByText('Estimated Split').parentElement!;
    expect(preview).toHaveTextContent('Ada90%');
    expect(preview).toHaveTextContent('Grace10%');
  });

  it('steps through the categories, jumps via the sections list, and submits at the end', () => {
    const { onSubmit } = renderModal();
    next();
    expect(currentCategory()).toBe('Time Commitment');
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(currentCategory()).toBe('Cash Invested');

    fireEvent.click(screen.getByRole('button', { name: /All sections/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Idea Origination' }));
    expect(screen.getByText(`${CATEGORY_COUNT} / ${CATEGORY_COUNT}`)).toBeInTheDocument();
    fireEvent.change(slider(), { target: { value: '3' } });
    fireEvent.click(scoreButton('Ada', 2));
    fireEvent.click(scoreButton('Grace', 6));

    fireEvent.click(screen.getByRole('button', { name: 'See Results →' }));
    expect(onSubmit).toHaveBeenCalledWith({
      importance: { 'Idea Origination': 3 },
      scores: { 0: { 'Idea Origination': 2 }, 1: { 'Idea Origination': 6 } },
    });
    expect(screen.getByText('Your Suggestion')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('Δ 4')).toHaveClass('big');
  });

  it('hands the computed split to onUseSplit', () => {
    const { onUseSplit } = renderModal({
      myDraft: { importance: { Sales: 2 }, scores: { 0: { Sales: 3 }, 1: { Sales: 1 } } },
    });
    fireEvent.click(screen.getByRole('button', { name: /All sections/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Idea Origination' }));
    fireEvent.click(screen.getByRole('button', { name: 'See Results →' }));
    fireEvent.click(screen.getByRole('button', { name: 'Use this split →' }));
    expect(onUseSplit).toHaveBeenCalledWith([75, 25]);
  });

  it('locks the comparison until every other cofounder has submitted, with a preview escape hatch', () => {
    renderModal({
      myDraft: { importance: { Sales: 2 }, scores: { 0: { Sales: 3 }, 1: { Sales: 1 } } },
      otherSubmissions: {
        statusList: [{ name: 'Grace', submitted: false }],
        entries: [],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /All sections/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Idea Origination' }));
    fireEvent.click(screen.getByRole('button', { name: 'See Results →' }));
    expect(screen.getByText('Comparison unlocks when everyone submits')).toBeInTheDocument();
    expect(screen.getByText(/Grace — working…/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Preview comparison →' }));
    expect(screen.getByText('Your Suggestion')).toBeInTheDocument();
  });

  it("shows each other cofounder's suggestion once they have all submitted", () => {
    renderModal({
      myDraft: { importance: { Sales: 2 }, scores: { 0: { Sales: 3 }, 1: { Sales: 1 } } },
      otherSubmissions: {
        statusList: [{ name: 'Grace', submitted: true }],
        entries: [
          { name: 'Grace', importance: { Sales: 1 }, scores: { 0: { Sales: 1 }, 1: { Sales: 3 } } },
        ],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /All sections/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Idea Origination' }));
    fireEvent.click(screen.getByRole('button', { name: 'See Results →' }));
    expect(screen.getByText("Grace's Suggestion")).toBeInTheDocument();
    const theirs = screen.getByText("Grace's Suggestion").parentElement!;
    expect(theirs).toHaveTextContent('Ada25.0%');
    expect(theirs).toHaveTextContent('Grace75.0%');
  });

  it('closes on a backdrop click but not on clicks inside', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText('Equity Calculator'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(document.querySelector('.eq-modal-backdrop')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

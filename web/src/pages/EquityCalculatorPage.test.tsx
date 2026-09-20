import { act, fireEvent, render, screen } from '@testing-library/react';

import { breadcrumbs } from '../test/pageMeta.ts';
import EquityCalculatorPage from './EquityCalculatorPage.tsx';

interface Cell {
  value: string | number;
  readOnly?: boolean;
  className?: string;
}
type Sheet = Cell[][];

const mocks = vi.hoisted(() => ({
  sheet: null as null | { data: unknown; onChange: (data: unknown) => void },
}));

// react-spreadsheet renders a table with its own editing model; the stub records the props and
// offers one editable and one read-only cell for the single-click effect.
vi.mock('react-spreadsheet', () => ({
  default: (props: { data: unknown; onChange: (data: unknown) => void }) => {
    mocks.sheet = props;
    return (
      <div data-testid="sheet">
        <div className="Spreadsheet__cell" data-testid="editable-cell" />
        <div
          className="Spreadsheet__cell Spreadsheet__cell--readonly"
          data-testid="readonly-cell"
        />
      </div>
    );
  },
}));
// The marketing chrome has its own tests.
vi.mock('../components/MarketingNav', () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock('../components/MarketingFooter', () => ({
  default: () => <footer data-testid="footer" />,
}));
vi.mock('../components/MarketingGrain', () => ({ default: () => <svg data-testid="grain" /> }));

const CATEGORY_ROWS = 18;
const SEPARATORS = ['Input', 'Execution', 'Intangibles'];

const nameInputs = () => screen.getAllByPlaceholderText(/Cofounder \d/) as HTMLInputElement[];
const startButton = () => screen.getByRole('button', { name: 'Start Calculator' });
const sheetData = () => mocks.sheet!.data as Sheet;
const bar = () => document.querySelector('.lp-eq-bar-wrap > div');
const segments = () => Array.from(document.querySelectorAll<HTMLElement>('.lp-eq-bar-wrap span'));

function typeName(index: number, name: string) {
  fireEvent.change(nameInputs()[index]!, { target: { value: name } });
}

/** Names typed, calculator started. */
function startWith(names: string[]) {
  render(<EquityCalculatorPage />);
  names.forEach((name, i) => {
    if (i >= 2) fireEvent.click(screen.getByRole('button', { name: 'Add cofounder' }));
    typeName(i, name);
  });
  fireEvent.click(startButton());
}

/** The current sheet with `value` written into (row, column). */
function edited(row: number, column: number, value: string | number | null): Sheet {
  return sheetData().map((cells, r) =>
    cells.map((cell, c) => (r === row && c === column ? { ...cell, value: value as never } : cell)),
  );
}

const change = (data: Sheet) => act(() => mocks.sheet!.onChange(data));

beforeEach(() => {
  mocks.sheet = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EquityCalculatorPage', () => {
  it('sets the page meta', () => {
    render(<EquityCalculatorPage />);
    expect(document.title).toBe(
      'Free Equity Calculator - Cherrytree | Fair Cofounder Equity Split Tool',
    );
    expect(breadcrumbs()).toEqual(['Home', 'Equity Calculator']);
  });

  describe('setup form', () => {
    it('starts with two name fields inside the marketing chrome', () => {
      render(<EquityCalculatorPage />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Equity Calculator.');
      expect(nameInputs().map((i) => i.placeholder)).toEqual(['Cofounder 1 (you)', 'Cofounder 2']);
      expect(screen.queryByTestId('sheet')).toBeNull();
      expect(screen.getByTestId('grain')).toBeInTheDocument();
      expect(screen.getByTestId('nav')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('adds up to five cofounders and removes the extra ones', () => {
      render(<EquityCalculatorPage />);
      const add = () => screen.getByRole('button', { name: 'Add cofounder' });
      fireEvent.click(add());
      fireEvent.click(add());
      fireEvent.click(add());
      expect(nameInputs()).toHaveLength(5);
      expect(screen.queryByRole('button', { name: 'Add cofounder' })).toBeNull();

      typeName(2, 'Third');
      typeName(3, 'Fourth');
      // The first two cannot be removed; the third's button drops that entry.
      const removeButtons = document.querySelectorAll('.lp-eq-remove-btn');
      expect(removeButtons).toHaveLength(3);
      fireEvent.click(removeButtons[0]!);
      expect(nameInputs()).toHaveLength(4);
      expect(nameInputs()[2]).toHaveValue('Fourth');
      expect(screen.getByRole('button', { name: 'Add cofounder' })).toBeInTheDocument();
    });

    it('wiggles the first empty name instead of starting', () => {
      vi.useFakeTimers();
      render(<EquityCalculatorPage />);
      fireEvent.click(startButton());
      expect(nameInputs()[0]).toHaveClass('animate-wiggle');
      expect(nameInputs()[1]).not.toHaveClass('animate-wiggle');
      act(() => vi.advanceTimersByTime(500));
      expect(nameInputs()[0]).not.toHaveClass('animate-wiggle');

      typeName(0, '  Ada  ');
      fireEvent.click(startButton());
      expect(nameInputs()[1]).toHaveClass('animate-wiggle');
      expect(screen.queryByTestId('sheet')).toBeNull();

      typeName(1, 'Grace');
      fireEvent.click(startButton());
      expect(screen.getByTestId('sheet')).toBeInTheDocument();
    });
  });

  describe('calculator', () => {
    it('builds the sheet: header with first names, three separators, eighteen zeroed rows', () => {
      startWith(['Ada Lovelace', 'Grace Hopper', '']);
      const data = sheetData();
      expect(data).toHaveLength(1 + SEPARATORS.length + CATEGORY_ROWS);
      expect(data[0]!.map((c) => c.value)).toEqual([
        'Category',
        'Importance',
        'Ada',
        'Grace',
        'Cofounder 3',
      ]);
      expect(data[0]!.every((c) => c.readOnly && c.className === 'header-cell')).toBe(true);

      const separatorRows = data.filter((row) => SEPARATORS.includes(String(row[0]!.value)));
      expect(separatorRows.map((row) => row[0]!.value)).toEqual(SEPARATORS);
      for (const row of separatorRows) {
        expect(row[0]!.className).toBe('category-cell separator-cell');
        expect(row.slice(1).every((c) => c.value === '' && c.readOnly)).toBe(true);
      }

      const categoryRows = data.filter(
        (row, i) => i > 0 && !SEPARATORS.includes(String(row[0]!.value)),
      );
      expect(categoryRows).toHaveLength(CATEGORY_ROWS);
      expect(categoryRows[0]!.map((c) => c.value)).toEqual(['Cash Invested', 0, 0, 0, 0]);
      expect(categoryRows[0]![0]).toMatchObject({ readOnly: true, className: 'category-cell' });
      expect(categoryRows[0]![1]).toEqual({ value: 0 });
      expect(categoryRows.at(-1)![0]!.value).toBe('Idea Origination');
    });

    it('keeps a whole number 0–100 and reverts anything else', () => {
      startWith(['Ada', 'Grace']);
      const row = 2; // Cash Invested

      change(edited(row, 1, '60'));
      expect(sheetData()[row]![1]!.value).toBe(60);
      change(edited(row, 1, '150'));
      expect(sheetData()[row]![1]!.value).toBe(60);
      change(edited(row, 1, '12.5'));
      expect(sheetData()[row]![1]!.value).toBe(60);
      change(edited(row, 1, 'abc'));
      expect(sheetData()[row]![1]!.value).toBe(60);
      change(edited(row, 1, -3));
      expect(sheetData()[row]![1]!.value).toBe(60);
      change(edited(row, 1, ''));
      expect(sheetData()[row]![1]!.value).toBe(0);
      change(edited(row, 1, null));
      expect(sheetData()[row]![1]!.value).toBe(0);
    });

    it('re-applies the read-only header, category and separator cells after an edit', () => {
      startWith(['Ada', 'Grace']);
      change(edited(0, 2, 'Hacked'));
      expect(sheetData()[0]![2]).toMatchObject({ readOnly: true, className: 'header-cell' });

      change(edited(1, 1, 50)); // the Input separator row
      expect(sheetData()[1]![1]).toEqual({
        value: '',
        readOnly: true,
        className: 'separator-cell',
      });
      expect(sheetData()[1]![0]).toMatchObject({
        readOnly: true,
        className: 'category-cell separator-cell',
      });

      change(edited(2, 0, 'Renamed'));
      expect(sheetData()[2]![0]).toMatchObject({ readOnly: true, className: 'category-cell' });
    });

    it('scores the split from the sheet and shows one segment and legend entry per cofounder', () => {
      startWith(['Ada Lovelace', 'Grace Hopper']);
      expect(bar()).toBeNull(); // nothing rated yet

      change(edited(2, 1, 100)); // Cash Invested matters…
      expect(bar()).toBeNull(); // …but nobody scored
      let data = edited(2, 2, 60);
      data = data.map((cells, r) =>
        r === 2 ? cells.map((c, i) => (i === 3 ? { ...c, value: 40 } : c)) : cells,
      );
      change(data);

      const labels = segments().map((s) => s.textContent);
      expect(labels).toEqual(['60.00%', '40.00%', 'Ada', 'Grace']);
      const [first, second] = Array.from(
        document.querySelectorAll<HTMLElement>('.lp-eq-bar-wrap .transition-all'),
      );
      expect(first?.style.width).toBe('60%');
      expect(first?.style.backgroundColor).toBe('rgb(0, 0, 0)');
      expect(second?.style.width).toBe('40%');
      expect(second?.style.backgroundColor).toBe('rgb(255, 255, 255)');
    });

    it('keeps the same bar element across edits so its width can transition', () => {
      startWith(['Ada', 'Grace']);
      change(edited(2, 1, 100));
      change(edited(2, 2, 50));
      const before = bar();
      expect(before).not.toBeNull();
      change(edited(2, 3, 50));
      expect(bar()).toBe(before);
    });

    it('starts from a fresh sheet after going back to setup', () => {
      startWith(['Ada', 'Grace']);
      change(edited(2, 1, 100));
      expect(sheetData()[2]![1]!.value).toBe(100);

      fireEvent.click(screen.getByRole('button', { name: 'Back to setup' }));
      expect(screen.queryByTestId('sheet')).toBeNull();
      typeName(1, 'Grace Hopper');
      fireEvent.click(startButton());
      expect(sheetData()[2]![1]!.value).toBe(0);
      expect(sheetData()[0]![3]!.value).toBe('Grace');
    });

    it('turns a click on an editable cell into a double-click, leaving read-only cells alone', () => {
      // The page passes `view: window`; under vitest the global `window` is not a jsdom Window
      // wrapper, so jsdom's MouseEvent rejects it. Construct without it, keeping the rest.
      const RealMouseEvent = window.MouseEvent;
      vi.stubGlobal(
        'MouseEvent',
        class extends RealMouseEvent {
          constructor(type: string, init?: MouseEventInit) {
            super(type, { ...init, view: null });
          }
        },
      );
      startWith(['Ada', 'Grace']);
      const editable = screen.getByTestId('editable-cell');
      const readOnly = screen.getByTestId('readonly-cell');
      const onDblClick = vi.fn();
      editable.addEventListener('dblclick', onDblClick);
      readOnly.addEventListener('dblclick', onDblClick);

      fireEvent.click(editable, { clientX: 5, clientY: 7 });
      expect(onDblClick).toHaveBeenCalledTimes(1);
      expect(onDblClick.mock.calls[0]![0]).toMatchObject({ clientX: 5, clientY: 7, bubbles: true });

      fireEvent.click(readOnly);
      expect(onDblClick).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });

    it('shares the page link and copies it to the clipboard', () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
      startWith(['Ada', 'Grace']);
      fireEvent.click(screen.getByRole('button', { name: 'Share with cofounder' }));
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Share with cofounder');
      const link = document.querySelector('.lp-eq-modal-input') as HTMLInputElement;
      expect(link.value).toBe(window.location.href);
      expect(link).toHaveAttribute('readonly');

      const copy = screen.getByRole('button', { name: 'Copy' });
      fireEvent.click(copy);
      expect(writeText).toHaveBeenCalledWith(window.location.href);
      expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull(); // check icon now

      fireEvent.click(document.querySelector('.lp-eq-modal-close')!);
      expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Share with cofounder' }));
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
      Reflect.deleteProperty(navigator, 'clipboard');
    });
  });
});

import { fireEvent, render, screen } from '@testing-library/react';

import CustomSelect from './CustomSelect.tsx';

const options = [
  { value: 'llc', label: 'LLC' },
  { value: 'c-corp', label: 'C-Corp' },
  { value: 's-corp', label: 'S-Corp' },
];

/** More than 8 options switches the search box on. */
const manyOptions = Array.from({ length: 10 }, (_, i) => ({
  value: `state-${i}`,
  label: `State ${i}`,
}));

describe('CustomSelect', () => {
  it('shows the placeholder until a value is selected, then the option label', () => {
    const { rerender } = render(<CustomSelect value="" onChange={() => {}} options={options} />);
    expect(screen.getByRole('button')).toHaveTextContent('Select...');
    rerender(<CustomSelect value="c-corp" onChange={() => {}} options={options} />);
    expect(screen.getByRole('button')).toHaveTextContent('C-Corp');
  });

  it('prefers an explicit displayValue over the option label', () => {
    render(
      <CustomSelect
        value="llc"
        onChange={() => {}}
        options={options}
        displayValue="Other: Trust"
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Other: Trust');
  });

  it('opens on click, reports the chosen value and closes again', () => {
    const onChange = vi.fn();
    render(<CustomSelect value="" onChange={onChange} options={options} />);
    expect(screen.queryByText('LLC')).toBeNull();

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('S-Corp'));
    expect(onChange).toHaveBeenCalledWith('s-corp');
    expect(screen.queryByText('S-Corp')).toBeNull();
  });

  it('closes on a click outside the wrapper', () => {
    render(
      <div>
        <CustomSelect value="" onChange={() => {}} options={options} />
        <p>outside</p>
      </div>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('LLC')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(screen.queryByText('LLC')).toBeNull();
  });

  it('does not open while disabled', () => {
    render(<CustomSelect value="" onChange={() => {}} options={options} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('LLC')).toBeNull();
  });

  it('offers a search box past 8 options and filters by label, case-insensitively', () => {
    render(<CustomSelect value="" onChange={() => {}} options={manyOptions} />);
    fireEvent.click(screen.getByRole('button'));
    const search = screen.getByPlaceholderText('Search...');
    expect(search).toHaveFocus();

    fireEvent.change(search, { target: { value: 'state 7' } });
    expect(screen.getByText('State 7')).toBeInTheDocument();
    expect(screen.queryByText('State 1')).toBeNull();

    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });

  it('has no search box for short lists', () => {
    render(<CustomSelect value="" onChange={() => {}} options={options} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByPlaceholderText('Search...')).toBeNull();
  });
});

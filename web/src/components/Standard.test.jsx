import { render, screen } from '@testing-library/react';
import Standard from './Standard';

describe('Standard', () => {
  it('renders the hint text', () => {
    render(<Standard text="The standard is 4 years with a 1-year cliff" />);
    expect(screen.getByText('The standard is 4 years with a 1-year cliff')).toHaveClass(
      'card-hint',
    );
  });

  it('renders nothing without text', () => {
    const { container } = render(<Standard />);
    expect(container).toBeEmptyDOMElement();
  });
});

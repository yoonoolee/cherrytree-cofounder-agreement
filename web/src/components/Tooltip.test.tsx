import { render, screen } from '@testing-library/react';

import Tooltip from './Tooltip.tsx';

describe('Tooltip', () => {
  it('renders the explanatory text', () => {
    render(<Tooltip text="Vesting protects the company if a cofounder leaves early." />);
    expect(
      screen.getByText('Vesting protects the company if a cofounder leaves early.'),
    ).toHaveClass('card-hint');
  });

  it('renders nothing without text', () => {
    const { container } = render(<Tooltip />);
    expect(container).toBeEmptyDOMElement();
  });
});

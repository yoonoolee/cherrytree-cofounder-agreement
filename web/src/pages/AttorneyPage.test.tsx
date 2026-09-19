import { render, screen } from '@testing-library/react';

import { breadcrumbs } from '../test/pageMeta.ts';
import AttorneyPage from './AttorneyPage.tsx';

// The marketing chrome has its own tests.
vi.mock('../components/MarketingNav', () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock('../components/MarketingFooter', () => ({
  default: () => <footer data-testid="footer" />,
}));
vi.mock('../components/MarketingGrain', () => ({ default: () => <svg data-testid="grain" /> }));

describe('AttorneyPage', () => {
  it('sets the page meta', () => {
    render(<AttorneyPage />);
    expect(document.title).toBe('Attorney Review — Cherrytree');
    expect(breadcrumbs()).toEqual(['Home', 'Attorney']);
  });

  it('renders the coming-soon hero and the seven placeholder cards', () => {
    const { container } = render(<AttorneyPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Attorney.');
    expect(screen.getByText('Coming soon — this is only for Pro members.')).toBeInTheDocument();

    const cards = container.querySelectorAll('.lp-attorney-card');
    expect(cards).toHaveLength(7);
    expect(screen.getAllByText('Attorney Name')).toHaveLength(7);
    expect(
      screen.getByText('Experienced attorney specializing in startup law and corporate formation.'),
    ).toBeInTheDocument();

    expect(screen.getByTestId('grain')).toBeInTheDocument();
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

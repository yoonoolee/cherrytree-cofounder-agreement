import { render, screen } from '@testing-library/react';

import { breadcrumbs } from '../test/pageMeta.ts';
import AboutPage from './AboutPage.tsx';

// The marketing chrome has its own tests.
vi.mock('../components/MarketingNav', () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock('../components/MarketingFooter', () => ({
  default: () => <footer data-testid="footer" />,
}));
vi.mock('../components/MarketingGrain', () => ({ default: () => <svg data-testid="grain" /> }));

describe('AboutPage', () => {
  it('sets the page meta', () => {
    render(<AboutPage />);
    expect(document.title).toBe('About Cherrytree — Fair Cofounder Agreements for Startups');
    expect(breadcrumbs()).toEqual(['Home', 'About']);
  });

  it('renders the hero and both sections inside the marketing chrome', () => {
    render(<AboutPage />);
    const hero = screen.getByRole('heading', { level: 1 });
    expect(hero).toHaveTextContent(/Big ideas grow/);
    expect(hero).toHaveTextContent(/with the right company\./);

    expect(screen.getByText('Note from our CEO')).toBeInTheDocument();
    expect(screen.getByText('The Backstory')).toBeInTheDocument();
    expect(screen.getByText("We're hiring")).toBeInTheDocument();
    expect(screen.getByText('Work With Us')).toBeInTheDocument();
    expect(screen.getByText('Student Internship (part-time)')).toBeInTheDocument();

    expect(screen.getByTestId('grain')).toBeInTheDocument();
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

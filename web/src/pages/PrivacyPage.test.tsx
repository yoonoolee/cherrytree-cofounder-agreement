import { render, screen } from '@testing-library/react';

import { breadcrumbs } from '../test/pageMeta.ts';
import PrivacyPage from './PrivacyPage.tsx';

// The marketing chrome has its own tests.
vi.mock('../components/MarketingNav', () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock('../components/MarketingFooter', () => ({
  default: () => <footer data-testid="footer" />,
}));
vi.mock('../components/MarketingGrain', () => ({ default: () => <svg data-testid="grain" /> }));

describe('PrivacyPage', () => {
  it('sets the page meta', () => {
    render(<PrivacyPage />);
    expect(document.title).toBe('Privacy Policy - Cherrytree | Your Data Protection & Privacy');
    expect(breadcrumbs()).toEqual(['Home', 'Privacy Policy']);
  });

  it('renders the hero, every policy section in order and the contact address', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Privacy.');
    expect(screen.getByText('Updated: November 2025')).toBeInTheDocument();

    const sections = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(sections).toEqual([
      'Definitions',
      'How We Collect Personal Info',
      'What Info We Collect',
      'How We Use That Info',
      'Your Choice About Personal Info',
      'Protection of Personal Information',
      'Cherrytree Internal Access',
      '3rd Party Disclosure',
      'Retention of Personal Info',
      'Your Consent',
      'Your Rights',
      'Privacy Changes',
      'Contact Us',
    ]);

    expect(screen.getByRole('link', { name: 'hello@cherrytree.app' })).toHaveAttribute(
      'href',
      'mailto:hello@cherrytree.app',
    );

    expect(screen.getByTestId('grain')).toBeInTheDocument();
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

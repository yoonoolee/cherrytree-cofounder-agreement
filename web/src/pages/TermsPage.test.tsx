import { render, screen } from '@testing-library/react';

import { breadcrumbs } from '../test/pageMeta.ts';
import TermsPage from './TermsPage.tsx';

// The marketing chrome has its own tests.
vi.mock('../components/MarketingNav', () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock('../components/MarketingFooter', () => ({
  default: () => <footer data-testid="footer" />,
}));
vi.mock('../components/MarketingGrain', () => ({ default: () => <svg data-testid="grain" /> }));

describe('TermsPage', () => {
  it('sets the page meta', () => {
    render(<TermsPage />);
    expect(document.title).toBe('Terms of Service - Cherrytree | User Agreement & Legal Terms');
    expect(breadcrumbs()).toEqual(['Home', 'Terms of Service']);
  });

  it('renders the hero, the nineteen numbered sections in order and the contact address', () => {
    render(<TermsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Terms.');
    expect(screen.getByText('Updated: December 2025')).toBeInTheDocument();

    const sections = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(sections).toEqual([
      '1. Agreement to Terms',
      '2. Changes to Terms or Services',
      '3. Nature of Services',
      '4. Your Right to Use the Site; Your Restrictions',
      '5. Intellectual Property Rights',
      '6. Use of the Services; Providing Us Information',
      "7. How We'll Use Your Information; Our Privacy Policy",
      '8. Data Security; Disclaimer',
      '9. Purchasing Products and Services from Cherrytree',
      '10. Termination of Product Access',
      '11. Payment Terms',
      '12. Limited Warranty',
      '13. Links to Third Party Websites or Resources',
      '14. Important Disclaimers',
      '15. Indemnity',
      '16. Limitation of Liability',
      '17. General Terms',
      '18. Data Collection and Consent',
      '19. Contact Information',
    ]);

    const mailLinks = screen.getAllByRole('link', { name: 'hello@cherrytree.app' });
    expect(mailLinks).toHaveLength(2);
    for (const link of mailLinks)
      expect(link).toHaveAttribute('href', 'mailto:hello@cherrytree.app');

    expect(screen.getByTestId('grain')).toBeInTheDocument();
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

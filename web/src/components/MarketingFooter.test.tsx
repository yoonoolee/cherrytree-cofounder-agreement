import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import MarketingFooter from './MarketingFooter.tsx';

vi.mock('../lib/env', () => ({ env: { appUrl: 'https://my.cherrytree.app' } }));

function Location() {
  const { pathname } = useLocation();
  return <p data-testid="path">{pathname}</p>;
}

describe('MarketingFooter', () => {
  it('routes every internal link through the router', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <MarketingFooter />
        <Routes>
          <Route path="*" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );
    const expectRoute = (name: string, path: string) => {
      fireEvent.click(screen.getByRole('button', { name }));
      expect(screen.getByTestId('path')).toHaveTextContent(path);
    };
    expectRoute('Contract Creator', '/dashboard');
    expectRoute('Equity Calculator', '/equity-calculator');
    expectRoute('Pricing', '/pricing');
    expectRoute('Attorney', '/attorney');
    expectRoute('Privacy', '/privacy');
    expectRoute('Terms', '/terms');
    expectRoute('Contact', '/contact');
    fireEvent.click(screen.getByRole('button', { name: /Cherrytree/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/');
    expect(screen.getByText('© 2026 Cherrytree, LLC')).toBeInTheDocument();
  });
});

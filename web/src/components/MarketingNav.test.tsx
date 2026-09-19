import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import MarketingNav from './MarketingNav.tsx';

function Location() {
  const { pathname } = useLocation();
  return <p data-testid="path">{pathname}</p>;
}

function renderNav() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <MarketingNav />
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MarketingNav', () => {
  it('routes the logo, product links, sign-in and CTA through the router', () => {
    renderNav();
    fireEvent.click(screen.getByRole('button', { name: /^Equity Calculator/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/equity-calculator');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/login');
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/dashboard');
    fireEvent.click(screen.getByRole('button', { name: /Cherrytree/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/');
  });

  it('links external resources in a new tab with rel=noopener', () => {
    renderNav();
    const coaching = screen.getByRole('link', { name: /Coaching/ });
    expect(coaching).toHaveAttribute('href', 'https://app.hubble.social/timhe');
    expect(coaching).toHaveAttribute('target', '_blank');
    expect(coaching).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: /Newsletter/ })).toHaveAttribute(
      'href',
      'https://cherrytree.beehiiv.com/',
    );
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { breadcrumbs } from '../test/pageMeta.ts';
import PricingPage from './PricingPage.tsx';

// The marketing chrome has its own tests.
vi.mock('../components/MarketingNav', () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock('../components/MarketingFooter', () => ({
  default: () => <footer data-testid="footer" />,
}));
vi.mock('../components/MarketingGrain', () => ({ default: () => <svg data-testid="grain" /> }));

function Location() {
  const { pathname } = useLocation();
  return <p data-testid="path">{pathname}</p>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pricing']}>
      <PricingPage />
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

const path = () => screen.getByTestId('path').textContent;
const cards = () => Array.from(document.querySelectorAll<HTMLElement>('.lp-pricing-card'));
const faqBody = (question: string) =>
  screen.getByRole('button', { name: question }).parentElement?.querySelector('.lp-faq-body');
const typed = () => document.querySelector('.lp-protect-cta em')?.textContent;

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'Tally');
});

describe('PricingPage', () => {
  it('sets the page meta and the FAQ JSON-LD, removed on unmount', () => {
    const { unmount } = renderPage();
    expect(document.title).toBe('Pricing — Cherrytree');
    expect(breadcrumbs()).toEqual(['Home', 'Pricing']);

    const faq = JSON.parse(document.getElementById('faq-schema')?.textContent ?? '') as {
      '@type': string;
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(faq['@type']).toBe('FAQPage');
    expect(faq.mainEntity.map((q) => q.name)).toEqual([
      'Which plan is right for me?',
      'Is the price per agreement or per person?',
      'Do you offer discounts?',
      'Can we upgrade anytime?',
      'Do we pay again to edit later?',
    ]);
    expect(faq.mainEntity[2]?.acceptedAnswer.text).toMatch(/tim@cherrytree\.app/);

    unmount();
    expect(document.getElementById('faq-schema')).toBeNull();
  });

  it('renders the three plans with their prices, features and calls to action', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Founder-friendly pricing.',
    );

    const [bootstrapped, scale, enterprise] = cards();
    expect(cards()).toHaveLength(3);
    expect(bootstrapped).toHaveTextContent('Bootstrapped');
    expect(bootstrapped?.querySelector('.lp-pricing-price')).toHaveTextContent('$200');
    expect(bootstrapped?.querySelector('.lp-pricing-price > span')).toHaveTextContent('$');
    expect(bootstrapped).not.toHaveClass('featured');
    expect(bootstrapped?.querySelectorAll('.lp-pricing-feat')).toHaveLength(5);

    expect(scale).toHaveClass('featured');
    expect(scale?.querySelector('.lp-pricing-badge')).toHaveTextContent('Most popular');
    expect(scale?.querySelector('.lp-pricing-price')).toHaveTextContent('$2,000');

    expect(enterprise?.querySelector('.lp-pricing-price')).toHaveTextContent('Custom');
    expect(enterprise?.querySelector('.lp-pricing-price > span')).toBeNull();
    expect(enterprise?.querySelector('.lp-pricing-cta')).toHaveTextContent('Contact sales');
    expect(enterprise?.querySelector('.lp-pricing-cta')).toHaveClass('solid');
    expect(scale?.querySelector('.lp-pricing-cta')).toHaveClass('filled');
    expect(bootstrapped?.querySelector('.lp-pricing-cta')).toHaveClass('outline');

    expect(screen.getByTestId('grain')).toBeInTheDocument();
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('sends every Get started to the dashboard and Contact sales to the Tally form', () => {
    const openPopup = vi.fn();
    window.Tally = { openPopup };
    renderPage();

    const [getStarted, scaleStarted, bottomStarted] = screen.getAllByRole('button', {
      name: 'Get started',
    });
    expect(bottomStarted).toBeDefined();
    fireEvent.click(getStarted!);
    expect(path()).toBe('/dashboard');
    expect(openPopup).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Contact sales' }));
    expect(openPopup).toHaveBeenCalledWith('2EEB99', { layout: 'modal', width: 700 });
    expect(scaleStarted).toBeInTheDocument();
  });

  it('does nothing on Contact sales when the Tally embed has not loaded', () => {
    renderPage();
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Contact sales' })),
    ).not.toThrow();
    expect(path()).toBe('/pricing');
  });

  it('marks the compare table per plan', () => {
    renderPage();
    const rows = screen.getAllByRole('row').slice(1); // skip the header
    expect(rows).toHaveLength(13);
    const marks = (column: number) =>
      rows.filter((row) => row.querySelectorAll('td')[column]?.textContent === '✓').length;
    expect(marks(1)).toBe(6); // Bootstrapped
    expect(marks(2)).toBe(9); // Scale
    expect(marks(3)).toBe(13); // Enterprise
    expect(rows[6]?.querySelectorAll('td')[1]).toHaveTextContent('—');
  });

  it('opens an FAQ on hover or click and closes it again', () => {
    renderPage();
    const question = 'Do you offer discounts?';
    const item = screen.getByRole('button', { name: question }).parentElement!;
    expect(faqBody(question)).not.toHaveClass('open');

    fireEvent.mouseEnter(item);
    expect(faqBody(question)).toHaveClass('open');
    fireEvent.mouseLeave(item);
    expect(faqBody(question)).not.toHaveClass('open');

    fireEvent.click(screen.getByRole('button', { name: question }));
    expect(faqBody(question)).toHaveClass('open');
    fireEvent.mouseLeave(item); // a clicked-open item stays open
    expect(faqBody(question)).toHaveClass('open');
    fireEvent.click(screen.getByRole('button', { name: question }));
    expect(faqBody(question)).not.toHaveClass('open');
  });

  it('types the closing line out, holds, and starts over; unmount stops the timers', () => {
    vi.useFakeTimers();
    const { unmount } = renderPage();
    const line = 'and your peace of mind.';
    expect(typed()).toBe('');

    act(() => vi.advanceTimersByTime(600 + 46));
    expect(typed()).toBe('a');
    act(() => vi.advanceTimersByTime(46 * (line.length - 1)));
    expect(typed()).toBe(line);

    act(() => vi.advanceTimersByTime(46 + 2200));
    expect(typed()).toBe(''); // held, then cleared for the next cycle
    act(() => vi.advanceTimersByTime(46));
    expect(typed()).toBe('a');

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('gives the Enterprise card the Bootstrapped height, also after a resize', () => {
    const offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get');
    offsetHeight.mockReturnValue(480);
    renderPage();
    const [, , enterprise] = cards();
    expect(enterprise?.style.height).toBe('480px');

    offsetHeight.mockReturnValue(520);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(enterprise?.style.height).toBe('520px');
    offsetHeight.mockRestore();
  });
});

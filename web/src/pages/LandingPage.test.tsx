import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { breadcrumbs } from '../test/pageMeta.ts';
import LandingPage from './LandingPage.tsx';

// The marketing chrome has its own tests.
vi.mock('../components/MarketingNav', () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock('../components/MarketingFooter', () => ({
  default: () => <footer data-testid="footer" />,
}));
vi.mock('../components/MarketingGrain', () => ({ default: () => <svg data-testid="grain" /> }));

/** jsdom has no IntersectionObserver; this one reveals what it observes on demand. */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed: Element[] = [];
  constructor(
    private readonly callback: (entries: { isIntersecting: boolean; target: Element }[]) => void,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe(target: Element) {
    this.observed.push(target);
  }
  unobserve() {}
  disconnect() {}
  intersect(targets: Element[] = this.observed) {
    this.callback(targets.map((target) => ({ isIntersecting: true, target })));
  }
}

function Location() {
  const { pathname } = useLocation();
  return <p data-testid="path">{pathname}</p>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LandingPage />
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

const path = () => screen.getByTestId('path').textContent;
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const heroMark = () => document.querySelector('.lp-hero-headline .lp-hl-mark');
const protectMark = () => document.querySelector('.lp-protect-cta .lp-hl-mark');
const observersFor = (threshold: number) =>
  FakeIntersectionObserver.instances.filter((o) => o.options?.threshold === threshold);
const faqBody = (question: string) =>
  screen.getByRole('button', { name: question }).parentElement?.querySelector('.lp-faq-body');

/** Selects the v2 step tab at `index`, which swaps in that step's demo. */
function selectStep(index: number) {
  act(() => {
    fireEvent.click(screen.getAllByRole('tab')[index]!);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16),
  );
  FakeIntersectionObserver.instances = [];
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('LandingPage', () => {
  it('sets the page meta without breadcrumbs', () => {
    renderPage();
    expect(document.title).toBe('Cherrytree — Build your cofounder agreement');
    expect(breadcrumbs()).toEqual([]);
  });

  it('sends Get started to the dashboard', () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: 'Get started' })[0]!);
    expect(path()).toBe('/dashboard');
  });

  describe('features', () => {
    const tabs = () => screen.getAllByRole('tab');

    it('lists four steps and shows the invite demo first', () => {
      renderPage();
      expect(tabs().map((el) => el.textContent?.slice(0, 20))).toEqual([
        expect.stringContaining('Invite your cofou'),
        expect.stringContaining('Collab on the agre'),
        expect.stringContaining('Equity Calculator'),
        expect.stringContaining('Do a final review'),
      ]);
      expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('you@email.com')).toBeInTheDocument();
    });

    it('switches the demo when a step is selected', () => {
      renderPage();
      selectStep(2);
      expect(tabs()[2]).toHaveAttribute('aria-selected', 'true');
      expect(tabs()[0]).toHaveAttribute('aria-selected', 'false');
      expect(document.querySelector('.lp-s3-card')).toBeInTheDocument(); // equity demo
    });

    it('moves to the next step after the current demo has played through', () => {
      renderPage();
      advance(800 + 68 * 3);
      advance(60 * 1000);
      expect(tabs()[0]).toHaveAttribute('aria-selected', 'false');
    });

    it('invite demo: types an email, presses Add and lists the new teammate', () => {
      renderPage();
      const typed = () => document.querySelector('.lp-s1-input span')?.textContent;
      advance(800 + 68 * 3);
      expect(typed()).toBe('sara');
      advance(68 * ('sarah@vc.io'.length - 3) + 750);
      expect(document.querySelector('.lp-s1-btn')).toHaveClass('pressed');
      advance(180);
      expect(document.querySelector('.lp-s1-btn')).not.toHaveClass('pressed');
      expect(document.querySelector('.lp-s1-new .lp-s1-email')?.textContent).toBe('sarah@vc.io');
      expect(typed()).toBe('');
    });

    it('collab demo: answers the first question and marks it answered', () => {
      renderPage();
      selectStep(1);
      const questions = () => Array.from(document.querySelectorAll('.lp-s2-q'));
      expect(questions()[0]).toHaveClass('active');
      advance(80 + 65 * 'Acme Labs'.length + 700);
      expect(questions()[0]).toHaveClass('answered');
      advance(420);
      expect(questions()[1]).toHaveClass('active');
    });

    it('equity demo: slides importance to 5 and scores 8 then 3', () => {
      renderPage();
      selectStep(2);
      expect(screen.getByText('Cash Invested')).toBeInTheDocument();
      advance(120);
      expect(document.querySelector<HTMLElement>('.lp-s3-fill')?.style.width).toBe('50%');
      expect(document.querySelector('.lp-s3-val')?.textContent).toBe('5');
      advance(700);
      const rows = () => Array.from(document.querySelectorAll('.lp-s3-cf'));
      expect(within(rows()[0] as HTMLElement).getByText('8')).toHaveClass('selected');
      advance(420);
      expect(within(rows()[1] as HTMLElement).getByText('3')).toHaveClass('selected');
    });

    it('review demo: ticks the sections off one by one and fills the bar', () => {
      renderPage();
      selectStep(3);
      const rows = () => Array.from(document.querySelectorAll('.lp-s2r-row'));
      advance(500);
      expect(rows()[0]).toHaveClass('done');
      expect(document.querySelector<HTMLElement>('.lp-s2r-fill')?.style.width).toBe('20%');
      advance(650 * 4);
      expect(rows().every((row) => row.classList.contains('done'))).toBe(true);
    });
  });

  it('reveals scroll sections a tick after they intersect', () => {
    renderPage();
    const [reveal] = observersFor(0.06);
    expect(reveal?.options).toEqual({ threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
    const first = reveal!.observed[0]!;
    expect(first).toHaveClass('lp-rv');
    act(() => reveal!.intersect([first]));
    expect(first).not.toHaveClass('lp-rv-in');
    advance(0);
    expect(first).toHaveClass('lp-rv-in');
  });

  it('steps the carousel with the arrows and dots, wrapping around', () => {
    renderPage();
    const slides = () => Array.from(document.querySelectorAll('.lp-cs-slide'));
    const track = () => document.querySelector<HTMLElement>('.lp-carousel-track')!;
    expect(slides()[0]).toHaveClass('active');
    fireEvent.click(screen.getByRole('button', { name: '→' }));
    expect(slides()[1]).toHaveClass('active');
    expect(track().style.transform).toBe('translateX(calc(-1 * 380px))');
    fireEvent.click(screen.getByRole('button', { name: '←' }));
    fireEvent.click(screen.getByRole('button', { name: '←' }));
    expect(slides()[4]).toHaveClass('active');
    fireEvent.click(document.querySelectorAll('.lp-cs-dot')[2]!);
    expect(slides()[2]).toHaveClass('active');
    expect(document.querySelectorAll('.lp-cs-dot')[2]).toHaveClass('active');
  });

  it('opens an FAQ on click and closes it again', () => {
    renderPage();
    const question = 'Do you offer discounts?';
    expect(screen.queryByRole('button', { name: question })).toBeNull(); // pricing page's FAQ
    const q = 'Can I update the agreement later if things change?';
    expect(faqBody(q)).not.toHaveClass('open');
    fireEvent.click(screen.getByRole('button', { name: q }));
    expect(faqBody(q)).toHaveClass('open');
    fireEvent.click(screen.getByRole('button', { name: q }));
    expect(faqBody(q)).not.toHaveClass('open');
    expect(document.querySelectorAll('.lp-faq-item')).toHaveLength(5);
  });

  it('sweeps the hero and closing highlights in once they scroll into view', () => {
    renderPage();
    expect(heroMark()).toHaveTextContent('with great company.');
    expect(protectMark()).toHaveTextContent('peace of mind.');
    expect(heroMark()).not.toHaveClass('in');
    expect(protectMark()).not.toHaveClass('in');

    const [headlines] = observersFor(0.2);
    act(() => headlines!.intersect());
    expect(heroMark()).toHaveClass('in');
    expect(protectMark()).toHaveClass('in');
  });
});

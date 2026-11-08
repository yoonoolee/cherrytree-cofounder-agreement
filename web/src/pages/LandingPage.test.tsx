import { act, fireEvent, render, screen } from '@testing-library/react';
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
    private readonly callback: (
      entries: { isIntersecting: boolean; intersectionRatio: number; target: Element }[],
    ) => void,
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
    this.callback(
      targets.map((target) => ({ isIntersecting: true, intersectionRatio: 1, target })),
    );
  }
  /** Reports the targets as fully out of view. */
  leave(targets: Element[] = this.observed) {
    this.callback(
      targets.map((target) => ({ isIntersecting: false, intersectionRatio: 0, target })),
    );
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

// How it works pins its scene while the page scrolls through a tall track; jsdom has no layout,
// so give the track a position and size: it starts at y=1000 and pins for 3200px (4000 − 800).
const TRACK_TOP = 1000;
const PIN_LENGTH = 3200;
function layOutTrack() {
  const track = document.querySelector<HTMLElement>('.lp-feat-v2-track')!;
  const sticky = document.querySelector<HTMLElement>('.lp-feat-v2-sticky')!;
  Object.defineProperty(track, 'offsetHeight', { configurable: true, value: PIN_LENGTH + 800 });
  Object.defineProperty(sticky, 'offsetHeight', { configurable: true, value: 800 });
  track.getBoundingClientRect = () => ({ top: TRACK_TOP - window.scrollY }) as DOMRect;
}
/** Scroll position halfway through step `index`'s share of the pinned stretch. */
const stepScrollY = (index: number) => TRACK_TOP + ((index + 0.5) / 4) * PIN_LENGTH;
function scrollPage(y: number) {
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(16); // the scroll handler waits a frame
  });
}
/** Scrolls the page to step `index`, which swaps in that step's demo. */
function scrollToStep(index: number) {
  layOutTrack();
  scrollPage(stepScrollY(index));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16),
  );
  FakeIntersectionObserver.instances = [];
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
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

  it('shows the two self-serve plans', () => {
    renderPage();
    const plans = Array.from(document.querySelectorAll('#pricing .lp-pw-card'));
    expect(plans.map((p) => p.querySelector('.lp-pw-tier')?.textContent)).toEqual([
      'Bootstrapped',
      'Scale',
    ]);
    expect(plans[0]!.querySelector('.lp-pw-price')).toHaveTextContent('$20one-time');
    expect(plans[1]!.querySelector('.lp-pw-includes')).toHaveTextContent(
      'Everything in Bootstrapped, plus',
    );
  });

  it('lights the statement word by word as it scrolls up the screen', () => {
    renderPage();
    const text = document.querySelector<HTMLElement>('.lp-lit-text')!;
    // jsdom has no layout: the statement starts 1000px down the page.
    text.getBoundingClientRect = () => ({ top: 1000 - window.scrollY }) as DOMRect;
    const lit = () => text.querySelectorAll('span.on').length;
    const words = text.querySelectorAll('span').length;
    scrollPage(0); // below the fold
    expect(lit()).toBe(0);
    scrollPage(1000 - 800 * 0.55); // halfway through the lighting stretch
    expect(lit()).toBe(Math.round(words / 2));
    scrollPage(1000); // well past it
    expect(lit()).toBe(words);
  });

  it('sends Get started to the dashboard', () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: 'Get started' })[0]!);
    expect(path()).toBe('/dashboard');
  });

  describe('features', () => {
    const tabs = () => screen.getAllByRole('tab');

    it('lists four steps and shows the brain dump demo first', () => {
      renderPage();
      expect(tabs().map((el) => el.textContent?.slice(0, 20))).toEqual([
        expect.stringContaining('Just brain dump'),
        expect.stringContaining('Smart follow-ups'),
        expect.stringContaining('We draft it'),
        expect.stringContaining('Review and sign'),
      ]);
      expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Tell us about your company')).toBeInTheDocument();
    });

    it('picks the step from how far the page has scrolled through the pinned stretch', () => {
      renderPage();
      scrollToStep(2);
      expect(tabs()[2]).toHaveAttribute('aria-selected', 'true');
      expect(tabs()[0]).toHaveAttribute('aria-selected', 'false');
      expect(document.querySelector('.lp-dr-paper')).toBeInTheDocument(); // drafting demo
      scrollPage(TRACK_TOP + PIN_LENGTH * 2); // past the end stays on the last step
      expect(tabs()[3]).toHaveAttribute('aria-selected', 'true');
      scrollPage(0); // above the track stays on the first
      expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('scrolls to a step when its title is clicked', () => {
      const scrollTo = vi.fn();
      vi.stubGlobal('scrollTo', scrollTo);
      renderPage();
      layOutTrack();
      fireEvent.click(tabs()[1]!);
      expect(scrollTo).toHaveBeenCalledWith({ top: stepScrollY(1), behavior: 'smooth' });
    });

    it("brain dump demo: types the founder's notes and lists what Cherrytree picks up", () => {
      renderPage();
      const picks = () =>
        Array.from(document.querySelectorAll('.lp-s1-pick b')).map((el) => el.textContent);
      expect(picks()).toEqual([]);
      advance(
        600 + 28 * "Bill and I started Acme last spring. I'm CEO, Bill runs product as CTO".length,
      );
      expect(picks()).toEqual(['CEO · CTO']);
      expect(document.querySelector('.lp-s1-hit')?.textContent).toBe(
        "I'm CEO, Bill runs product as CTO",
      );
      advance(28 * 200);
      expect(picks()).toEqual(['CEO · CTO', '60 / 40', '$20k', 'Full-time', 'Both sign off']);
    });

    it('follow-up demo: Cherrytree asks, the founder answers', () => {
      renderPage();
      scrollToStep(1);
      const msgs = () => Array.from(document.querySelectorAll('.lp-fu-msg'));
      advance(400);
      expect(document.querySelector('.lp-fu-typing')).toBeInTheDocument();
      advance(1100);
      expect(msgs()).toHaveLength(1);
      expect(msgs()[0]).not.toHaveClass('user');
      advance(1600);
      expect(msgs()).toHaveLength(2);
      expect(msgs()[1]).toHaveClass('user');
    });

    it('draft demo: types the agreement out until the draft is ready', () => {
      renderPage();
      scrollToStep(2);
      const paper = () => document.querySelector('.lp-dr-paper')!;
      advance(400 + 14 * 20);
      expect(paper().querySelector('.lp-dr-p')?.textContent).toBe('This Agreement is ma');
      expect(paper().querySelector('.lp-dr-status')?.textContent).toBe('Drafting…');
      advance(14 * 450); // finished typing, before it loops
      expect(Array.from(paper().querySelectorAll('.lp-dr-h')).map((h) => h.textContent)).toEqual([
        '1. Equity',
        '2. Vesting',
        '3. Decisions',
      ]);
      expect(paper().querySelector('.lp-dr-status')?.textContent).toBe('Draft ready');
    });

    it('sign demo: edits the clause, then both cofounders sign', () => {
      renderPage();
      scrollToStep(3);
      const sigs = () => Array.from(document.querySelectorAll('.lp-sg-sig'));
      advance(700);
      expect(document.querySelector('.lp-sg-ins')?.textContent).toBe('unanimous written consent');
      advance(1200);
      expect(sigs()[0]).toHaveClass('signed');
      expect(sigs()[1]).not.toHaveClass('signed');
      advance(1000);
      expect(sigs()[1]).toHaveClass('signed');
      advance(800);
      expect(document.querySelector('.lp-sg-done')).toHaveClass('on');
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

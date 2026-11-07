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

    it('picks the step from how far the page has scrolled through the pinned stretch', () => {
      renderPage();
      scrollToStep(2);
      expect(tabs()[2]).toHaveAttribute('aria-selected', 'true');
      expect(tabs()[0]).toHaveAttribute('aria-selected', 'false');
      expect(document.querySelector('.lp-s3-card')).toBeInTheDocument(); // equity demo
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
      scrollToStep(1);
      const questions = () => Array.from(document.querySelectorAll('.lp-s2-q'));
      expect(questions()[0]).toHaveClass('active');
      advance(80 + 65 * 'Acme Labs'.length + 700);
      expect(questions()[0]).toHaveClass('answered');
      advance(420);
      expect(questions()[1]).toHaveClass('active');
    });

    it('equity demo: slides importance to 5 and scores 8 then 3', () => {
      renderPage();
      scrollToStep(2);
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
      scrollToStep(3);
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

  it('strikes through templates and lawyers, then lands on Cherrytree', () => {
    renderPage();
    const section = document.querySelector<HTMLElement>('#compare')!;
    expect(Array.from(section.querySelectorAll('.lp-strike')).map((el) => el.textContent)).toEqual([
      'A template from the internet.',
      'Thousands in legal fees.',
    ]);
    expect(section.querySelector('.lp-strike-win .lp-hl-mark')).toHaveTextContent('for $20.');
    // Strikes every time the lines come into view, resetting once they have left it.
    const lines = section.querySelector('.lp-strike-lines')!;
    const strike = FakeIntersectionObserver.instances.find((o) => o.observed.includes(lines))!;
    expect(lines).not.toHaveClass('in');
    act(() => strike.intersect());
    expect(lines).toHaveClass('in');
    act(() => strike.leave());
    expect(lines).not.toHaveClass('in');
    act(() => strike.intersect());
    expect(lines).toHaveClass('in');
    fireEvent.click(within(section).getByRole('button', { name: 'Get started' }));
    expect(path()).toBe('/dashboard');
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

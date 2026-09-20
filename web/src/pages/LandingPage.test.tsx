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
const heroTyped = () => document.querySelector('.lp-hero-headline em')?.textContent;
const protectTyped = () => document.querySelector('.lp-protect-cta em')?.textContent;
const featureItems = () => Array.from(document.querySelectorAll<HTMLElement>('.lp-feat-item'));
const observersFor = (threshold: number) =>
  FakeIntersectionObserver.instances.filter((o) => o.options?.threshold === threshold);
const faqBody = (question: string) =>
  screen.getByRole('button', { name: question }).parentElement?.querySelector('.lp-faq-body');

/** Scrolls so that the feature item at `index` sits nearest the middle of the viewport. */
function scrollToFeature(index: number) {
  featureItems().forEach((el, i) => {
    el.getBoundingClientRect = () => ({ top: i === index ? 300 : 2000, height: 100 }) as DOMRect;
  });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
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
  Reflect.deleteProperty(window, 'Tally');
});

describe('LandingPage', () => {
  it('sets the page meta without breadcrumbs', () => {
    renderPage();
    expect(document.title).toBe('Cherrytree — Build your cofounder agreement');
    expect(breadcrumbs()).toEqual([]);
  });

  describe('hero', () => {
    it('types the second headline line once and leaves the cursor', () => {
      const { unmount } = renderPage();
      expect(heroTyped()).toBe('');
      advance(600);
      expect(heroTyped()).toBe('w');
      advance(60 * 18);
      expect(heroTyped()).toBe('with great company.');
      advance(10_000);
      expect(heroTyped()).toBe('with great company.');
      expect(document.querySelector('.lp-hero-headline .lp-cursor')).toBeInTheDocument();
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('stops typing the headline when the page unmounts mid-way', () => {
      const { unmount } = renderPage();
      advance(600 + 60 * 3);
      expect(heroTyped()).toBe('with');
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('sends Get started to the dashboard and Book a demo to cal.com in a new tab', () => {
      renderPage();
      const demos = screen.getAllByRole('link', { name: 'Book a demo →' });
      expect(demos).toHaveLength(2); // hero + closing CTA
      for (const link of demos) {
        expect(link).toHaveAttribute('href', 'https://cal.com/tim-he/15min');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      fireEvent.click(screen.getAllByRole('button', { name: 'Get started' })[0]!);
      expect(path()).toBe('/dashboard');
    });

    it('plays the product mockup: types the equity answer, clicks Continue, moves to vesting', () => {
      renderPage();
      const screens = () => Array.from(document.querySelectorAll<HTMLElement>('.lp-hv-screen'));
      expect(screens()[0]).toHaveClass('active');
      expect(screen.getByText('30% Complete')).toBeInTheDocument();

      const eqText = () => document.querySelector('.lp-hv-input-field span')?.textContent;
      advance(2400 + 500);
      expect(eqText()).toBe('W');
      const answer = 'We agreed on an equal 50 / 50 split.';
      advance(44 * (answer.length - 1));
      expect(eqText()).toBe(answer);

      advance(44 + 900); // the tick after the last character parks the cursor
      expect(document.querySelector('.lp-hv-inp-cursor')).toHaveClass('off');
      advance(700);
      expect(document.querySelector('.lp-hv-continue')).toHaveClass('clicking');

      advance(260 + 160 + 120); // release, leave scene 0, enter scene 1
      expect(screens()[0]).not.toHaveClass('active');
      expect(screens()[1]).toHaveClass('active');
      expect(screen.getByText('42% Complete')).toBeInTheDocument();
      advance(700);
      expect(screens()[1]?.querySelectorAll('.lp-hv-opt')[1]).toHaveClass('selected');
    });
  });

  it('doubles the logo wall so it can loop', () => {
    renderPage();
    const logos = screen.getAllByRole('img');
    expect(logos).toHaveLength(14);
    expect(logos[0]).toHaveAttribute('alt', 'Y Combinator');
    expect(logos[7]).toHaveAttribute('alt', 'Y Combinator');
  });

  describe('features', () => {
    it('lists five steps and shows the invite demo first', () => {
      renderPage();
      expect(
        featureItems().map((el) => el.querySelector('.lp-feat-item-num')?.textContent),
      ).toEqual(['01', '02', '03', '04', '05']);
      expect(featureItems()[0]).toHaveClass('active');
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('you@email.com')).toBeInTheDocument();
    });

    it('switches the demo to the step nearest the middle of the viewport on scroll', () => {
      renderPage();
      scrollToFeature(2);
      expect(featureItems()[2]).toHaveClass('active');
      expect(featureItems()[0]).not.toHaveClass('active');
      expect(document.querySelector('.lp-s3-card')).toBeInTheDocument(); // equity demo
      scrollToFeature(4);
      expect(document.querySelector('.lp-s4-card')).toBeInTheDocument(); // expert chat
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
      scrollToFeature(1);
      const questions = () => Array.from(document.querySelectorAll('.lp-s2-q'));
      expect(questions()[0]).toHaveClass('active');
      advance(80 + 65 * 'Acme Labs'.length + 700);
      expect(questions()[0]).toHaveClass('answered');
      advance(420);
      expect(questions()[1]).toHaveClass('active');
    });

    it('equity demo: slides importance to 5 and scores 8 then 3', () => {
      renderPage();
      scrollToFeature(2);
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
      scrollToFeature(3);
      const rows = () => Array.from(document.querySelectorAll('.lp-s2r-row'));
      advance(500);
      expect(rows()[0]).toHaveClass('done');
      expect(document.querySelector<HTMLElement>('.lp-s2r-fill')?.style.width).toBe('20%');
      advance(650 * 4);
      expect(rows().every((row) => row.classList.contains('done'))).toBe(true);
    });

    it('expert demo: shows the question, a typing indicator, then the replies', () => {
      renderPage();
      scrollToFeature(4);
      const messages = () => Array.from(document.querySelectorAll('.lp-s4-msg'));
      expect(messages()).toHaveLength(1);
      expect(messages()[0]).toHaveClass('user');
      advance(1200);
      expect(document.querySelector('.lp-s4-typing')).toBeInTheDocument();
      advance(1300 + 280);
      expect(document.querySelector('.lp-s4-typing')).toBeNull();
      expect(messages()).toHaveLength(2);
      expect(messages()[1]).toHaveTextContent('Happy to help!');
    });
  });

  it('draws each stat in and counts it up as its row scrolls into view', () => {
    renderPage();
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.lp-stat-row'));
    expect(rows).toHaveLength(4);
    const statObservers = observersFor(0.4);
    expect(statObservers).toHaveLength(4);
    expect(rows[0]?.querySelector('.lp-stat-num')?.textContent).toBe('0+');

    act(() => statObservers[0]!.intersect());
    expect(rows[0]).toHaveClass('lp-line-in');
    expect(rows[1]).not.toHaveClass('lp-line-in');
    advance(1700);
    expect(rows[0]?.querySelector('.lp-stat-num')?.textContent).toBe('2,400+');

    act(() => statObservers[3]!.intersect());
    expect(rows[3]?.querySelector('.lp-stat-num')?.textContent).toBe('$0');
  });

  it('reveals scroll sections a tick after they intersect', () => {
    renderPage();
    const [reveal] = FakeIntersectionObserver.instances;
    expect(reveal?.options).toEqual({ threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
    const first = reveal!.observed[0]!;
    expect(first).toHaveClass('lp-rv');
    act(() => reveal!.intersect([first]));
    expect(first).not.toHaveClass('lp-rv-in');
    advance(0);
    expect(first).toHaveClass('lp-rv-in');
  });

  it('shows three testimonials', () => {
    renderPage();
    expect(screen.getByText('Maya R.')).toBeInTheDocument();
    expect(screen.getByText('James T.')).toBeInTheDocument();
    expect(screen.getByText('Sarah K.')).toBeInTheDocument();
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

  describe('pricing', () => {
    it('renders the three plans with their calls to action', () => {
      const openPopup = vi.fn();
      window.Tally = { openPopup };
      renderPage();
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.lp-pricing-card'));
      expect(cards.map((c) => c.querySelector('.lp-pricing-tier')?.textContent)).toEqual([
        'Bootstrapped',
        'Scale',
        'Enterprise',
      ]);
      expect(cards.map((c) => c.querySelector('.lp-pricing-price')?.textContent)).toEqual([
        '$200',
        '$2,000',
        'Custom',
      ]);
      expect(cards[1]).toHaveClass('featured');
      expect(cards[1]?.querySelector('.lp-pricing-badge')).toHaveTextContent('Most popular');
      expect(cards[2]?.querySelector('.lp-pricing-price')).toHaveClass('lp-pricing-price-custom');
      expect(cards.map((c) => c.querySelector('.lp-pricing-cta')?.className)).toEqual([
        'lp-pricing-cta outline',
        'lp-pricing-cta filled',
        'lp-pricing-cta solid',
      ]);

      fireEvent.click(within(cards[1]!).getByRole('button', { name: 'Get started' }));
      expect(path()).toBe('/dashboard');
      fireEvent.click(screen.getByRole('button', { name: 'Contact sales' }));
      expect(openPopup).toHaveBeenCalledWith('2EEB99', { layout: 'modal', width: 700 });
    });

    it('gives the Enterprise card the Bootstrapped height, also after a resize', () => {
      const offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get');
      offsetHeight.mockReturnValue(480);
      renderPage();
      const enterprise = document.querySelectorAll<HTMLElement>('.lp-pricing-card')[2];
      expect(enterprise?.style.height).toBe('480px');
      offsetHeight.mockReturnValue(520);
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(enterprise?.style.height).toBe('520px');
      offsetHeight.mockRestore();
    });
  });

  it('opens an FAQ on hover or click and closes it again', () => {
    renderPage();
    const question = 'Do you offer discounts?';
    expect(screen.queryByRole('button', { name: question })).toBeNull(); // pricing page's FAQ
    const q = 'How long does it take to complete with Cherrytree?';
    const item = screen.getByRole('button', { name: q }).parentElement!;
    expect(faqBody(q)).not.toHaveClass('open');
    fireEvent.mouseEnter(item);
    expect(faqBody(q)).toHaveClass('open');
    fireEvent.mouseLeave(item);
    expect(faqBody(q)).not.toHaveClass('open');
    fireEvent.click(screen.getByRole('button', { name: q }));
    expect(faqBody(q)).toHaveClass('open');
    fireEvent.click(screen.getByRole('button', { name: q }));
    expect(faqBody(q)).not.toHaveClass('open');
    expect(document.querySelectorAll('.lp-faq-item')).toHaveLength(6);
  });

  it('types the closing line out, holds, and starts over; unmount stops the timers', () => {
    const { unmount } = renderPage();
    const line = 'and your peace of mind.';
    expect(protectTyped()).toBe('');
    advance(600 + 46);
    expect(protectTyped()).toBe('a');
    advance(46 * (line.length - 1));
    expect(protectTyped()).toBe(line);
    advance(46 + 2200);
    expect(protectTyped()).toBe('');
    advance(46);
    expect(protectTyped()).toBe('a');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

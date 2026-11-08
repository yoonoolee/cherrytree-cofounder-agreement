import {
  useState,
  useEffect,
  useRef,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { usePageMeta } from '../hooks/usePageMeta.ts';
import MarketingNav from '../components/MarketingNav.tsx';
import MarketingFooter from '../components/MarketingFooter.tsx';
import MarketingGrain from '../components/MarketingGrain.tsx';
import { goToDashboard } from '../utils/goToDashboard.ts';
import { MARKETING_PLANS } from '../constants/pricing.ts';
import PlanCards from '../components/PlanCards.tsx';

type Timer = ReturnType<typeof setTimeout>;

// ── Panel sub-components ───────────────────────────────────────────────────────

const S1_DUMP =
  "Bill and I started Acme last spring. I'm CEO, Bill runs product as CTO. " +
  "We're thinking 60/40 since I put in the first $20k. Both full-time, and anything over $10k needs both of us.";
// Phrases Cherrytree "picks up" as they're typed: highlighted in the text, listed below.
const S1_PICKS = [
  { phrase: "I'm CEO, Bill runs product as CTO", label: 'Roles', value: 'CEO · CTO' },
  { phrase: '60/40', label: 'Equity', value: '60 / 40' },
  { phrase: '$20k', label: 'Cash invested', value: '$20k' },
  { phrase: 'full-time', label: 'Commitment', value: 'Full-time' },
  { phrase: 'anything over $10k needs both of us', label: 'Big decisions', value: 'Both sign off' },
].map((p) => {
  const start = S1_DUMP.indexOf(p.phrase);
  return { ...p, start, end: start + p.phrase.length };
});
// The text split into plain runs and picked phrases, in order.
const S1_SEGMENTS = S1_PICKS.reduce<{ text: string; start: number; pick: boolean }[]>(
  (segs, p, i) => {
    const from = i === 0 ? 0 : S1_PICKS[i - 1]!.end;
    segs.push({ text: S1_DUMP.slice(from, p.start), start: from, pick: false });
    segs.push({ text: p.phrase, start: p.start, pick: true });
    if (i === S1_PICKS.length - 1) {
      segs.push({ text: S1_DUMP.slice(p.end), start: p.end, pick: false });
    }
    return segs;
  },
  [],
);
const S1_CHAR_MS = 28;

function PanelBrainDump() {
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    const timers: Timer[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const run = () => {
      setTyped(0);
      for (let i = 1; i <= S1_DUMP.length; i++) t(() => setTyped(i), i * S1_CHAR_MS);
      t(run, S1_DUMP.length * S1_CHAR_MS + 2800);
    };
    t(run, 600);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/ambient.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-white">
        <div className="lp-fp-content">
          <div className="lp-fp-tag">Step 1</div>
          <div className="lp-fp-title">Tell us about your company</div>
          <div className="lp-s1-card">
            <div className="lp-s1-dump">
              {S1_SEGMENTS.map((seg) => {
                const shown = seg.text.slice(0, Math.max(0, typed - seg.start));
                if (!shown) return null;
                const hit = seg.pick && typed >= seg.start + seg.text.length;
                return (
                  <span key={seg.start} className={hit ? 'lp-s1-hit' : undefined}>
                    {shown}
                  </span>
                );
              })}
              <span className="lp-icursor lp-dark" />
            </div>
            <div className="lp-s1-label">Cherrytree picked up</div>
            <div className="lp-s1-picks">
              {S1_PICKS.filter((p) => typed >= p.end).map((p) => (
                <div key={p.label} className="lp-s1-pick">
                  <span>{p.label}</span>
                  <b>{p.value}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S2_MSGS = [
  {
    text: 'You mentioned putting in the first $20k. Was that for equity, or a loan to the company?',
    bot: true,
  },
  { text: "For equity. It's part of why I'm at 60%.", bot: false },
  {
    text: 'Got it. If someone leaves in the first year, what happens to their unvested shares?',
    bot: true,
  },
  { text: 'They go back to the company.', bot: false },
];

function PanelFollowUps() {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const timers: Timer[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const show = (i: number) => {
      if (i >= S2_MSGS.length) {
        t(() => {
          setShown(0);
          show(0);
        }, 2200);
        return;
      }
      if (S2_MSGS[i]!.bot) {
        setTyping(true);
        t(() => {
          setTyping(false);
          setShown(i + 1);
          t(() => show(i + 1), 1600);
        }, 1100);
      } else {
        setShown(i + 1);
        t(() => show(i + 1), 1200);
      }
    };
    t(() => show(0), 400);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/wall.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-white">
        <div className="lp-fp-content">
          <div className="lp-fp-tag">Step 2</div>
          <div className="lp-fp-title">A few follow-ups</div>
          <div className="lp-fu-card">
            <div className="lp-fu-head">
              <div className="lp-fu-avatar">C</div>
              <div>
                <div className="lp-fu-name">Cherrytree</div>
                <div className="lp-fu-role">Following up on your answers</div>
              </div>
            </div>
            <div className="lp-fu-msgs">
              {S2_MSGS.slice(0, shown).map((m, i) => (
                <div key={i} className={`lp-fu-msg${m.bot ? '' : ' user'}`}>
                  {m.text}
                </div>
              ))}
              {typing && (
                <div className="lp-fu-typing">
                  <div className="lp-fu-dot" />
                  <div className="lp-fu-dot" />
                  <div className="lp-fu-dot" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The agreement types itself out, heading by heading.
const S3_BLOCKS = [
  {
    kind: 'p',
    text: 'This Agreement is made between Steve Bobs and Bill Dates (the "Cofounders") of Acme Labs, Inc. (the "Company").',
  },
  { kind: 'h', text: '1. Equity' },
  {
    kind: 'p',
    text: "The Company's shares are allocated 60% to Steve Bobs and 40% to Bill Dates.",
  },
  { kind: 'h', text: '2. Vesting' },
  {
    kind: 'p',
    text: 'Shares vest monthly over four years. Unvested shares return to the Company if a Cofounder leaves.',
  },
  { kind: 'h', text: '3. Decisions' },
  { kind: 'p', text: 'Any expense over $10,000 requires the approval of both Cofounders.' },
].reduce<{ kind: string; text: string; start: number }[]>((blocks, b) => {
  const prev = blocks[blocks.length - 1];
  blocks.push({ ...b, start: prev ? prev.start + prev.text.length : 0 });
  return blocks;
}, []);
const S3_TOTAL = S3_BLOCKS.reduce((n, b) => n + b.text.length, 0);
const S3_CHAR_MS = 14;

function PanelDraft() {
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    const timers: Timer[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const run = () => {
      setTyped(0);
      for (let i = 1; i <= S3_TOTAL; i++) t(() => setTyped(i), 400 + i * S3_CHAR_MS);
      t(run, 400 + S3_TOTAL * S3_CHAR_MS + 2600);
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  const ready = typed === S3_TOTAL;
  const visible = S3_BLOCKS.filter((b) => typed > b.start);
  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/leaf.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-white">
        <div className="lp-fp-content">
          <div className="lp-fp-tag">Step 3</div>
          <div className="lp-fp-title">Your agreement, drafted</div>
          <div className="lp-dr-paper">
            <span className={`lp-dr-status${ready ? ' ready' : ''}`}>
              {ready ? 'Draft ready' : 'Drafting…'}
            </span>
            <div className="lp-dr-doc-title">Cofounder Agreement</div>
            <div className="lp-dr-doc-sub">Acme Labs, Inc.</div>
            {visible.map((b, i) => {
              const Tag = b.kind === 'h' ? 'h4' : 'p';
              return (
                <Tag key={b.start} className={b.kind === 'h' ? 'lp-dr-h' : 'lp-dr-p'}>
                  {b.text.slice(0, typed - b.start)}
                  {i === visible.length - 1 && !ready && <span className="lp-icursor lp-dark" />}
                </Tag>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const S4_SIGNERS = ['Steve Bobs', 'Bill Dates'];

function PanelSign() {
  // 0 draft, 1 edited, 2 first signature, 3 second signature, 4 fully signed
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers: Timer[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const run = () => {
      setPhase(0);
      [700, 1900, 2900, 3700].forEach((ms, i) => t(() => setPhase(i + 1), ms));
      t(run, 6200);
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/paper.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-white">
        <div className="lp-fp-content">
          <div className="lp-fp-tag">Step 4</div>
          <div className="lp-fp-title">Review and sign</div>
          <div className="lp-sg-card">
            <div className="lp-s1-label">4. Decision-Making</div>
            <p className="lp-sg-clause">
              Spending over $10,000, raising money or selling the company requires{' '}
              {phase >= 1 ? (
                <>
                  <span className="lp-sg-del">both cofounders</span>{' '}
                  <span className="lp-sg-ins">unanimous written consent</span>
                </>
              ) : (
                'both cofounders'
              )}
              .
            </p>
            <div className="lp-s1-label">Signatures</div>
            <div className="lp-sg-sigs">
              {S4_SIGNERS.map((name, i) => (
                <div key={name} className={`lp-sg-sig${phase >= i + 2 ? ' signed' : ''}`}>
                  <div className="lp-sg-ink">{phase >= i + 2 ? name : ''}</div>
                  <div className="lp-sg-name">{name}</div>
                </div>
              ))}
            </div>
            <div className={`lp-sg-done${phase >= 4 ? ' on' : ''}`}>✓ Signed by all cofounders</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PANELS: readonly ComponentType[] = [PanelBrainDump, PanelFollowUps, PanelDraft, PanelSign];

const AGREEMENT_SECTIONS = [
  {
    tab: 'coverage',
    title: 'Covers everything that matters.',
    desc: 'One complete agreement across 10 sections, from equity and roles to IP and non-competes.',
    wide: true,
  },
  {
    tab: 'conversations',
    title: 'No awkward convos later.',
    desc: 'The hard topics get settled now, while everyone still gets along.',
  },
  {
    tab: 'clarity',
    title: 'Clear from day one.',
    desc: 'Who owns what, who does what, who decides what, all in writing.',
  },
  {
    tab: 'protection',
    title: 'Ready for anything.',
    desc: 'If someone leaves, steps back or stops pulling their weight, you already know what happens.',
  },
  {
    tab: 'ease',
    title: 'Done in one sitting.',
    desc: 'Answer in your own words, review the draft and sign. No weeks of back-and-forth with a lawyer.',
  },
] as const;

const AG_COVERAGE = [
  'Formation & purpose',
  'Cofounders & roles',
  'Equity allocation',
  'Vesting',
  'Decision-making',
  'Intellectual property',
  'Compensation & expenses',
  'Performance expectations',
  'Non-compete & non-solicit',
  'General provisions',
];

// Panel color behind each section's example, in the same order as AGREEMENT_SECTIONS.
// Muted tints drawn from the blossom painting: hill sage, blossom, cloud, sky, meadow — ordered so
// warm and cool tones alternate across the bento grid rather than splitting by row.
const AG_TINTS = ['#c6d0c1', '#e4d4d1', '#e6e1d8', '#ccd6df', '#d0d3b6'] as const;

const agRow = (label: string, value: string) => (
  <div className="lp-agv-row">
    <span>{label}</span>
    <b>{value}</b>
  </div>
);

// One small example visual per agreement section, in the same order as AGREEMENT_SECTIONS.
const AG_VISUALS: readonly ReactNode[] = [
  <>
    <div className="lp-agv-head">Cofounder Agreement · 10 sections</div>
    <div className="lp-agv-list">
      {AG_COVERAGE.map((item) => (
        <span key={item}>
          <b className="lp-agv-check">✓</b> {item}
        </span>
      ))}
    </div>
  </>,
  <>
    <div className="lp-agv-head">The hard topics</div>
    {['Who gets what', 'What if someone leaves', 'Who has the final say'].map((topic) => (
      <div key={topic} className="lp-agv-row">
        <span>{topic}</span>
        <b className="lp-agv-check">✓ Agreed</b>
      </div>
    ))}
  </>,
  <>
    <div className="lp-agv-head">Ownership</div>
    <div className="lp-agv-bar">
      <div className="lp-agv-seg dark" style={{ flex: 60 }}>
        <span>Steve Bobs</span>
        <b>60%</b>
      </div>
      <div className="lp-agv-seg light" style={{ flex: 40 }}>
        <span>Bill Dates</span>
        <b>40%</b>
      </div>
    </div>
    <div className="lp-agv-gap" />
    {agRow('Roles', 'CEO · CTO')}
    {agRow('Major decisions', 'Both cofounders')}
  </>,
  <>
    <div className="lp-agv-head">If a cofounder leaves</div>
    {agRow('At month 8', 'Keeps 0%')}
    {agRow('At year 2', 'Keeps 50%')}
    {agRow('At year 4', 'Keeps 100%')}
  </>,
  <>
    <div className="lp-agv-head">Time to a signed agreement</div>
    {agRow('Templates', 'Guesswork')}
    {agRow('Lawyers', 'Weeks')}
    <div className="lp-agv-row">
      <span>Cherrytree</span>
      <b className="lp-agv-check">One sitting</b>
    </div>
  </>,
];

const V2_STEPS = 4;

const FEATURES = [
  {
    num: '01',
    panel: 0,
    title: 'Just brain dump',
    desc: "No rigid form. Talk through your company in your own words, from who's involved to how you think about equity, and Cherrytree pulls out what matters.",
    short: 'Answer in your own words. We pull out what matters.',
  },
  {
    num: '02',
    panel: 1,
    title: 'Smart follow-ups',
    desc: "Questions adapt to what you've said. Cherrytree asks follow-ups only where something is missing or unclear, so nothing important slips through.",
    short: 'Follow-up questions based on your answers, so nothing gets missed.',
  },
  {
    num: '03',
    panel: 2,
    title: 'We draft it',
    desc: 'Cherrytree turns your answers into a complete Cofounder Agreement covering equity, vesting, roles, IP and decision-making.',
    short: 'A complete agreement, drafted from your answers.',
  },
  {
    num: '04',
    panel: 3,
    title: 'Review and sign',
    desc: "Read through your draft, edit anything you want, and sign when everyone's on the same page.",
    short: 'Review, edit if needed, and sign.',
  },
];

// The self-serve plans shown on the landing page (Enterprise lives on the pricing page).
const LANDING_PLANS = MARKETING_PLANS.filter((p) => !p.enterprise);

// Section titles whose words light up one by one as they scroll up the screen.
const LIT_HOW_IT_WORKS =
  "You don't need to speak legalese to protect what you're building. You just tell your " +
  "story and we'll handle the rest.";
const LIT_PRICING =
  "Templates can't ask the right questions and lawyers can't answer them for lunch money. " +
  'Cherrytree does both.';
const LIT_WHAT_YOU_GET =
  'In 1976, Steve Jobs and Steve Wozniak signed a partnership agreement in a garage. Apple came after.';

function ScrollLitStatement({ text }: { text: string }) {
  const words = text.split(' ');
  const ref = useRef<HTMLHeadingElement>(null);
  // With reduced motion the whole statement is lit from the start and never animates.
  const [reducedMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);
  const lit = Math.round(progress * words.length);
  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const vh = window.innerHeight;
      // Starts lighting as the text's top passes 80% down the screen; done by 30%.
      const progress = (vh * 0.8 - el.getBoundingClientRect().top) / (vh * 0.5);
      setProgress(Math.min(1, Math.max(0, progress)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return (
    <h2 className="lp-lit-text" ref={ref}>
      {words.map((word, i) => (
        <span key={i} className={i < lit ? 'on' : undefined}>
          {word}{' '}
        </span>
      ))}
    </h2>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function LandingPage() {
  const navigate = useNavigate();
  usePageMeta({
    title: 'Cherrytree — Build your cofounder agreement',
    description:
      'Answer guided questions with your cofounders and get a complete Cofounder Agreement. No sketchy templates, no overpriced lawyers.',
  });

  // Hero headline — the green highlight sweeps in once, when scrolled into view
  const heroHeadlineRef = useRef<HTMLHeadingElement>(null);
  const [heroInView, setHeroInView] = useState(false);
  const [v2Feature, setV2Feature] = useState(0);
  // How it works: the scene and titles stay pinned while the page scrolls through a tall track;
  // how far through the pinned stretch you are picks the step.
  const v2TrackRef = useRef<HTMLDivElement>(null);
  const v2StickyRef = useRef<HTMLDivElement>(null);
  // Where the pinned stretch starts (page scroll position) and how long it lasts.
  const v2PinRange = () => {
    const track = v2TrackRef.current;
    const sticky = v2StickyRef.current;
    if (!track || !sticky) return null;
    const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
    const start = track.getBoundingClientRect().top + window.scrollY - stickyTop;
    return { start, length: track.offsetHeight - sticky.offsetHeight };
  };
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const range = v2PinRange();
      if (!range) return;
      const progress =
        range.length > 0
          ? Math.min(1, Math.max(0, (window.scrollY - range.start) / range.length))
          : 0;
      setV2Feature(Math.min(V2_STEPS - 1, Math.floor(progress * V2_STEPS)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  // Clicking a step title scrolls to where that step shows.
  const scrollToV2Step = (i: number) => {
    const range = v2PinRange();
    if (!range) return;
    window.scrollTo({
      top: range.start + ((i + 0.5) / V2_STEPS) * range.length,
      behavior: 'smooth',
    });
  };
  // Protect CTA: the green highlight behind "peace of mind." sweeps in once, when scrolled into view.
  const protectHeadlineRef = useRef<HTMLHeadingElement>(null);
  const [protectInView, setProtectInView] = useState(false);

  const { hash } = useLocation();

  const goDash = () => goToDashboard(navigate);

  // Arriving as /#section (the nav's "How it works") — ResetPagePosition has just scrolled to the
  // top, so scroll to the target section after it.
  useEffect(() => {
    const id = hash.replace('#', '');
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  // Trigger each typewriter once, the first time its headline scrolls into view.
  useEffect(() => {
    const targets: [HTMLElement | null, (v: boolean) => void][] = [
      [heroHeadlineRef.current, setHeroInView],
      [protectHeadlineRef.current, setProtectInView],
    ];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const hit = targets.find(([el]) => el === entry.target);
          if (entry.isIntersecting && hit) {
            obs.unobserve(entry.target);
            hit[1](true);
          }
        });
      },
      { threshold: 0.2 },
    );
    targets.forEach(([el]) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Scroll reveal — fades/slides in each .lp-rv/.lp-rv-l/.lp-rv-r element once as it enters view.
  // Elements already in the viewport at observe() time can have their IntersectionObserver
  // callback fire before the browser has committed a style pass with the base (opacity:0)
  // styles, which causes the transition to opacity:1 to never run (position:sticky elements
  // are especially prone to this — a synchronous reflow read isn't enough to flush their
  // state). Deferring the class add to a fresh macrotask guarantees a real paint of the
  // "from" state happens first, regardless of the element's positioning scheme.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.lp-rv, .lp-rv-l, .lp-rv-r');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          if (entry.isIntersecting && target instanceof HTMLElement) {
            obs.unobserve(target);
            void target.offsetHeight;
            setTimeout(() => target.classList.add('lp-rv-in'), 0);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const V2Panel = PANELS[FEATURES[v2Feature]!.panel]!;

  return (
    <div className="lp lp-has-curtain">
      <MarketingGrain />
      <MarketingNav />

      {/* The page sits on a raised "curtain" with a rounded bottom that scrolls up to reveal the
          footer pinned behind it. */}
      <div className="lp-curtain">
        {/* ── Hero ── */}
        <section className="lp-hero">
          <h1 className="lp-hero-headline" ref={heroHeadlineRef}>
            <span className="lp-hl-line">
              <span className="lp-hl-inner">Great companies start</span>
            </span>
            <span className="lp-hl-line lp-d1">
              <span className="lp-hl-inner">
                <span className={`lp-hl-mark${heroInView ? ' in' : ''}`}>with great company.</span>
              </span>
            </span>
          </h1>
          <p className="lp-hero-sub">
            Answer guided questions with your cofounders and get a complete Cofounder Agreement. No
            sketchy templates or overpriced lawyers.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={goDash}>
              Get started
            </button>
          </div>

          <div className="lp-hero-strip">
            <div className="lp-hero-strip-placeholder" />
          </div>
        </section>

        {/* ── Features v2 (draft — for comparison with the section above) ── */}
        <section className="lp-features" id="features-v2">
          <div className="lp-feat-header lp-lit-header">
            <ScrollLitStatement text={LIT_HOW_IT_WORKS} />
          </div>
          <div className="lp-feat-scroll lp-feat-v2-track" ref={v2TrackRef}>
            <div className="lp-feat-v2-sticky" ref={v2StickyRef}>
              <div className="lp-feat-v2-scene lp-rv lp-d2">
                <div className="lp-feat-v2-grain" aria-hidden="true" />
                <V2Panel key={v2Feature} />
              </div>
              <div className="lp-feat-v2-tabs" role="tablist">
                {FEATURES.map((f, i) => (
                  <button
                    key={f.num}
                    type="button"
                    role="tab"
                    aria-selected={v2Feature === i}
                    className={`lp-feat-v2-tab${v2Feature === i ? ' active' : ''}`}
                    onClick={() => scrollToV2Step(i)}
                  >
                    <span className="lp-feat-v2-tab-title">{f.title}</span>
                    {v2Feature === i && <span className="lp-feat-v2-tab-desc">{f.short}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── What's in your agreement ── */}
        <section className="lp-features" id="agreement">
          <div className="lp-feat-scroll">
            <div className="lp-feat-header lp-lit-header">
              <ScrollLitStatement text={LIT_WHAT_YOU_GET} />
            </div>
            <div className="lp-bento lp-rv">
              {AGREEMENT_SECTIONS.map((item, i) => (
                <article
                  key={item.tab}
                  className={`lp-bento-tile${'wide' in item ? ' lp-bento-wide' : ''}`}
                >
                  <div
                    className="lp-bento-vis"
                    style={{ '--ag-tint': AG_TINTS[i] } as CSSProperties}
                  >
                    <div className="lp-feat-v2-grain" aria-hidden="true" />
                    <div className="lp-bento-mini">{AG_VISUALS[i]}</div>
                  </div>
                  <div className="lp-bento-copy">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing: the two self-serve plans on one white card ── */}
        <section className="lp-features" id="pricing">
          <div className="lp-feat-scroll">
            <div className="lp-feat-header lp-lit-header">
              <ScrollLitStatement text={LIT_PRICING} />
            </div>
            <PlanCards plans={LANDING_PLANS} onStart={goDash} />
          </div>
        </section>

        {/* ── Protect CTA ── */}
        <section className="lp-protect-cta">
          <h2 ref={protectHeadlineRef}>
            <span className="lp-hl-line">
              <span className="lp-hl-inner">Protect your piece of the pie</span>
            </span>
            <span className="lp-hl-line">
              <span className="lp-hl-inner">
                and your{' '}
                <span className={`lp-hl-mark${protectInView ? ' in' : ''}`}>peace of mind.</span>
              </span>
            </span>
          </h2>
          <div className="lp-protect-cta-actions lp-rv lp-d1">
            <button className="lp-btn-primary" onClick={goDash}>
              Get started
            </button>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}

export default LandingPage;

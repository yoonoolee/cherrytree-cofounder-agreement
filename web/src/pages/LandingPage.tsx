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

type Timer = ReturnType<typeof setTimeout>;

// ── Panel sub-components ───────────────────────────────────────────────────────

const S1_EMAILS = ['sarah@vc.io', 'priya@buildit.co', 'james@founder.io'];

function PanelInvite() {
  const [typed, setTyped] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [emailIdx, setEmailIdx] = useState(0);
  useEffect(() => {
    const timers: Timer[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    let idx = 0;
    const type = () => {
      const email = S1_EMAILS[idx % S1_EMAILS.length]!;
      setTyped('');
      setShowNew(false);
      email.split('').forEach((_, i) => t(() => setTyped(email.slice(0, i + 1)), i * 68));
      t(submit, email.length * 68 + 750);
    };
    const submit = () => {
      setPressed(true);
      t(() => {
        setPressed(false);
        setEmailIdx(idx);
        setShowNew(true);
        setTyped('');
        t(() => {
          setShowNew(false);
          idx++;
          type();
        }, 2000);
      }, 180);
    };
    t(type, 800);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/ambient.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-white">
        <div className="lp-fp-content">
          <div className="lp-fp-tag">Step 1</div>
          <div className="lp-fp-title">Invite your cofounders</div>
          <div className="lp-s1-card">
            <div className="lp-s1-label">Team</div>
            <div className="lp-s1-row">
              <span className="lp-dot green" />
              <span className="lp-s1-email">you@email.com</span>
              <span className="lp-badge owner">Owner</span>
            </div>
            <div className="lp-s1-row">
              <span className="lp-dot light" />
              <span className="lp-s1-email">alex@startup.co</span>
              <span className="lp-badge added">Added</span>
            </div>
            {showNew && (
              <div className="lp-s1-row lp-s1-new">
                <span className="lp-dot light" />
                <span className="lp-s1-email">{S1_EMAILS[emailIdx % S1_EMAILS.length]}</span>
                <span className="lp-badge added">Added</span>
              </div>
            )}
            <div className="lp-s1-input-row">
              <div className="lp-s1-input">
                <span>{typed}</span>
                {!showNew && <span className="lp-icursor lp-dark" />}
              </div>
              <button className={`lp-s1-btn${pressed ? ' pressed' : ''}`}>+ Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S2_QUESTIONS = [
  { q: "What's your company's name?", a: 'Acme Labs' },
  { q: "What's the legal structure?", a: 'C-Corp' },
  { q: 'What state will you register in?', a: 'Delaware' },
  { q: 'Describe your company in one line.', a: 'AI tools for founders.' },
];

function PanelCollab() {
  const [answered, setAnswered] = useState<number[]>([]);
  const [activeQ, setActiveQ] = useState(0);
  const [typed, setTyped] = useState('');
  useEffect(() => {
    const timers: Timer[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const runQuestion = (idx: number) => {
      if (idx >= S2_QUESTIONS.length) {
        t(() => {
          setAnswered([]);
          setActiveQ(0);
          setTyped('');
          t(() => runQuestion(0), 300);
        }, 1600);
        return;
      }
      setActiveQ(idx);
      setTyped('');
      const target = S2_QUESTIONS[idx]!.a;
      t(() => {
        target.split('').forEach((_, ci) => t(() => setTyped(target.slice(0, ci + 1)), ci * 65));
        t(
          () => {
            setAnswered((p) => [...p, idx]);
            t(() => runQuestion(idx + 1), 420);
          },
          target.length * 65 + 700,
        );
      }, 80);
    };
    runQuestion(0);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/wall.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-white">
        <div className="lp-fp-content">
          <div className="lp-fp-tag">Step 2</div>
          <div className="lp-fp-title">Collab on the agreement</div>
          <div className="lp-s2-card">
            <div className="lp-s1-label">Formation &amp; Purpose</div>
            {S2_QUESTIONS.map((q, i) => (
              <div
                key={i}
                className={`lp-s2-q${answered.includes(i) ? ' answered' : ''}${activeQ === i ? ' active' : ''}`}
              >
                <div className="lp-s2-q-row">
                  <span className="lp-s2-q-text">{q.q}</span>
                  <span className="lp-s2-q-answer">{q.a}</span>
                  <span className="lp-s2-check">✓</span>
                </div>
                <div className="lp-s2-body">
                  <div className="lp-s2-body-inner">
                    <div className="lp-s2-input">
                      <span>{activeQ === i ? typed : ''}</span>
                      <span className="lp-icursor lp-dark" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const S3_CATEGORIES = [
  { name: 'Cash Invested', count: '1 / 18', imp: 5, scores: [8, 3] },
  { name: 'Time Commitment', count: '2 / 18', imp: 8, scores: [9, 7] },
  { name: 'Idea Origination', count: '3 / 18', imp: 6, scores: [7, 10] },
];
const S3_NAMES = ['Alex Chen', 'Jordan Lee'];

function PanelEquity() {
  const [idx, setIdx] = useState(0);
  const [sliderPct, setSliderPct] = useState(0);
  const [sliderTransition, setSliderTransition] = useState(false);
  const [sliderVal, setSliderVal] = useState<number | null>(null);
  const [selected, setSelected] = useState<(number | null)[]>([null, null]);
  useEffect(() => {
    const timers: Timer[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const run = (i: number) => {
      setIdx(i);
      setSliderPct(0);
      setSliderTransition(false);
      setSliderVal(null);
      setSelected([null, null]);
      const step = S3_CATEGORIES[i]!;
      t(() => {
        setSliderTransition(true);
        setSliderPct(step.imp * 10);
        setSliderVal(step.imp);
      }, 120);
      step.scores.forEach((score, ci) => {
        t(
          () =>
            setSelected((prev) => {
              const n = [...prev];
              n[ci] = score;
              return n;
            }),
          700 + ci * 420,
        );
      });
      const totalDelay = 700 + step.scores.length * 420 + 800;
      t(() => run((i + 1) % S3_CATEGORIES.length), totalDelay);
    };
    run(0);
    return () => timers.forEach(clearTimeout);
  }, []);

  const cat = S3_CATEGORIES[idx]!;
  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/leaf.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-white">
        <div className="lp-fp-content">
          <div className="lp-fp-tag">Step 3</div>
          <div className="lp-fp-title">Equity Calculator</div>
          <div className="lp-s3-card">
            <div className="lp-s3-top">
              <span className="lp-s3-category">{cat.name}</span>
              <span className="lp-s3-counter">{cat.count}</span>
            </div>
            <div className="lp-s1-label">How important is this?</div>
            <div className="lp-s3-slider-row">
              <div className="lp-s3-track">
                <div
                  className="lp-s3-fill"
                  style={{
                    width: `${sliderPct}%`,
                    transition: sliderTransition ? 'width 0.7s cubic-bezier(0.16,1,0.3,1)' : 'none',
                  }}
                />
                <div
                  className="lp-s3-thumb"
                  style={{
                    left: `${sliderPct}%`,
                    transition: sliderTransition ? 'left 0.7s cubic-bezier(0.16,1,0.3,1)' : 'none',
                  }}
                />
              </div>
              <span className="lp-s3-val">{sliderVal ?? '—'}</span>
            </div>
            <div className="lp-s1-label" style={{ marginTop: 10 }}>
              Score each cofounder
            </div>
            {S3_NAMES.map((name, i) => (
              <div key={i} className="lp-s3-cf">
                <div className="lp-s3-cf-name">{name}</div>
                <div className="lp-s3-dots">
                  {Array.from({ length: 10 }, (_, d) => (
                    <div key={d} className={`lp-s3-dot${selected[i] === d + 1 ? ' selected' : ''}`}>
                      {d + 1}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const S2R_SECTIONS = [
  'Formation & Purpose',
  'Cofounder Info',
  'Equity Allocation',
  'Vesting Schedule',
  'Decision-Making',
];

function PanelReview() {
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => {
    const timers: Timer[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const run = () => {
      setDone([]);
      S2R_SECTIONS.forEach((_, i) => t(() => setDone((p) => [...p, i]), 500 + i * 650));
      t(run, 500 + S2R_SECTIONS.length * 650 + 2000);
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  const pct = (done.length / S2R_SECTIONS.length) * 100;
  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/paper.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-white">
        <div className="lp-fp-content">
          <div className="lp-fp-tag">Step 4</div>
          <div className="lp-fp-title">Do a final review</div>
          <div className="lp-s2r-card">
            <div className="lp-s1-label">Cofounder Agreement</div>
            <div className="lp-s2r-track">
              <div className="lp-s2r-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="lp-s2r-list">
              {S2R_SECTIONS.map((s, i) => (
                <div key={i} className={`lp-s2r-row${done.includes(i) ? ' done' : ''}`}>
                  <span className="lp-s2r-check">{done.includes(i) ? '✓' : ''}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S4_MSGS = [
  { text: 'Hey Tim, what do you recommend for our vesting schedule.', sent: true },
  { text: 'Happy to help!', sent: false },
  { text: "I'd recommend 4-year vest with a 1-year cliff for both founders.", sent: false },
];

function PanelExpert() {
  const [shown, setShown] = useState<number[]>([]);
  const [typingIdx, setTypingIdx] = useState<number | null>(null);
  useEffect(() => {
    const timers: Timer[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const showMsg = (idx: number) => {
      if (idx >= S4_MSGS.length) {
        t(() => {
          setShown([]);
          setTypingIdx(null);
          showMsg(0);
        }, 2000);
        return;
      }
      const msg = S4_MSGS[idx]!;
      if (msg.sent) {
        setShown((p) => [...p, idx]);
        t(() => showMsg(idx + 1), 1200);
      } else {
        setTypingIdx(idx);
        t(() => {
          setTypingIdx(null);
          t(() => {
            setShown((p) => [...p, idx]);
            t(() => showMsg(idx + 1), 1900);
          }, 280);
        }, 1300);
      }
    };
    showMsg(0);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/chalk.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-white">
        <div className="lp-fp-content">
          <div className="lp-fp-tag">Step 5</div>
          <div className="lp-fp-title">Expert Guidance</div>
          <div className="lp-s4-card">
            <div className="lp-s4-expert-row">
              <div className="lp-s4-avatar">T</div>
              <div>
                <div className="lp-s4-name">Tim</div>
                <div className="lp-s4-role">Cofounder Coach</div>
              </div>
            </div>
            <div className="lp-s4-msgs">
              {S4_MSGS.map(
                (m, i) =>
                  shown.includes(i) && (
                    <div key={i} className={`lp-s4-msg${m.sent ? ' user' : ''}`}>
                      {m.text}
                    </div>
                  ),
              )}
              {typingIdx !== null && (
                <div className="lp-s4-typing">
                  <div className="lp-s4-dot-anim" />
                  <div className="lp-s4-dot-anim" />
                  <div className="lp-s4-dot-anim" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PANELS: readonly ComponentType[] = [
  PanelInvite,
  PanelCollab,
  PanelEquity,
  PanelReview,
  PanelExpert,
];

const AGREEMENT_SECTIONS = [
  {
    tab: 'Equity',
    title: 'Agree on ownership splits',
    desc: 'Set each cofounder’s share up front, with a fair split that everyone understands and signs.',
  },
  {
    tab: 'Vesting',
    title: 'Earn equity over time',
    desc: 'A vesting schedule keeps everyone invested, so equity is earned by building the company.',
  },
  {
    tab: 'Decisions',
    title: 'Decide who decides',
    desc: 'Spell out who signs off on what, when a vote is needed, and how ties get broken.',
  },
  {
    tab: 'IP',
    title: 'Own what you build',
    desc: 'Everything created for the company belongs to it, in writing, from the very first day.',
  },
  {
    tab: 'Compensation',
    title: 'Set pay and expenses',
    desc: 'Agree on pay, expenses, and reimbursements now, before anyone is frustrated later.',
  },
] as const;

// Panel color behind each section's example, in the same order as AGREEMENT_SECTIONS.
// Muted tints drawn from the blossom painting: hill sage, blossom, sky, cloud, meadow — ordered so
// warm and cool tones alternate across the bento grid rather than splitting by row.
const AG_TINTS = ['#c6d0c1', '#e4d4d1', '#ccd6df', '#e6e1d8', '#d0d3b6'] as const;

const agRow = (label: string, value: string) => (
  <div className="lp-agv-row">
    <span>{label}</span>
    <b>{value}</b>
  </div>
);

// One small example visual per agreement section, in the same order as AGREEMENT_SECTIONS.
const AG_VISUALS: readonly ReactNode[] = [
  <>
    <div className="lp-agv-head">Ownership</div>
    <div className="lp-agv-bar">
      <div className="lp-agv-seg dark" style={{ flex: 55 }}>
        <span>Sarah Chen</span>
        <b>55%</b>
      </div>
      <div className="lp-agv-seg light" style={{ flex: 45 }}>
        <span>Alex Rivera</span>
        <b>45%</b>
      </div>
    </div>
  </>,
  <>
    <div className="lp-agv-head">4-year vesting, 1-year cliff</div>
    <div className="lp-agv-stairs">
      {[25, 50, 75, 100].map((pct, i) => (
        <div key={pct} className="lp-agv-stair">
          <div className="lp-agv-stair-bar" style={{ height: `${pct * 0.85}px` }}>
            <b>{pct}%</b>
          </div>
          <span>{i === 0 ? 'Yr 1 · cliff' : `Yr ${i + 1}`}</span>
        </div>
      ))}
    </div>
  </>,
  <>
    <div className="lp-agv-head">Who decides</div>
    {agRow('Day-to-day', 'Area owner')}
    {agRow('Major decisions', 'Both cofounders')}
    {agRow('Ties', 'Mediation')}
  </>,
  <>
    <div className="lp-agv-head">Assigned to the company</div>
    {['Code', 'Designs', 'Trademarks'].map((item) => (
      <div key={item} className="lp-agv-row">
        <span>{item}</span>
        <b className="lp-agv-check">✓ Acme Labs</b>
      </div>
    ))}
  </>,
  <>
    <div className="lp-agv-head">Compensation</div>
    <div className="lp-agv-stats">
      <div>
        <b>$0</b>
        <span>salary until the first round</span>
      </div>
      <div>
        <b>30 days</b>
        <span>to reimburse expenses</span>
      </div>
    </div>
  </>,
];

const V2_STEPS = 4;

const FEATURES = [
  {
    num: '01',
    panel: 0,
    title: 'Invite your cofounders',
    desc: 'Add your cofounders as collaborators. They must be added to be included in the Cofounder Agreement.',
    short: 'Add your cofounders so they are part of the agreement.',
  },
  {
    num: '02',
    panel: 1,
    title: 'Collab on the agreement',
    desc: 'You and your cofounders answer a set of guided questions together. Nobody has to play "project manager" or relay answers.',
    short: 'Answer guided questions together. No project manager needed.',
  },
  {
    num: '03',
    panel: 2,
    title: 'Equity Calculator',
    desc: 'Use our proprietary equity calculator to determine ownership. Instant, precise splits so everyone knows their stake.',
    short: 'Instant, precise splits so everyone knows their stake.',
  },
  {
    num: '04',
    panel: 3,
    title: 'Do a final review',
    desc: 'We take your responses and turn them into a Cofounder Agreement, ready for your final review and signature.',
    short: 'We turn your answers into an agreement, ready to review and sign.',
  },
  {
    num: '05',
    panel: 4,
    title: 'Expert Guidance',
    desc: "We are a team of cofounder coaches, founders, and attorneys ready to help. You're in good hands every step of the way.",
    short: 'Cofounder coaches and attorneys, ready to help every step of the way.',
  },
];

// How we compare: templates and lawyers struck through, then Cherrytree's price highlighted.
const BOOTSTRAPPED_PRICE = MARKETING_PLANS.find((p) => p.tier === 'Bootstrapped')!.price;

/** A phrase struck through word by word (so the line follows wrapping and sits over the text). */
function Strike({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <span className="lp-strike">
      {words.map((word, i) => (
        <span key={i} style={{ '--w': i, '--n': words.length } as CSSProperties}>
          {word}
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </span>
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

  // How we compare: strike through (and highlight) every time the lines scroll into view, and
  // reset once they've left it entirely, so the strike plays again next time.
  const strikeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = strikeRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.intersectionRatio >= 0.35) el.classList.add('in');
        else if (!entry.isIntersecting) el.classList.remove('in');
      },
      { threshold: [0, 0.35] },
    );
    obs.observe(el);
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
    <div className="lp">
      <MarketingGrain />
      <MarketingNav />

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
        <div className="lp-feat-header">
          <h2 className="lp-rv lp-d1">How it works.</h2>
        </div>
        <div className="lp-feat-scroll lp-feat-v2-track" ref={v2TrackRef}>
          <div className="lp-feat-v2-sticky" ref={v2StickyRef}>
            <div className="lp-feat-v2-scene lp-rv lp-d2">
              <div className="lp-feat-v2-grain" aria-hidden="true" />
              <V2Panel key={v2Feature} />
            </div>
            <div className="lp-feat-v2-tabs" role="tablist">
              {FEATURES.slice(0, 4).map((f, i) => (
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
          <div className="lp-feat-header">
            <h2 className="lp-rv lp-d1">What you get.</h2>
          </div>
          <div className="lp-bento lp-rv lp-d2">
            {AGREEMENT_SECTIONS.map((item, i) => (
              <article key={item.tab} className={`lp-bento-tile lp-bento-${i}`}>
                <div className="lp-bento-vis" style={{ '--ag-tint': AG_TINTS[i] } as CSSProperties}>
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

      {/* ── How we compare ── */}
      <section className="lp-features" id="compare">
        <div className="lp-feat-scroll">
          <div className="lp-strike-lines lp-rv" ref={strikeRef}>
            <p>
              <Strike text="A template from the internet." />
            </p>
            <p>
              <Strike text="Thousands in legal fees." />
            </p>
            <p className="lp-strike-win">
              An agreement you build together,{' '}
              <span className="lp-hl-mark lp-hl-auto">for {BOOTSTRAPPED_PRICE}.</span>
            </p>
          </div>
          <div className="lp-strike-actions">
            <button className="lp-btn-primary" onClick={goDash}>
              Get started
            </button>
          </div>
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

      <MarketingFooter />
    </div>
  );
}

export default LandingPage;

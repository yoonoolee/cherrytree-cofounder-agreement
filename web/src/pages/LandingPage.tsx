import { useState, useEffect, useRef, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePageMeta } from '../hooks/usePageMeta.ts';
import { useTypewriter } from '../hooks/useTypewriter.ts';
import MarketingNav from '../components/MarketingNav.tsx';
import MarketingFooter from '../components/MarketingFooter.tsx';
import MarketingGrain from '../components/MarketingGrain.tsx';
import FaqList, { type Faq } from '../components/FaqList.tsx';
import { goToDashboard } from '../utils/goToDashboard.ts';

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
              {!showNew && <span className="lp-icursor" />}
            </div>
            <button className={`lp-s1-btn${pressed ? ' pressed' : ''}`}>+ Add</button>
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
  );
}

const PANELS: readonly ComponentType[] = [
  PanelInvite,
  PanelCollab,
  PanelEquity,
  PanelReview,
  PanelExpert,
];

const FEATURES = [
  {
    num: '01',
    panel: 0,
    title: 'Invite your cofounders',
    desc: 'Add your cofounders as collaborators. They must be added to be included in the Cofounder Agreement.',
  },
  {
    num: '02',
    panel: 1,
    title: 'Collab on the agreement',
    desc: 'You and your cofounders answer a set of guided questions together. Nobody has to play "project manager" or relay answers.',
  },
  {
    num: '03',
    panel: 2,
    title: 'Equity Calculator',
    desc: 'Use our proprietary equity calculator to determine ownership. Instant, precise splits so everyone knows their stake.',
  },
  {
    num: '04',
    panel: 3,
    title: 'Do a final review',
    desc: 'We take your responses and turn them into a Cofounder Agreement, ready for your final review and signature.',
  },
  {
    num: '05',
    panel: 4,
    title: 'Expert Guidance',
    desc: "We are a team of cofounder coaches, founders, and attorneys ready to help. You're in good hands every step of the way.",
  },
];

const CAROUSEL_SLIDES = [
  {
    img: '/images/universities.png',
    tag: 'Universities',
    title: 'Help student teams start right.',
    desc: 'Give entrepreneurship programs a structured tool for the conversations students skip.',
  },
  {
    img: '/images/individuals.png',
    tag: 'Individuals',
    title: "Know what you're getting into.",
    desc: 'Think through every dimension of the partnership before you commit to a cofounder.',
  },
  {
    img: '/images/accelerators.png',
    tag: 'Accelerators',
    title: 'Give your cohort a foundation.',
    desc: 'Surface cofounder misalignment in your portfolio before Demo Day pressure takes over.',
  },
  {
    img: '/images/first-time-founders.png',
    tag: 'First-time founders',
    title: "You don't know what you don't know.",
    desc: 'Walk through every section with the context you need — no legal background required.',
  },
  {
    img: '/images/serial-founders.png',
    tag: 'Serial founders',
    title: "You've been burned before.",
    desc: 'A fast, structured way to get alignment on paper — without going back to lawyers for the basics.',
  },
];

const FAQS: readonly Faq[] = [
  {
    q: "What's a cofounder agreement, and why do I need one?",
    a: "It's basically a prenup for your startup. It spells out equity, roles, and expectations so you don't end up in a messy breakup later. Think of it as cheap insurance against expensive fights.",
  },
  {
    q: "When's the right time to create a cofounder agreement?",
    a: 'As early as possible. Day 1 is ideal, but day 100 is still better than never. The earlier you do it, the easier (and less awkward) it is.',
  },
  {
    q: 'How long does it take to complete with Cherrytree?',
    a: "Around 30–60 minutes. That's less time than a pitch deck tweak or your daily doomscroll.",
  },
  {
    q: 'Can I update the agreement later if things change?',
    a: 'Absolutely. Startups evolve, and so can your agreement. You can revisit and revise as roles, equity, or goals shift.',
  },
  {
    q: 'How is Cherrytree different from free templates online?',
    a: "Templates are generic and don't ask the hard questions. Cherrytree guides you step by step, highlights differences in answers, and gives you a founder-friendly, investor-ready document.",
  },
  {
    q: 'Do both cofounders need to be present at the same time?',
    a: 'Nope. You can each fill it out separately, then compare and finalize together.',
  },
];

// ── Main component ─────────────────────────────────────────────────────────────

function LandingPage() {
  const navigate = useNavigate();
  usePageMeta({
    title: 'Cherrytree — Build your cofounder agreement',
    description:
      'Answer guided questions with your cofounders and get a complete Cofounder Agreement. No sketchy templates, no overpriced lawyers.',
  });

  // Hero typewriter — types once on load
  const typedHero = useTypewriter('great company.');
  const [activeFeature, setActiveFeature] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  // Protect CTA: types "and your peace of mind." on an infinite loop — type out,
  // hold, clear, and after a slight pause type it out again.
  const typedProtect = useTypewriter('and your peace of mind.', { charDelay: 46, holdDelay: 2200 });
  const featItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const goDash = () => goToDashboard(navigate);

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

  // Feature switching via scroll
  useEffect(() => {
    const handle = () => {
      const mid = window.innerHeight / 2;
      let best = 0,
        bestDist = Infinity;
      featItemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActiveFeature(best);
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const ActivePanel = PANELS[FEATURES[activeFeature]!.panel]!;

  return (
    <div className="lp">
      <MarketingGrain />
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="lp-hero">
        <h1 className="lp-hero-headline">
          <span className="lp-hl-line">
            <span className="lp-hl-inner">Great companies start</span>
          </span>
          <span className="lp-hl-line lp-d1">
            <span className="lp-hl-inner">
              with {typedHero}
              <span style={{ visibility: 'hidden' }}>
                {'great company.'.slice(typedHero.length)}
              </span>
            </span>
          </span>
        </h1>
        <p className="lp-hero-sub">
          Answer guided questions with your cofounders and get a complete Cofounder Agreement. No
          sketchy templates, no overpriced lawyers.
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

      {/* ── Features ── */}
      <section className="lp-features" id="features">
        <div className="lp-feat-scroll">
          <div className="lp-feat-header">
            <h2 className="lp-rv lp-d1">
              Built for <br />
              <em>early-stage</em> cofounders.
            </h2>
            <p className="lp-rv lp-d2">
              Get your equity, expectations, and everything else right from the start.
            </p>
          </div>
          <div className="lp-feat-body">
            <div className="lp-feat-visual">
              <ActivePanel key={activeFeature} />
            </div>
            <div className="lp-feat-list">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    featItemRefs.current[i] = el;
                  }}
                  className={`lp-feat-item${activeFeature === i ? ' active' : ''}`}
                >
                  <div className="lp-feat-item-line" />
                  <div className="lp-feat-item-num">{f.num}</div>
                  <div className="lp-feat-item-title">{f.title}</div>
                  <p className="lp-feat-item-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      {/* ── Carousel ── */}
      <section className="lp-carousel" id="who">
        <div className="lp-carousel-header lp-rv">
          <div>
            <h2 className="lp-carousel-title">
              Built for every kind of <em>founding team.</em>
            </h2>
          </div>
          <div className="lp-carousel-nav">
            <button
              className="lp-carousel-btn"
              onClick={() =>
                setCarouselIdx((i) => (i - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)
              }
            >
              ←
            </button>
            <button
              className="lp-carousel-btn"
              onClick={() => setCarouselIdx((i) => (i + 1) % CAROUSEL_SLIDES.length)}
            >
              →
            </button>
          </div>
        </div>
        <div className="lp-carousel-track-wrap">
          <div
            className="lp-carousel-track"
            style={{ transform: `translateX(calc(-${carouselIdx} * 380px))` }}
          >
            {CAROUSEL_SLIDES.map((s, i) => (
              <div
                key={i}
                className={`lp-cs-slide${i === carouselIdx ? ' active' : ''}`}
                style={{ backgroundImage: `url('${s.img}')` }}
              >
                <div className="lp-cs-overlay" />
                <div className="lp-cs-label">
                  <div className="lp-cs-tag">{s.tag}</div>
                  <div className="lp-cs-title">{s.title}</div>
                  <div className="lp-cs-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lp-carousel-dots">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`lp-cs-dot${i === carouselIdx ? ' active' : ''}`}
              onClick={() => setCarouselIdx(i)}
            />
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-faq" id="faq">
        <div className="lp-faq-inner">
          <div className="lp-faq-header">
            <h2 className="lp-rv lp-d1">FAQ</h2>
          </div>
          <FaqList faqs={FAQS} reveal />
        </div>
      </section>

      {/* ── Protect CTA ── */}
      <section className="lp-protect-cta">
        <h2>
          Protect your piece of the pie
          <br />
          <em>
            {typedProtect}
            <span className="lp-cursor" />
          </em>
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

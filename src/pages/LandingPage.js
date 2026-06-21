import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';
import MarketingGrain from '../components/MarketingGrain';

// ── Panel sub-components ───────────────────────────────────────────────────────

function PanelInvite({ active }) {
  const [typed, setTyped] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [pressed, setPressed] = useState(false);
  const email = 'sam@startup.co';
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach(clearTimeout);
    refs.current = [];
    if (!active) { setTyped(''); setShowNew(false); setPressed(false); return; }
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };
    const run = () => {
      setTyped(''); setShowNew(false); setPressed(false);
      email.split('').forEach((_, i) => t(() => setTyped(email.slice(0, i + 1)), 800 + i * 55));
      t(() => setPressed(true), 800 + email.length * 55 + 200);
      t(() => { setShowNew(true); setPressed(false); setTyped(''); }, 800 + email.length * 55 + 600);
      t(run, 800 + email.length * 55 + 4000);
    };
    run();
    return () => refs.current.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/ambient.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-content">
        <div className="lp-fp-tag">Step 1</div>
        <div className="lp-fp-title">Invite your cofounders</div>
        <div className="lp-s1-card">
          <div className="lp-s1-label">Team</div>
          <div className="lp-s1-row"><span className="lp-dot green"/><span className="lp-s1-email">you@email.com</span><span className="lp-badge owner">Owner</span></div>
          <div className="lp-s1-row"><span className="lp-dot light"/><span className="lp-s1-email">alex@startup.co</span><span className="lp-badge added">Added</span></div>
          {showNew && <div className="lp-s1-row lp-s1-new"><span className="lp-dot light"/><span className="lp-s1-email">{email}</span><span className="lp-badge added">Added</span></div>}
          <div className="lp-s1-input-row">
            <div className="lp-s1-input"><span>{typed}</span>{!showNew && <span className="lp-icursor"/>}</div>
            <button className={`lp-s1-btn${pressed ? ' pressed' : ''}`}>+ Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelCollab({ active }) {
  const [answered, setAnswered] = useState([]);
  const [activeQ, setActiveQ] = useState(0);
  const [typed, setTyped] = useState('');
  const refs = useRef([]);
  const qs = [
    { q: "What's your company name?", a: 'Cherrytree' },
    { q: 'Legal structure?', a: 'C-Corp' },
    { q: 'State of formation?', a: 'Delaware' },
  ];

  useEffect(() => {
    refs.current.forEach(clearTimeout);
    refs.current = [];
    if (!active) { setAnswered([]); setActiveQ(0); setTyped(''); return; }
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };
    const run = () => {
      setAnswered([]); setActiveQ(0); setTyped('');
      qs.forEach((q, i) => {
        const base = 400 + i * 2600;
        q.a.split('').forEach((_, ci) => t(() => setTyped(q.a.slice(0, ci + 1)), base + ci * 80));
        t(() => { setAnswered(p => [...p, i]); setActiveQ(i + 1); setTyped(''); }, base + q.a.length * 80 + 400);
      });
      t(run, 400 + qs.length * 2600 + 1500);
    };
    run();
    return () => refs.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/wall.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-content">
        <div className="lp-fp-tag">Step 2</div>
        <div className="lp-fp-title">Collab on the agreement</div>
        <div className="lp-s2-card">
          <div className="lp-s1-label">Formation &amp; Purpose</div>
          {qs.map((q, i) => (
            <div key={i} className={`lp-s2-q${answered.includes(i) ? ' answered' : ''}${activeQ === i ? ' active' : ''}`}>
              <div className="lp-s2-q-row">
                <span className="lp-s2-q-text">{q.q}</span>
                {answered.includes(i) && <><span className="lp-s2-q-answer">{q.a}</span><span className="lp-s2-check">✓</span></>}
              </div>
              {activeQ === i && !answered.includes(i) && (
                <div className="lp-s2-body"><div className="lp-s2-input"><span>{typed}</span><span className="lp-icursor lp-dark"/></div></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelEquity({ active }) {
  const cats = [
    { name: 'Cash Invested', count: '1 / 18', imp: 60, scores: [7, 4] },
    { name: 'Time Commitment', count: '2 / 18', imp: 90, scores: [9, 6] },
    { name: 'Domain Expertise', count: '3 / 18', imp: 75, scores: [5, 8] },
  ];
  const [idx, setIdx] = useState(0);
  const [sliderPct, setSliderPct] = useState(0);
  const [dots, setDots] = useState([0, 0]);
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach(clearTimeout);
    refs.current = [];
    if (!active) { setIdx(0); setSliderPct(0); setDots([0, 0]); return; }
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };
    const run = (i) => {
      setIdx(i); setSliderPct(0); setDots([0, 0]);
      t(() => setSliderPct(cats[i].imp), 80);
      t(() => setDots(cats[i].scores), 350);
      t(() => run((i + 1) % cats.length), 2600);
    };
    run(0);
    return () => refs.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const cat = cats[idx];
  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/leaf.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-content">
        <div className="lp-fp-tag">Equity</div>
        <div className="lp-fp-title">Equity Calculator</div>
        <div className="lp-s3-card">
          <div className="lp-s3-top">
            <span className="lp-s3-category">{cat.name}</span>
            <span className="lp-s3-counter">{cat.count}</span>
          </div>
          <div className="lp-s1-label">How important is this?</div>
          <div className="lp-s3-slider-row">
            <div className="lp-s3-track">
              <div className="lp-s3-fill" style={{ width: `${sliderPct}%` }}/>
              <div className="lp-s3-thumb" style={{ left: `${sliderPct}%` }}/>
            </div>
            <span className="lp-s3-val">{Math.round(sliderPct / 10)}</span>
          </div>
          <div className="lp-s1-label" style={{ marginTop: 10 }}>Score each cofounder</div>
          {['Alex', 'Jordan'].map((name, i) => (
            <div key={i} className="lp-s3-cf">
              <div className="lp-s3-cf-name">{name}</div>
              <div className="lp-s3-dots">
                {[...Array(10)].map((_, d) => (
                  <div key={d} className={`lp-s3-dot${d < dots[i] ? ' on' : ''}`} style={{ transition: `background 0.12s ${d * 0.04}s` }}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelReview({ active }) {
  const sections = ['Formation & Purpose', 'Cofounder Info', 'Equity Allocation', 'Vesting', 'Decision-Making'];
  const [done, setDone] = useState([]);
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach(clearTimeout);
    refs.current = [];
    if (!active) { setDone([]); return; }
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };
    const run = () => {
      setDone([]);
      sections.forEach((_, i) => t(() => setDone(p => [...p, i]), 500 + i * 650));
      t(run, 500 + sections.length * 650 + 2000);
    };
    run();
    return () => refs.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pct = (done.length / sections.length) * 100;
  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/chalk.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-content">
        <div className="lp-fp-tag">Step 3</div>
        <div className="lp-fp-title">Do a final review</div>
        <div className="lp-s2r-card">
          <div className="lp-s1-label">Cofounder Agreement</div>
          <div className="lp-s2r-track"><div className="lp-s2r-fill" style={{ width: `${pct}%` }}/></div>
          <div className="lp-s2r-list">
            {sections.map((s, i) => (
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

function PanelExpert({ active }) {
  const msgs = [
    { from: 'expert', text: "Hey — I noticed you're working on equity. Have you tried our calculator?" },
    { from: 'user', text: "We tried 50/50 but it doesn't feel right." },
    { from: 'expert', text: "That's common. Let's walk through each contribution area — it takes 10 minutes and the result is much more defensible." },
  ];
  const [shown, setShown] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach(clearTimeout);
    refs.current = [];
    if (!active) { setShown(0); return; }
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };
    const run = () => {
      setShown(0);
      msgs.forEach((_, i) => t(() => setShown(i + 1), 500 + i * 1600));
      t(run, 500 + msgs.length * 1600 + 2000);
    };
    run();
    return () => refs.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/paper.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-content">
        <div className="lp-fp-tag">Support</div>
        <div className="lp-fp-title">Expert Guidance</div>
        <div className="lp-s4-card">
          <div className="lp-s4-expert-row">
            <div className="lp-s4-avatar">T</div>
            <div><div className="lp-s4-name">Tim</div><div className="lp-s4-role">Cofounder Coach</div></div>
          </div>
          <div className="lp-s4-msgs">
            {msgs.slice(0, shown).map((m, i) => (
              <div key={i} className={`lp-s4-msg${m.from === 'user' ? ' user' : ''}`}>{m.text}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const PANELS = [PanelInvite, PanelCollab, PanelEquity, PanelReview, PanelExpert];

const FEATURES = [
  { num: '01', panel: 0, title: 'Invite your cofounders', desc: 'Add your cofounders as collaborators. They must be added to be included in the Cofounder Agreement.' },
  { num: '02', panel: 1, title: 'Collab on the agreement', desc: 'You and your cofounders answer a set of guided questions together. Nobody has to play "project manager" or relay answers.' },
  { num: '03', panel: 2, title: 'Equity Calculator', desc: 'Use our proprietary equity calculator to determine ownership. Instant, precise splits so everyone knows their stake.' },
  { num: '04', panel: 3, title: 'Do a final review', desc: 'We take your responses and turn them into a Cofounder Agreement, ready for your final review and signature.' },
  { num: '05', panel: 4, title: 'Expert Guidance', desc: 'We are a team of cofounder coaches, founders, and attorneys ready to help. You\'re in good hands every step of the way.' },
];

const CAROUSEL_SLIDES = [
  { img: '/images/universities.png', tag: 'Universities', title: 'Help student teams start right.', desc: 'Give entrepreneurship programs a structured tool for the conversations students skip.' },
  { img: '/images/individuals.png', tag: 'Individuals', title: 'Know what you\'re getting into.', desc: 'Think through every dimension of the partnership before you commit to a cofounder.' },
  { img: '/images/accelerators.png', tag: 'Accelerators', title: 'Give your cohort a foundation.', desc: 'Surface cofounder misalignment in your portfolio before Demo Day pressure takes over.' },
  { img: '/images/first-time-founders.png', tag: 'First-time founders', title: 'You don\'t know what you don\'t know.', desc: 'Walk through every section with the context you need — no legal background required.' },
  { img: '/images/serial-founders.png', tag: 'Serial founders', title: 'You\'ve been burned before.', desc: 'A fast, structured way to get alignment on paper — without going back to lawyers for the basics.' },
];

const PRICING = [
  {
    tier: 'Bootstrapped', price: '$200', period: 'One-time payment',
    desc: 'Ideal for early-stage or bootstrapped teams that need to move fast and start building now.',
    features: ['Expert-designed survey', 'Comprehensive agreements', 'Proprietary equity calculator', 'Best practices and tips', 'Up to 5 collaborators'],
    cta: 'Get started', ctaStyle: 'outline',
  },
  {
    tier: 'Scale', price: '$2,000', period: 'One-time payment', badge: 'Most popular',
    desc: 'Built for funded teams that need deeper control, greater detail, and stronger foundations.',
    features: ['Everything in Bootstrapped', 'Final attorney review', 'Personalized onboarding', 'Cofounder coaching', 'Priority support'],
    cta: 'Get started', ctaStyle: 'filled', featured: true,
  },
  {
    tier: 'Enterprise', price: 'Custom', period: 'Contact for volume pricing',
    desc: 'Running a fund or accelerator and want to deploy in bulk? We\'ll set you up.',
    features: ['Everything in Scale, for your cohort', 'Cohort dashboard and progress tracking', 'Branded experience for your program', 'Dedicated account support'],
    cta: 'Contact sales', ctaStyle: 'solid', enterprise: true,
  },
];

const FAQS = [
  { q: "What's a cofounder agreement, and why do I need one?", a: "It's basically a prenup for your startup. It spells out equity, roles, and expectations so you don't end up in a messy breakup later. Think of it as cheap insurance against expensive fights." },
  { q: "When's the right time to create a cofounder agreement?", a: "As early as possible. Day 1 is ideal, but day 100 is still better than never. The earlier you do it, the easier (and less awkward) it is." },
  { q: "How long does it take to complete with Cherrytree?", a: "Around 30–60 minutes. That's less time than a pitch deck tweak or your daily doomscroll." },
  { q: "Can I update the agreement later if things change?", a: "Absolutely. Startups evolve, and so can your agreement. You can revisit and revise as roles, equity, or goals shift." },
  { q: "How is Cherrytree different from free templates online?", a: "Templates are generic and don't ask the hard questions. Cherrytree guides you step by step, highlights differences in answers, and gives you a founder-friendly, investor-ready document." },
  { q: "Do both cofounders need to be present at the same time?", a: "Nope. You can each fill it out separately, then compare and finalize together." },
];

const STATS = [
  { num: 2400, suffix: '+', label: 'Founding teams have started\ntheir agreement' },
  { num: 6100, suffix: '+', label: 'Founders have used\nCherrytree' },
  { num: 10, suffix: '', label: 'Sections covering every angle\nof your cofounder agreement' },
  { num: 0, prefix: '$', suffix: '', label: 'To get started.\nNo lawyer required.' },
];

// ── Main component ─────────────────────────────────────────────────────────────

function LandingPage() {
  const navigate = useNavigate();
  usePageMeta({
    title: 'Cherrytree — Build your cofounder agreement',
    description: 'Answer guided questions with your cofounders and get a complete Cofounder Agreement. No sketchy templates, no overpriced lawyers.',
  });

  const [typedHero, setTypedHero] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [counts, setCounts] = useState(STATS.map(() => 0));
  const statsRef = useRef(null);
  const featItemRefs = useRef([]);

  const goToDashboard = () => {
    const isProd = window.location.hostname.includes('cherrytree.app');
    if (isProd) window.location.href = `${process.env.REACT_APP_APP_URL}/dashboard`;
    else navigate('/dashboard', { replace: true });
  };

  // Hero typewriter — types once, cursor stays
  useEffect(() => {
    const target = 'with great company.';
    let i = 0;
    const tick = () => {
      if (i >= target.length) return;
      i++;
      setTypedHero(target.slice(0, i));
      setTimeout(tick, 60);
    };
    setTimeout(tick, 600);
  }, []);

  // Feature switching via scroll
  useEffect(() => {
    const handle = () => {
      const mid = window.innerHeight / 2;
      let best = 0, bestDist = Infinity;
      featItemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setActiveFeature(best);
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  // Count-up for stats
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      STATS.forEach((s, i) => {
        if (s.num === 0) return;
        const dur = 1600, start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const pct = Math.min(elapsed / dur, 1);
          const ease = 1 - Math.pow(1 - pct, 3);
          setCounts(prev => { const n = [...prev]; n[i] = Math.round(ease * s.num); return n; });
          if (pct < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.3 });
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const ActivePanel = PANELS[FEATURES[activeFeature].panel];

  return (
    <div className="lp">
      <MarketingGrain />
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-orb lp-orb-1"/><div className="lp-orb lp-orb-2"/><div className="lp-orb lp-orb-3"/>
        <h1 className="lp-hero-headline">
          <span className="lp-hl-line"><span className="lp-hl-inner">Great companies start</span></span>
          <span className="lp-hl-line lp-d1"><span className="lp-hl-inner"><em>{typedHero}<span className="lp-cursor"/></em></span></span>
        </h1>
        <p className="lp-hero-sub">Answer guided questions with your cofounders and get a complete Cofounder Agreement. No sketchy templates, no overpriced lawyers.</p>
        <div className="lp-hero-actions">
          <button className="lp-btn-primary" onClick={goToDashboard}>Get started</button>
          <a className="lp-btn-ghost" href="https://cal.com/tim-he/15min" target="_blank" rel="noopener noreferrer">Book a demo →</a>
        </div>

        {/* Product mockup */}
        <div className="lp-hero-visual lp-rv">
          <div className="lp-hv-bar">
            <span className="lp-dot-r"/><span className="lp-dot-y"/><span className="lp-dot-g"/>
            <div className="lp-hv-url">cherrytree.app / agreement</div>
          </div>
          <div className="lp-hv-body">
            <div className="lp-hv-sidebar">
              <div className="lp-hv-prog-lbl">40% Complete</div>
              <div className="lp-hv-prog-bar"><div className="lp-hv-prog-fill" style={{ width: '40%' }}/></div>
              {['Formation', 'Cofounder Info', 'Equity', 'Vesting', 'Decision-Making', 'IP & Ownership'].map((s, i) => (
                <div key={i} className={`lp-hv-nav-item${i === 3 ? ' active' : ''}`}>
                  <span className={`lp-hv-dot${i < 3 ? ' done' : i === 3 ? ' act' : ''}`}/>{s}
                </div>
              ))}
            </div>
            <div className="lp-hv-main">
              <div className="lp-hv-sec-lbl">Section 4 of 10 · Vesting Schedule</div>
              <div className="lp-hv-q-title">What vesting schedule will you use?</div>
              <div className="lp-hv-q-hint">Vesting protects everyone — it ensures each founder earns their equity over time and gives the team a path forward if someone leaves early.</div>
              <div className="lp-hv-card">
                <div className="lp-hv-card-lbl">Select a schedule</div>
                {['4 years with 1-year cliff', '3 years with 1-year cliff', 'Immediate'].map((opt, i) => (
                  <div key={i} className="lp-hv-row" style={{ marginBottom: i === 2 ? 0 : 6 }}>
                    <span style={{ width: 13, height: 13, borderRadius: '50%', border: `1.5px solid ${i === 0 ? 'var(--lp-green)' : 'rgba(0,0,0,0.15)'}`, background: i === 0 ? 'var(--lp-green)' : 'transparent', flexShrink: 0, display: 'inline-block', boxSizing: 'border-box' }}/>
                    <div className="lp-hv-name" style={{ background: i === 0 ? 'var(--lp-green-bg)' : '#fff', borderColor: i === 0 ? 'rgba(75,114,99,0.2)' : 'rgba(0,0,0,0.1)', color: i === 0 ? 'var(--lp-green)' : 'var(--lp-ink)', fontWeight: i === 0 ? 400 : 300 }}>{opt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-features" id="features">
        <div className="lp-feat-header">
          <div className="lp-overline lp-rv">How it works</div>
          <h2 className="lp-rv lp-d1">Built for <br/><em>early-stage</em> cofounders.</h2>
          <p className="lp-rv lp-d2">Get your equity, expectations, and everything else right from the start.</p>
        </div>
        <div className="lp-feat-body">
          <div className="lp-feat-visual">
            <ActivePanel active={true} key={activeFeature} />
          </div>
          <div className="lp-feat-list">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                ref={el => featItemRefs.current[i] = el}
                className={`lp-feat-item${activeFeature === i ? ' active' : ''}`}
              >
                <div className="lp-feat-item-line"/>
                <div className="lp-feat-item-num">{f.num}</div>
                <div className="lp-feat-item-title">{f.title}</div>
                <p className="lp-feat-item-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="lp-stats" ref={statsRef}>
        <div className="lp-stats-inner">
          <div className="lp-stats-left">
            <div className="lp-overline lp-rv">By the numbers</div>
            <h2 className="lp-rv lp-d1">The proof is in the<br/><em>partnership.</em></h2>
            <p className="lp-rv lp-d2">Founding teams across the country have used Cherrytree to get aligned before they build. No lawyers required. No legal background needed.</p>
          </div>
          <div className="lp-stats-right">
            {STATS.map((s, i) => (
              <div key={i} className={`lp-stat-row lp-rv lp-d${i}`}>
                <div className="lp-stat-num">{s.prefix || ''}{counts[i].toLocaleString()}{s.suffix}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="lp-testi">
        <div className="lp-testi-header">
          <div className="lp-overline lp-rv">Testimonials</div>
          <h2 className="lp-rv lp-d1">What founders are saying.</h2>
        </div>
        <div className="lp-testi-grid">
          {[
            { init: 'M', name: 'Maya R.', role: 'Co-founder, Stealth startup', quote: '"We thought we were aligned on equity until Cherrytree showed us we weren\'t. It surfaced a real disagreement before it became a real problem. Worth every minute."' },
            { init: 'J', name: 'James T.', role: 'Founder, YC S24', quote: '"Our accelerator recommended this and I\'m glad they did. We got through IP and vesting in one sitting and actually understood what we were agreeing to."' },
            { init: 'S', name: 'Sarah K.', role: 'Co-founder, FinTech startup', quote: '"The equity calculator alone is worth it. We scored each other independently and compared — it was the most honest conversation we\'d had about the company."' },
          ].map((t, i) => (
            <div key={i} className={`lp-testi-card lp-rv lp-d${i}`}>
              <p className="lp-testi-quote">{t.quote}</p>
              <div className="lp-testi-author">
                <div><div className="lp-testi-name">{t.name}</div><div className="lp-testi-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Carousel ── */}
      <section className="lp-carousel" id="who">
        <div className="lp-carousel-header lp-rv">
          <div>
            <div className="lp-overline" style={{ marginBottom: 12 }}>Who it's for</div>
            <h2 className="lp-carousel-title">Built for every kind of <em>founding team.</em></h2>
          </div>
          <div className="lp-carousel-nav">
            <button className="lp-carousel-btn" onClick={() => setCarouselIdx(i => (i - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}>←</button>
            <button className="lp-carousel-btn" onClick={() => setCarouselIdx(i => (i + 1) % CAROUSEL_SLIDES.length)}>→</button>
          </div>
        </div>
        <div className="lp-carousel-track-wrap">
          <div className="lp-carousel-track" style={{ transform: `translateX(calc(-${carouselIdx} * (min(520px, 90vw) + 16px)))` }}>
            {CAROUSEL_SLIDES.map((s, i) => (
              <div key={i} className={`lp-cs-slide${i === carouselIdx ? ' active' : ''}`} style={{ backgroundImage: `url('${s.img}')` }}>
                <div className="lp-cs-overlay"/>
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
            <button key={i} className={`lp-cs-dot${i === carouselIdx ? ' active' : ''}`} onClick={() => setCarouselIdx(i)}/>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="lp-pricing" id="pricing">
        <div className="lp-pricing-header">
          <div className="lp-overline lp-rv">Pricing</div>
          <h2 className="lp-rv lp-d1">Founder-friendly pricing.</h2>
          <p className="lp-rv lp-d2">Choose the plan that's right for your team.</p>
        </div>
        <div className="lp-pricing-grid">
          {PRICING.map((p, i) => (
            <div key={i} className={`lp-pricing-card lp-rv lp-d${i}${p.featured ? ' featured' : ''}`}>
              {p.badge && <div className="lp-pricing-badge">{p.badge}</div>}
              <div className="lp-pricing-tier">{p.tier}</div>
              <div className="lp-pricing-price">{p.price}</div>
              <div className="lp-pricing-period">{p.period}</div>
              <div className="lp-pricing-divider"/>
              <p className="lp-pricing-desc">{p.desc}</p>
              <ul className="lp-pricing-features">
                {p.features.map((f, j) => (
                  <li key={j} className="lp-pricing-feat">
                    <span className="lp-pf-check"><svg viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke={p.featured ? '#6a9e8a' : '#4B7263'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`lp-pricing-cta ${p.ctaStyle}`}
                onClick={() => p.enterprise ? window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 }) : goToDashboard()}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-faq" id="faq">
        <div className="lp-faq-inner">
          <div className="lp-faq-header">
            <div className="lp-overline lp-rv">FAQ</div>
            <h2 className="lp-rv lp-d1">Questions founders ask.</h2>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className={`lp-faq-item lp-rv lp-d${Math.min(i, 4)}`}>
                <button className="lp-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="lp-faq-q">{f.q}</span>
                  <span className={`lp-faq-icon${openFaq === i ? ' open' : ''}`}>+</span>
                </button>
                <div className={`lp-faq-body${openFaq === i ? ' open' : ''}`}>
                  <div className="lp-faq-body-inner"><p className="lp-faq-a">{f.a}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Protect CTA ── */}
      <section className="lp-protect-cta">
        <h2 className="lp-rv">Protect your piece of the pie<br/><em>and</em> your peace of mind.</h2>
        <div className="lp-protect-cta-actions lp-rv lp-d1">
          <button className="lp-btn-primary" onClick={goToDashboard}>Get started</button>
          <a className="lp-btn-ghost" href="https://cal.com/tim-he/15min" target="_blank" rel="noopener noreferrer">Book a demo →</a>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

export default LandingPage;

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';
import MarketingGrain from '../components/MarketingGrain';

// ── Panel sub-components ───────────────────────────────────────────────────────

const S1_EMAILS = ['sarah@vc.io', 'priya@buildit.co', 'james@founder.io'];

function PanelInvite({ active }) {
  const [typed, setTyped] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [emailIdx, setEmailIdx] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach(clearTimeout);
    refs.current = [];
    if (!active) { setTyped(''); setShowNew(false); setPressed(false); setEmailIdx(0); return; }
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };
    let idx = 0;
    const type = () => {
      const email = S1_EMAILS[idx % S1_EMAILS.length];
      setTyped(''); setShowNew(false);
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
        t(() => { setShowNew(false); idx++; type(); }, 2000);
      }, 180);
    };
    t(type, 800);
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
          {showNew && <div className="lp-s1-row lp-s1-new"><span className="lp-dot light"/><span className="lp-s1-email">{S1_EMAILS[emailIdx % S1_EMAILS.length]}</span><span className="lp-badge added">Added</span></div>}
          <div className="lp-s1-input-row">
            <div className="lp-s1-input"><span>{typed}</span>{!showNew && <span className="lp-icursor"/>}</div>
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

function PanelCollab({ active }) {
  const [answered, setAnswered] = useState([]);
  const [activeQ, setActiveQ] = useState(0);
  const [typed, setTyped] = useState('');
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach(clearTimeout);
    refs.current = [];
    if (!active) { setAnswered([]); setActiveQ(0); setTyped(''); return; }
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };
    const runQuestion = (idx) => {
      if (idx >= S2_QUESTIONS.length) {
        t(() => {
          setAnswered([]); setActiveQ(0); setTyped('');
          t(() => runQuestion(0), 300);
        }, 1600);
        return;
      }
      setActiveQ(idx);
      setTyped('');
      const target = S2_QUESTIONS[idx].a;
      t(() => {
        target.split('').forEach((_, ci) => t(() => setTyped(target.slice(0, ci + 1)), ci * 65));
        t(() => {
          setAnswered(p => [...p, idx]);
          t(() => runQuestion(idx + 1), 420);
        }, target.length * 65 + 700);
      }, 80);
    };
    runQuestion(0);
    return () => refs.current.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/wall.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-content">
        <div className="lp-fp-tag">Step 2</div>
        <div className="lp-fp-title">Collab on the agreement</div>
        <div className="lp-s2-card">
          <div className="lp-s1-label">Formation &amp; Purpose</div>
          {S2_QUESTIONS.map((q, i) => (
            <div key={i} className={`lp-s2-q${answered.includes(i) ? ' answered' : ''}${activeQ === i ? ' active' : ''}`}>
              <div className="lp-s2-q-row">
                <span className="lp-s2-q-text">{q.q}</span>
                <span className="lp-s2-q-answer">{q.a}</span>
                <span className="lp-s2-check">✓</span>
              </div>
              <div className="lp-s2-body"><div className="lp-s2-body-inner">
                <div className="lp-s2-input"><span>{activeQ === i ? typed : ''}</span><span className="lp-icursor lp-dark"/></div>
              </div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelEquity({ active }) {
  const cats = [
    { name: 'Cash Invested', count: '1 / 18', imp: 5, scores: [8, 3] },
    { name: 'Time Commitment', count: '2 / 18', imp: 8, scores: [9, 7] },
    { name: 'Idea Origination', count: '3 / 18', imp: 6, scores: [7, 10] },
  ];
  const names = ['Alex Chen', 'Jordan Lee'];
  const [idx, setIdx] = useState(0);
  const [sliderPct, setSliderPct] = useState(0);
  const [sliderTransition, setSliderTransition] = useState(false);
  const [sliderVal, setSliderVal] = useState(null);
  const [selected, setSelected] = useState([null, null]);
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach(clearTimeout);
    refs.current = [];
    if (!active) { setIdx(0); setSliderPct(0); setSliderTransition(false); setSliderVal(null); setSelected([null, null]); return; }
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };
    const run = (i) => {
      setIdx(i); setSliderPct(0); setSliderTransition(false); setSliderVal(null); setSelected([null, null]);
      const step = cats[i];
      t(() => { setSliderTransition(true); setSliderPct(step.imp * 10); setSliderVal(step.imp); }, 120);
      step.scores.forEach((score, ci) => {
        t(() => setSelected(prev => { const n = [...prev]; n[ci] = score; return n; }), 700 + ci * 420);
      });
      const totalDelay = 700 + step.scores.length * 420 + 800;
      t(() => run((i + 1) % cats.length), totalDelay);
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
              <div className="lp-s3-fill" style={{ width: `${sliderPct}%`, transition: sliderTransition ? 'width 0.7s cubic-bezier(0.16,1,0.3,1)' : 'none' }}/>
              <div className="lp-s3-thumb" style={{ left: `${sliderPct}%`, transition: sliderTransition ? 'left 0.7s cubic-bezier(0.16,1,0.3,1)' : 'none' }}/>
            </div>
            <span className="lp-s3-val">{sliderVal ?? '—'}</span>
          </div>
          <div className="lp-s1-label" style={{ marginTop: 10 }}>Score each cofounder</div>
          {names.map((name, i) => (
            <div key={i} className="lp-s3-cf">
              <div className="lp-s3-cf-name">{name}</div>
              <div className="lp-s3-dots">
                {[...Array(10)].map((_, d) => (
                  <div key={d} className={`lp-s3-dot${selected[i] === d + 1 ? ' selected' : ''}`}>{d + 1}</div>
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
  const sections = ['Formation & Purpose', 'Cofounder Info', 'Equity Allocation', 'Vesting Schedule', 'Decision-Making'];
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
    <div className="lp-fp" style={{ backgroundImage: "url('/images/paper.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-content">
        <div className="lp-fp-tag">Step 4</div>
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

const S4_MSGS = [
  { text: 'Hey Tim, what do you recommend for our vesting schedule.', sent: true },
  { text: 'Happy to help!', sent: false },
  { text: "I'd recommend 4-year vest with a 1-year cliff for both founders.", sent: false },
];

function PanelExpert({ active }) {
  const [shown, setShown] = useState([]);
  const [typingIdx, setTypingIdx] = useState(null);
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach(clearTimeout);
    refs.current = [];
    if (!active) { setShown([]); setTypingIdx(null); return; }
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };
    const showMsg = (idx) => {
      if (idx >= S4_MSGS.length) {
        t(() => { setShown([]); setTypingIdx(null); showMsg(0); }, 2000);
        return;
      }
      const msg = S4_MSGS[idx];
      if (msg.sent) {
        setShown(p => [...p, idx]);
        t(() => showMsg(idx + 1), 1200);
      } else {
        setTypingIdx(idx);
        t(() => {
          setTypingIdx(null);
          t(() => {
            setShown(p => [...p, idx]);
            t(() => showMsg(idx + 1), 1900);
          }, 280);
        }, 1300);
      }
    };
    showMsg(0);
    return () => refs.current.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="lp-fp" style={{ backgroundImage: "url('/images/chalk.png?v=2')" }}>
      <div className="lp-fp-overlay" />
      <div className="lp-fp-content">
        <div className="lp-fp-tag">Step 5</div>
        <div className="lp-fp-title">Expert Guidance</div>
        <div className="lp-s4-card">
          <div className="lp-s4-expert-row">
            <div className="lp-s4-avatar">T</div>
            <div><div className="lp-s4-name">Tim</div><div className="lp-s4-role">Cofounder Coach</div></div>
          </div>
          <div className="lp-s4-msgs">
            {S4_MSGS.map((m, i) => shown.includes(i) && (
              <div key={i} className={`lp-s4-msg${m.sent ? ' user' : ''}`}>{m.text}</div>
            ))}
            {typingIdx !== null && (
              <div className="lp-s4-typing"><div className="lp-s4-dot-anim"/><div className="lp-s4-dot-anim"/><div className="lp-s4-dot-anim"/></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const HV_NAV_ITEMS = ['Formation', 'Cofounder Info', 'Equity Allocation', 'Vesting', 'Decision-Making', 'IP & Ownership'];
const HV_SCENES = [
  { navActive: 2, prog: '30%', lbl: '30% Complete' },
  { navActive: 3, prog: '42%', lbl: '42% Complete' },
  { navActive: 4, prog: '54%', lbl: '54% Complete' },
  { navActive: 5, prog: '66%', lbl: '66% Complete' },
];

function HeroVisual() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [exitIdx, setExitIdx] = useState(null);
  const [sidebar, setSidebar] = useState(HV_SCENES[0]);
  const [eqText, setEqText] = useState('');
  const [eqCursorOff, setEqCursorOff] = useState(false);
  const [vestSel, setVestSel] = useState(null);
  const [decSel, setDecSel] = useState(null);
  const [ipCo, setIpCo] = useState('');
  const [ipJur, setIpJur] = useState('');
  const [clicking, setClicking] = useState(null);
  const refs = useRef([]);
  const activeIdxRef = useRef(0);

  useEffect(() => {
    const t = (fn, ms) => { const id = setTimeout(fn, ms); refs.current.push(id); };

    const clickContinue = (key, then) => {
      setClicking(key);
      t(() => { setClicking(null); t(then, 160); }, 260);
    };

    const runScene0 = () => {
      setEqText(''); setEqCursorOff(false);
      const answer = 'We agreed on an equal 50 / 50 split.';
      let i = 0;
      const step = () => {
        if (i < answer.length) { i++; setEqText(answer.slice(0, i)); t(step, 44); }
        else t(() => { setEqCursorOff(true); t(() => clickContinue('c1', () => goTo(1)), 700); }, 900);
      };
      t(step, 500);
    };

    const runScene1 = () => {
      setVestSel(null);
      t(() => { setVestSel(1); t(() => clickContinue('c2', () => goTo(2)), 900); }, 700);
    };

    const runScene2 = () => {
      setDecSel(null);
      t(() => { setDecSel(0); t(() => clickContinue('c3', () => goTo(3)), 900); }, 700);
    };

    const runScene3 = () => {
      setIpCo(''); setIpJur('');
      const coText = 'Acme Technologies, Inc.';
      const jurText = 'Delaware';
      let i = 0, j = 0;
      const typeJur = () => {
        if (j < jurText.length) { j++; setIpJur(jurText.slice(0, j)); t(typeJur, 60); }
        else t(() => clickContinue('c4', () => goTo(0)), 800);
      };
      const typeCo = () => {
        if (i < coText.length) { i++; setIpCo(coText.slice(0, i)); t(typeCo, 46); }
        else t(typeJur, 300);
      };
      t(typeCo, 500);
    };

    const runScene = (idx) => {
      if (idx === 0) runScene0();
      if (idx === 1) runScene1();
      if (idx === 2) runScene2();
      if (idx === 3) runScene3();
    };

    const goTo = (idx) => {
      const next = idx % HV_SCENES.length;
      setExitIdx(activeIdxRef.current);
      setActiveIdx(null);
      t(() => setExitIdx(null), 500);
      t(() => {
        activeIdxRef.current = next;
        setActiveIdx(next);
        setSidebar(HV_SCENES[next]);
        runScene(next);
      }, 120);
    };

    t(() => runScene0(), 2400);
    return () => { refs.current.forEach(clearTimeout); refs.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screenCls = (i) => `lp-hv-screen${activeIdx === i ? ' active' : ''}${exitIdx === i ? ' exit' : ''}`;

  return (
    <div className="lp-hero-visual lp-rv">
      <div className="lp-hv-bar">
        <span className="lp-dot-r"/><span className="lp-dot-y"/><span className="lp-dot-g"/>
        <div className="lp-hv-url">cherrytree.app / agreement</div>
      </div>
      <div className="lp-hv-body">
        <div className="lp-hv-sidebar">
          <div className="lp-hv-logo"><div className="lp-hv-logo-mark"/><div className="lp-hv-logo-name">Cherrytree</div></div>
          <div className="lp-hv-prog-lbl">{sidebar.lbl}</div>
          <div className="lp-hv-prog-bar"><div className="lp-hv-prog-fill" style={{ width: sidebar.prog }}/></div>
          {HV_NAV_ITEMS.map((label, i) => (
            <div key={i} className={`lp-hv-nav-item${i === sidebar.navActive ? ' active' : ''}`}>
              <span className={`lp-hv-dot${i < sidebar.navActive ? ' done' : i === sidebar.navActive ? ' act' : ''}`}/>{label}
            </div>
          ))}
        </div>
        <div className="lp-hv-main">
          <div className={screenCls(0)}>
            <div className="lp-hv-sec-lbl">Section 3 of 10 · Equity Allocation</div>
            <div className="lp-hv-q-title">How will you split equity?</div>
            <div className="lp-hv-q-hint">Describe your approach or run the equity calculator to surface each founder's contribution.</div>
            <div className="lp-hv-input-field focused">
              <span>{eqText}</span><span className={`lp-hv-inp-cursor${eqCursorOff ? ' off' : ''}`}/>
            </div>
            <button className={`lp-hv-continue${clicking === 'c1' ? ' clicking' : ''}`}>Continue →</button>
          </div>
          <div className={screenCls(1)}>
            <div className="lp-hv-sec-lbl">Section 4 of 10 · Vesting</div>
            <div className="lp-hv-q-title">How long should shares vest?</div>
            <div className="lp-hv-q-hint">Most startups use a 4-year vesting schedule with a 1-year cliff to protect both founders.</div>
            <div className="lp-hv-options">
              {['2 years', '4 years', '6 years'].map((label, i) => (
                <div key={i} className={`lp-hv-opt${vestSel === i ? ' selected' : ''}`}>{label}</div>
              ))}
            </div>
            <button className={`lp-hv-continue${clicking === 'c2' ? ' clicking' : ''}`}>Continue →</button>
          </div>
          <div className={screenCls(2)}>
            <div className="lp-hv-sec-lbl">Section 5 of 10 · Decision-Making</div>
            <div className="lp-hv-q-title">How will major decisions be made?</div>
            <div className="lp-hv-q-hint">Agreeing on a framework now prevents costly disputes later.</div>
            <div className="lp-hv-options">
              {['Unanimous vote', 'Majority vote', 'CEO decides'].map((label, i) => (
                <div key={i} className={`lp-hv-opt${decSel === i ? ' selected' : ''}`}>{label}</div>
              ))}
            </div>
            <button className={`lp-hv-continue${clicking === 'c3' ? ' clicking' : ''}`}>Continue →</button>
          </div>
          <div className={screenCls(3)}>
            <div className="lp-hv-sec-lbl">Section 6 of 10 · IP &amp; Ownership</div>
            <div className="lp-hv-q-title">Who owns what you build?</div>
            <div className="lp-hv-q-hint">All IP created for the company should be assigned to the entity, not individuals.</div>
            <div className="lp-hv-two-col">
              <div className="lp-hv-field-group">
                <div className="lp-hv-field-lbl">Company name</div>
                <div className="lp-hv-field-val">{ipCo}</div>
              </div>
              <div className="lp-hv-field-group">
                <div className="lp-hv-field-lbl">Jurisdiction</div>
                <div className="lp-hv-field-val">{ipJur}</div>
              </div>
            </div>
            <button className={`lp-hv-continue${clicking === 'c4' ? ' clicking' : ''}`}>Continue →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const PANELS = [PanelInvite, PanelCollab, PanelEquity, PanelReview, PanelExpert];

const LOGOS = [
  { name: 'Y Combinator', src: '/images/yc-logo.png' },
  { name: 'Hubble', src: '/images/hubble-logo.png' },
  { name: 'a16z', src: '/images/a16z-logo.jpg' },
  { name: 'UC Berkeley', src: '/images/berkeley-logo.png' },
  { name: 'Stanford', src: '/images/stanford-logo.png' },
  { name: 'Sequoia', src: '/images/sequoia-logo.png' },
  { name: 'Startup Grind', src: '/images/startupgrind-logo.png' },
];

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
  const [hoveredFaq, setHoveredFaq] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [counts, setCounts] = useState(STATS.map(() => 0));
  const [lineIn, setLineIn] = useState(STATS.map(() => false));
  const [typedProtect, setTypedProtect] = useState('');
  const protectTimersRef = useRef([]);
  const statRowRefs = useRef([]);
  const featItemRefs = useRef([]);
  const pricingCardRefs = useRef([]);

  const goToDashboard = () => {
    const isProd = window.location.hostname.includes('cherrytree.app');
    if (isProd) window.location.href = `${process.env.REACT_APP_APP_URL}/dashboard`;
    else navigate('/dashboard', { replace: true });
  };

  // Scroll reveal — fades/slides in each .lp-rv/.lp-rv-l/.lp-rv-r element once as it enters view.
  // Elements already in the viewport at observe() time can have their IntersectionObserver
  // callback fire before the browser has committed a style pass with the base (opacity:0)
  // styles, which causes the transition to opacity:1 to never run (position:sticky elements
  // are especially prone to this — a synchronous reflow read isn't enough to flush their
  // state). Deferring the class add to a fresh macrotask guarantees a real paint of the
  // "from" state happens first, regardless of the element's positioning scheme.
  useEffect(() => {
    const els = document.querySelectorAll('.lp-rv, .lp-rv-l, .lp-rv-r');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          obs.unobserve(target);
          void target.offsetHeight;
          setTimeout(() => target.classList.add('lp-rv-in'), 0);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

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

  // Stats: each row draws in its underline and counts up independently as it
  // individually scrolls into view (matching the source design's per-row observers,
  // rather than firing every stat at once when the section appears).
  useEffect(() => {
    const observers = statRowRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        setLineIn(prev => { const n = [...prev]; n[i] = true; return n; });
        const s = STATS[i];
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
      }, { threshold: 0.4 });
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o && o.disconnect());
  }, []);

  // Protect CTA: types "and your peace of mind." on an infinite loop — type out,
  // hold, clear, and after a slight pause type it out again.
  useEffect(() => {
    const target = 'and your peace of mind.';
    const t = (fn, ms) => { const id = setTimeout(fn, ms); protectTimersRef.current.push(id); };
    const cycle = () => {
      setTypedProtect('');
      let i = 0;
      const typeTick = () => {
        if (i < target.length) { i++; setTypedProtect(target.slice(0, i)); t(typeTick, 46); }
        else t(cycle, 2200);
      };
      t(typeTick, 46);
    };
    t(cycle, 600);
    return () => { protectTimersRef.current.forEach(clearTimeout); protectTimersRef.current = []; };
  }, []);

  // Enterprise has fewer features than Bootstrapped, so it naturally renders shorter.
  // Force its height to match Bootstrapped's rather than stretching every card to the
  // tallest one, so Scale (the featured, transform: scale(1.03) card) can still read as
  // visually larger the way it does in the source design.
  useLayoutEffect(() => {
    const matchEnterpriseHeight = () => {
      const bootstrapped = pricingCardRefs.current[0];
      const enterprise = pricingCardRefs.current[2];
      if (!bootstrapped || !enterprise) return;
      enterprise.style.height = 'auto';
      enterprise.style.height = `${bootstrapped.offsetHeight}px`;
    };
    matchEnterpriseHeight();
    window.addEventListener('resize', matchEnterpriseHeight);
    return () => window.removeEventListener('resize', matchEnterpriseHeight);
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
        <div className="lp-hero-strip" />
        <HeroVisual />
      </section>

      {/* ── Logo Wall ── */}
      <section className="lp-logowall">
        <div className="lp-logowall-label">Trusted by founding teams from</div>
        <div className="lp-logowall-track-wrap">
          <div className="lp-logowall-track">
            {[...LOGOS, ...LOGOS].map((logo, i, arr) => (
              <React.Fragment key={i}>
                <div className="lp-lw-logo">
                  <img className="lp-lw-img" src={logo.src} alt={logo.name} />
                </div>
                {i !== arr.length - 1 && <div className="lp-lw-divider" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-features" id="features">
        <div className="lp-feat-header">
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
      <section className="lp-stats">
        <div className="lp-stats-inner">
          <div className="lp-stats-left">
            <h2 className="lp-rv lp-d1">The proof is in the<br/><em>partnership.</em></h2>
            <p className="lp-rv lp-d2">Founding teams across the country have used Cherrytree to get aligned before they build. No lawyers required. No legal background needed.</p>
          </div>
          <div className="lp-stats-right">
            {STATS.map((s, i) => (
              <div key={i} className={`lp-stat-row${lineIn[i] ? ' lp-line-in' : ''}`} ref={el => statRowRefs.current[i] = el}>
                <div className="lp-stat-num-row">
                  <div className="lp-stat-num">{s.prefix || ''}{counts[i].toLocaleString()}{s.suffix}</div>
                  <div className="lp-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="lp-testi">
        <div className="lp-testi-header">
          <h2 className="lp-rv lp-d1">What founders are saying.</h2>
        </div>
        <div className="lp-testi-grid">
          {[
            { init: 'M', name: 'Maya R.', role: 'Co-founder, Stealth startup', quote: '"We thought we were aligned on equity until Cherrytree showed us we weren\'t. It surfaced a real disagreement before it became a real problem. Worth every minute."' },
            { init: 'J', name: 'James T.', role: 'Founder, YC S24', quote: '"Our accelerator recommended this and I\'m glad they did. We got through IP and vesting in one sitting and actually understood what we were agreeing to."' },
            { init: 'S', name: 'Sarah K.', role: 'Co-founder, FinTech startup', quote: '"The equity calculator alone is worth it. We scored each other independently and compared — it was the most honest conversation we\'d had about the company."' },
          ].map((t, i) => (
            <div key={i} className={`lp-testi-card lp-rv lp-d${i}`} style={{ backgroundImage: "url('/images/testimonial-paper.jpg')" }}>
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
            <h2 className="lp-carousel-title">Built for every kind of <em>founding team.</em></h2>
          </div>
          <div className="lp-carousel-nav">
            <button className="lp-carousel-btn" onClick={() => setCarouselIdx(i => (i - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}>←</button>
            <button className="lp-carousel-btn" onClick={() => setCarouselIdx(i => (i + 1) % CAROUSEL_SLIDES.length)}>→</button>
          </div>
        </div>
        <div className="lp-carousel-track-wrap">
          <div className="lp-carousel-track" style={{ transform: `translateX(calc(-${carouselIdx} * 380px))` }}>
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
          <h2 className="lp-rv lp-d1">Founder-friendly pricing.</h2>
          <p className="lp-rv lp-d2">Choose the plan that's right for your team.</p>
        </div>
        <div className="lp-pricing-grid">
          {PRICING.map((p, i) => (
            <div key={i} ref={el => pricingCardRefs.current[i] = el} className={`lp-pricing-card lp-rv lp-d${i}${p.featured ? ' featured' : ''}`}>
              {p.badge && <div className="lp-pricing-badge">{p.badge}</div>}
              <div className="lp-pricing-tier">{p.tier}</div>
              <div className={`lp-pricing-price${p.enterprise ? ' lp-pricing-price-custom' : ''}`}>{p.price}</div>
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
            <h2 className="lp-rv lp-d1">FAQ</h2>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((f, i) => {
              const expanded = openFaq === i || hoveredFaq === i;
              return (
                <div
                  key={i}
                  className={`lp-faq-item lp-rv lp-d${Math.min(i, 4)}`}
                  onMouseEnter={() => setHoveredFaq(i)}
                  onMouseLeave={() => setHoveredFaq(prev => (prev === i ? null : prev))}
                >
                  <button className="lp-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="lp-faq-q">{f.q}</span>
                  </button>
                  <div className={`lp-faq-body${expanded ? ' open' : ''}`}>
                    <div className="lp-faq-body-inner"><p className="lp-faq-a">{f.a}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Protect CTA ── */}
      <section className="lp-protect-cta">
        <h2>
          Protect your piece of the pie<br/>
          <em>{typedProtect}<span className="lp-cursor"/></em>
        </h2>
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

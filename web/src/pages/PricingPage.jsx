import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';
import MarketingGrain from '../components/MarketingGrain';

const PLANS = [
  {
    tier: 'Bootstrapped', price: '$200', period: 'One-time payment',
    desc: 'Ideal for early-stage or bootstrapped teams that need to move fast and start building now.',
    features: ['Expert-designed survey', 'Comprehensive agreements', 'Proprietary equity calculator', 'Best practices and tips', 'Up to 5 collaborators'],
    cta: 'Get started', featured: false,
  },
  {
    tier: 'Scale', price: '$2,000', period: 'One-time payment', badge: 'Most popular',
    desc: 'Built for funded teams that need deeper control, greater detail, and stronger foundations.',
    features: ['Everything in Bootstrapped', 'Final attorney review', 'Personalized onboarding', 'Cofounder coaching', 'Priority support'],
    cta: 'Get started', featured: true,
  },
  {
    tier: 'Enterprise', price: 'Custom', period: 'Contact for volume pricing',
    desc: 'Running a fund or accelerator and want to deploy in bulk? We\'ll set you up.',
    features: ['Everything in Scale, for your cohort', 'Cohort dashboard and progress tracking', 'Branded experience for your program', 'Dedicated account support'],
    cta: 'Contact sales', enterprise: true,
  },
];

const COMPARE_ROWS = [
  { label: 'Equity & vesting schedules', b: true, s: true, e: true },
  { label: 'Roles & responsibilities', b: true, s: true, e: true },
  { label: 'Intellectual property', b: true, s: true, e: true },
  { label: 'Decision-making & voting', b: true, s: true, e: true },
  { label: 'Non-compete & exit clauses', b: true, s: true, e: true },
  { label: 'Email support', b: true, s: true, e: true },
  { label: 'Priority support', b: false, s: true, e: true },
  { label: 'Attorney review', b: false, s: true, e: true },
  { label: 'Cofounder coaching', b: false, s: true, e: true },
  { label: 'Dedicated account manager', b: false, s: false, e: true },
  { label: 'Bulk licensing', b: false, s: false, e: true },
  { label: 'Branded experience', b: false, s: false, e: true },
  { label: 'Cohort dashboard', b: false, s: false, e: true },
];

const FAQS = [
  { q: 'Which plan is right for me?', a: "If your cofoundership is fairly simple, get the Bootstrapped plan. You fill out a survey and receive a ready-to-use cofounder agreement. If your cofoundership is more complex, or if you want extra peace of mind, get Scale — you'll get an attorney review and a cofounder coach." },
  { q: 'Is the price per agreement or per person?', a: "The price covers one agreement. You can add as many cofounders as you want, even on the Bootstrapped plan. Only one person pays; they invite everyone else. A new company later needs a separate purchase." },
  { q: 'Do you offer discounts?', a: "If you're currently a student, reach out to tim@cherrytree.app with your .edu email and we'll get you a discount." },
  { q: 'Can we upgrade anytime?', a: "Yes. If you start with Bootstrapped but realize you want an attorney review, you can upgrade to Scale at any time." },
  { q: 'Do we pay again to edit later?', a: "No, edit all you want. The only repeat cost is if you create a brand-new agreement for a different company." },
];

function Check({ on }) {
  if (!on) return <span className="lp-ppt-dash">—</span>;
  return <span className="lp-ppt-check">✓</span>;
}

function PricingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [hoveredFaq, setHoveredFaq] = useState(null);
  const [typedProtect, setTypedProtect] = useState('');
  const protectTimersRef = useRef([]);

  usePageMeta({
    title: 'Pricing — Cherrytree',
    description: 'Affordable cofounder agreement pricing. Bootstrapped at $200, Scale at $2,000, Enterprise custom.',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Pricing' }],
  });

  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.text = JSON.stringify(faqSchema); s.id = 'faq-schema';
    document.head.appendChild(s);
    return () => { const el = document.getElementById('faq-schema'); if (el) document.head.removeChild(el); };
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

  const goToDashboard = () => {
    const isProd = window.location.hostname.includes('cherrytree.app');
    if (isProd) window.location.href = `${process.env.REACT_APP_APP_URL}/dashboard`;
    else navigate('/dashboard', { replace: true });
  };

  // Enterprise has fewer features than Bootstrapped, so it naturally renders shorter.
  // Force its height to match Bootstrapped's rather than stretching every card to the
  // tallest one, so Scale (the featured, transform: scale(1.03) card) can still read as
  // visually larger the way it does in the source design.
  const pricingCardRefs = useRef([]);
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

  return (
    <div className="lp" style={{ minHeight: '100vh' }}>
      <MarketingGrain />
      <MarketingNav />

      {/* Hero */}
      <section className="lp-pricing-pg-hero">
        <div className="lp-overline">Pricing</div>
        <h1 className="lp-pricing-pg-h1">Founder-friendly pricing.</h1>
        <p className="lp-pricing-pg-sub">Choose the plan that's right for your team. No subscriptions, no surprises.</p>
      </section>

      {/* Cards */}
      <section className="lp-pricing-pg-cards-wrap">
        <div className="lp-pricing-grid">
          {PLANS.map((p, i) => (
            <div key={i} ref={el => pricingCardRefs.current[i] = el} className={`lp-pricing-card${p.featured ? ' featured' : ''}`}>
              {p.badge && <div className="lp-pricing-badge">{p.badge}</div>}
              <div className="lp-pricing-tier">{p.tier}</div>
              <div className="lp-pricing-price">
                {p.price.startsWith('$') ? <><span>$</span>{p.price.slice(1)}</> : p.price}
              </div>
              <div className="lp-pricing-period">{p.period}</div>
              <div className="lp-pricing-divider"/>
              <p className="lp-pricing-desc">{p.desc}</p>
              <ul className="lp-pricing-features">
                {p.features.map((f, j) => (
                  <li key={j} className="lp-pricing-feat">
                    <span className="lp-pf-check">
                      <svg viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke={p.featured ? '#6a9e8a' : '#4B7263'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`lp-pricing-cta ${p.featured ? 'filled' : p.enterprise ? 'solid' : 'outline'}`}
                onClick={() => p.enterprise ? window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 }) : goToDashboard()}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Compare table */}
      <section className="lp-pricing-pg-compare">
        <div className="lp-pricing-pg-compare-inner">
          <h2 className="lp-pricing-pg-compare-title">Compare plans</h2>
          <p className="lp-pricing-pg-compare-sub">Each plan covers one cofounder agreement. Fill out the survey and equity calculator to get a ready-to-use agreement.</p>
          <table className="lp-pricing-pg-table">
            <thead>
              <tr>
                <th className="lp-ppt-feature-col"></th>
                <th>Bootstrapped</th>
                <th>Scale</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, ri) => (
                <tr key={ri} className="lp-ppt-row">
                  <td className="lp-ppt-label">{row.label}</td>
                  <td><Check on={row.b}/></td>
                  <td><Check on={row.s}/></td>
                  <td><Check on={row.e}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-faq">
        <div className="lp-faq-inner">
          <div className="lp-faq-header">
            <div className="lp-overline">FAQ</div>
            <h2>Common questions.</h2>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((f, i) => {
              const expanded = openFaq === i || hoveredFaq === i;
              return (
                <div
                  key={i}
                  className="lp-faq-item"
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

      {/* Bottom CTA */}
      <section className="lp-protect-cta">
        <h2>
          Protect your piece of the pie<br/>
          <em>{typedProtect}<span className="lp-cursor"/></em>
        </h2>
        <div className="lp-protect-cta-actions">
          <button className="lp-btn-primary" onClick={goToDashboard}>Get started</button>
          <a className="lp-btn-ghost" href="https://cal.com/tim-he/15min" target="_blank" rel="noopener noreferrer">Book a demo →</a>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

export default PricingPage;

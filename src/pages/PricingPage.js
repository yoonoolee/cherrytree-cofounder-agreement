import React, { useState, useEffect } from 'react';
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
  { section: 'Agreement', rows: [
    { label: 'Equity & vesting schedules', b: true, s: true, e: true },
    { label: 'Roles & responsibilities', b: true, s: true, e: true },
    { label: 'Intellectual property', b: true, s: true, e: true },
    { label: 'Decision-making & voting', b: true, s: true, e: true },
    { label: 'Non-compete & exit clauses', b: true, s: true, e: true },
  ]},
  { section: 'Support', rows: [
    { label: 'Email support', b: true, s: true, e: true },
    { label: 'Priority support', b: false, s: true, e: true },
    { label: 'Attorney review', b: false, s: true, e: true },
    { label: 'Cofounder coaching', b: false, s: true, e: true },
    { label: 'Dedicated account manager', b: false, s: false, e: true },
  ]},
  { section: 'Enterprise', rows: [
    { label: 'Bulk licensing', b: false, s: false, e: true },
    { label: 'Branded experience', b: false, s: false, e: true },
    { label: 'Cohort dashboard', b: false, s: false, e: true },
  ]},
];

const FAQS = [
  { q: 'Which plan is right for me?', a: "If your cofoundership is fairly simple, get the Bootstrapped plan. You fill out a survey and receive a ready-to-use cofounder agreement. If your cofoundership is more complex, or if you want extra peace of mind, get Scale — you'll get an attorney review and a cofounder coach." },
  { q: 'Is the price per agreement or per person?', a: "The price covers one agreement. You can add as many cofounders as you want, even on the Bootstrapped plan. Only one person pays; they invite everyone else. A new company later needs a separate purchase." },
  { q: 'Do you offer discounts?', a: "If you're currently a student, reach out to tim@cherrytree.app with your .edu email and we'll get you a discount." },
  { q: 'Can we upgrade anytime?', a: "Yes. If you start with Bootstrapped but realize you want an attorney review, you can upgrade to Scale at any time." },
  { q: 'Do we pay again to edit later?', a: "No, edit all you want. The only repeat cost is if you create a brand-new agreement for a different company." },
];

function Check({ on, dark }) {
  if (!on) return <span style={{ color: dark ? 'rgba(255,255,255,0.2)' : '#ccc', fontSize: 13 }}>—</span>;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:20, height:20, borderRadius:4, background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(75,114,99,0.1)', border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(75,114,99,0.25)'}`, color: dark ? 'rgba(255,255,255,0.7)' : '#4B7263', fontSize:11 }}>✓</span>
  );
}

function PricingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

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

  const goToDashboard = () => {
    const isProd = window.location.hostname.includes('cherrytree.app');
    if (isProd) window.location.href = `${process.env.REACT_APP_APP_URL}/dashboard`;
    else navigate('/dashboard', { replace: true });
  };

  return (
    <div className="lp" style={{ minHeight: '100vh' }}>
      <MarketingGrain />
      <MarketingNav />

      {/* Hero */}
      <section className="lp-pricing-pg-hero">
        <div className="lp-overline">Pricing</div>
        <h1 className="lp-pricing-pg-h1">Founder-friendly pricing.</h1>
        <p className="lp-pricing-pg-sub">Choose the plan that's right for your team.</p>
      </section>

      {/* Cards */}
      <section className="lp-pricing-pg-cards-wrap">
        <div className="lp-pricing-grid">
          {PLANS.map((p, i) => (
            <div key={i} className={`lp-pricing-card${p.featured ? ' featured' : ''}`}>
              {p.badge && <div className="lp-pricing-badge">{p.badge}</div>}
              <div className="lp-pricing-tier">{p.tier}</div>
              <div className="lp-pricing-price">{p.price}</div>
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
        <h2 className="lp-pricing-pg-compare-title">Compare plans.</h2>
        <p className="lp-pricing-pg-compare-sub">Each plan covers one cofounder agreement.</p>
        <div className="lp-pricing-pg-table-wrap">
          <table className="lp-pricing-pg-table">
            <thead>
              <tr>
                <th className="lp-ppt-feature-col">Features</th>
                <th>Bootstrapped</th>
                <th className="lp-ppt-featured-col">Scale</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((group, gi) => (
                <React.Fragment key={gi}>
                  <tr className="lp-ppt-section-row">
                    <td colSpan={4}>{group.section}</td>
                  </tr>
                  {group.rows.map((row, ri) => (
                    <tr key={ri} className="lp-ppt-row">
                      <td className="lp-ppt-label">{row.label}</td>
                      <td><Check on={row.b}/></td>
                      <td className="lp-ppt-featured-col"><Check on={row.s}/></td>
                      <td><Check on={row.e}/></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-faq" style={{ background: 'var(--lp-bg2)' }}>
        <div className="lp-faq-inner">
          <div className="lp-faq-header">
            <div className="lp-overline">FAQ</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px,4vw,52px)', fontWeight: 400, letterSpacing: '-0.8px', lineHeight: 1.1 }}>Common questions.</h2>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className="lp-faq-item">
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

      {/* Bottom CTA */}
      <section className="lp-protect-cta">
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px,5vw,68px)', fontWeight: 400, letterSpacing: '-2px', lineHeight: 1.08, marginBottom: 40 }}>
          Protect your piece of the pie<br/><em style={{ fontStyle: 'italic', color: 'var(--lp-green)' }}>and</em> your peace of mind.
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

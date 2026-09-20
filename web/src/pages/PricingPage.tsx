import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePageMeta } from '../hooks/usePageMeta.ts';
import { useEnterpriseCardHeight } from '../hooks/useEnterpriseCardHeight.ts';
import { useTypewriter } from '../hooks/useTypewriter.ts';
import MarketingNav from '../components/MarketingNav.tsx';
import MarketingFooter from '../components/MarketingFooter.tsx';
import MarketingGrain from '../components/MarketingGrain.tsx';
import FaqList, { type Faq } from '../components/FaqList.tsx';
import { goToDashboard } from '../utils/goToDashboard.ts';
import { MARKETING_PLANS } from '../constants/pricing.ts';

interface CompareRow {
  label: string;
  /** Bootstrapped / Scale / Enterprise */
  b: boolean;
  s: boolean;
  e: boolean;
}

const COMPARE_ROWS: readonly CompareRow[] = [
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

const FAQS: readonly Faq[] = [
  {
    q: 'Which plan is right for me?',
    a: "If your cofoundership is fairly simple, get the Bootstrapped plan. You fill out a survey and receive a ready-to-use cofounder agreement. If your cofoundership is more complex, or if you want extra peace of mind, get Scale — you'll get an attorney review and a cofounder coach.",
  },
  {
    q: 'Is the price per agreement or per person?',
    a: 'The price covers one agreement. You can add as many cofounders as you want, even on the Bootstrapped plan. Only one person pays; they invite everyone else. A new company later needs a separate purchase.',
  },
  {
    q: 'Do you offer discounts?',
    a: "If you're currently a student, reach out to tim@cherrytree.app with your .edu email and we'll get you a discount.",
  },
  {
    q: 'Can we upgrade anytime?',
    a: 'Yes. If you start with Bootstrapped but realize you want an attorney review, you can upgrade to Scale at any time.',
  },
  {
    q: 'Do we pay again to edit later?',
    a: 'No, edit all you want. The only repeat cost is if you create a brand-new agreement for a different company.',
  },
];

function Check({ on }: { on: boolean }) {
  if (!on) return <span className="lp-ppt-dash">—</span>;
  return <span className="lp-ppt-check">✓</span>;
}

function PricingPage() {
  const navigate = useNavigate();
  // Protect CTA: types "and your peace of mind." on an infinite loop — type out,
  // hold, clear, and after a slight pause type it out again.
  const typedProtect = useTypewriter('and your peace of mind.', { charDelay: 46, holdDelay: 2200 });

  usePageMeta({
    title: 'Pricing — Cherrytree',
    description:
      'Affordable cofounder agreement pricing. Bootstrapped at $200, Scale at $2,000, Enterprise custom.',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Pricing' }],
  });

  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.text = JSON.stringify(faqSchema);
    s.id = 'faq-schema';
    document.head.appendChild(s);
    return () => {
      const el = document.getElementById('faq-schema');
      if (el) document.head.removeChild(el);
    };
  }, []);

  const goDash = () => goToDashboard(navigate);

  const pricingCardRefs = useEnterpriseCardHeight();

  return (
    <div className="lp" style={{ minHeight: '100vh' }}>
      <MarketingGrain />
      <MarketingNav />

      {/* Hero */}
      <section className="lp-pricing-pg-hero">
        <div className="lp-overline">Pricing</div>
        <h1 className="lp-pricing-pg-h1">Founder-friendly pricing.</h1>
        <p className="lp-pricing-pg-sub">
          Choose the plan that's right for your team. No subscriptions, no surprises.
        </p>
      </section>

      {/* Cards */}
      <section className="lp-pricing-pg-cards-wrap">
        <div className="lp-pricing-grid">
          {MARKETING_PLANS.map((p, i) => (
            <div
              key={i}
              ref={(el) => {
                pricingCardRefs.current[i] = el;
              }}
              className={`lp-pricing-card${p.featured ? ' featured' : ''}`}
            >
              {p.badge && <div className="lp-pricing-badge">{p.badge}</div>}
              <div className="lp-pricing-tier">{p.tier}</div>
              <div className="lp-pricing-price">
                {p.price.startsWith('$') ? (
                  <>
                    <span>$</span>
                    {p.price.slice(1)}
                  </>
                ) : (
                  p.price
                )}
              </div>
              <div className="lp-pricing-period">{p.period}</div>
              <div className="lp-pricing-divider" />
              <p className="lp-pricing-desc">{p.desc}</p>
              <ul className="lp-pricing-features">
                {p.features.map((f, j) => (
                  <li key={j} className="lp-pricing-feat">
                    <span className="lp-pf-check">
                      <svg viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1.5 4l2 2 3-3"
                          stroke={p.featured ? '#6a9e8a' : '#4B7263'}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`lp-pricing-cta ${p.ctaStyle}`}
                onClick={() =>
                  p.enterprise
                    ? window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 })
                    : goDash()
                }
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
          <p className="lp-pricing-pg-compare-sub">
            Each plan covers one cofounder agreement. Fill out the survey and equity calculator to
            get a ready-to-use agreement.
          </p>
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
                  <td>
                    <Check on={row.b} />
                  </td>
                  <td>
                    <Check on={row.s} />
                  </td>
                  <td>
                    <Check on={row.e} />
                  </td>
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
          <FaqList faqs={FAQS} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="lp-protect-cta">
        <h2>
          Protect your piece of the pie
          <br />
          <em>
            {typedProtect}
            <span className="lp-cursor" />
          </em>
        </h2>
        <div className="lp-protect-cta-actions">
          <button className="lp-btn-primary" onClick={goDash}>
            Get started
          </button>
          <a
            className="lp-btn-ghost"
            href="https://cal.com/tim-he/15min"
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a demo →
          </a>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

export default PricingPage;

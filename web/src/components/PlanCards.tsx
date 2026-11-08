import type { CSSProperties } from 'react';

import type { MarketingPlan } from '../constants/pricing.ts';

/** Opens the Tally contact form (Enterprise's Contact sales). */
const openContactForm = () => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 });

/**
 * The marketing plan cards (landing and pricing pages): every plan on one white card, each with a
 * grainy beige price panel, its button, then its features. A plan whose first feature starts
 * "Everything in …" shows that as an intro line above the rest.
 */
function PlanCards({
  plans,
  onStart,
}: {
  plans: readonly MarketingPlan[];
  /** Get started (every plan but Enterprise, which opens the contact form). */
  onStart: () => void;
}) {
  return (
    <div className="lp-pw" style={{ '--pw-cols': plans.length } as CSSProperties}>
      {plans.map((plan) => {
        const inherits = plan.features[0]?.startsWith('Everything in');
        const list = inherits ? plan.features.slice(1) : plan.features;
        return (
          <article key={plan.tier} className="lp-pw-card">
            <div className="lp-pw-panel">
              <h3 className="lp-pw-tier">{plan.tier}</h3>
              <div className="lp-pw-price">
                {plan.price}
                {plan.price.startsWith('$') && <span>one-time</span>}
              </div>
            </div>
            <button
              className="lp-btn-primary lp-plan-cta"
              onClick={plan.enterprise ? openContactForm : onStart}
            >
              {plan.cta}
            </button>
            <ul className="lp-pw-features">
              {inherits && (
                <li className="lp-pw-includes">
                  {plan.features[0]}, plus <span aria-hidden="true">↴</span>
                </li>
              )}
              {list.map((f) => (
                <li key={f}>
                  <span className="lp-pw-tick" aria-hidden="true">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

export default PlanCards;

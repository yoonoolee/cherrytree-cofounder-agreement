import type { Plan } from '@cherrytree/shared';

/** A purchasable plan (`Plan`) or the contact-us tier shown alongside them. */
export interface PricingPlan {
  name: string;
  key: Plan | 'enterprise';
  /** Display price, e.g. `'$20'` or `'Custom'`. */
  price: string;
  /** Numeric price in dollars; `null` for a quote-based tier. */
  priceValue: number | null;
  description: string;
  features: string[];
  /** Highlighted in the pricing grid. */
  featured?: boolean;
}

export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    name: 'Essential',
    key: 'starter',
    price: '$20',
    priceValue: 20,
    description: 'For individuals to get started',
    features: [
      'Expert-designed guided survey',
      'Comprehensive agreements',
      'Proprietary equity calculator',
      'Best practices and tips',
      'Up to 5 collaborators',
    ],
    featured: true,
  },
  {
    name: 'Plus',
    key: 'pro',
    price: '$2000',
    priceValue: 2000,
    description: 'Everything in Essential, plus',
    features: ['Attorney review', 'Cofounder coaching', 'Priority support'],
  },
  {
    name: 'Enterprise',
    key: 'enterprise',
    price: 'Custom',
    priceValue: null,
    description: 'For investors and schools',
    features: ['Bulk licensing', 'White label option', 'Priority support'],
  },
];

/**
 * A plan card on the marketing pages (LandingPage, PricingPage). Same tier names as
 * `PRICING_PLANS` above (the in-app purchase/upgrade tiers); the copy and feature lists differ.
 */
export interface MarketingPlan {
  tier: string;
  /** `$…`, or `Let's talk` for the quote-based Enterprise tier. */
  price: string;
  period: string;
  desc: string;
  features: readonly string[];
  cta: string;
  featured?: boolean;
  /** Contact sales opens the Tally form instead of the dashboard. */
  enterprise?: boolean;
}

export const MARKETING_PLANS: readonly MarketingPlan[] = [
  {
    tier: 'Essential',
    price: '$20',
    period: 'One-time payment',
    desc: 'For early-stage teams that want to move fast and start building.',
    features: [
      'Answer in your own words',
      'Smart follow-up questions',
      'Complete 10-section agreement',
      'Review and edit before you sign',
      'Covers all your cofounders',
    ],
    cta: 'Get started',
  },
  {
    tier: 'Plus',
    price: '$2,000',
    period: 'One-time payment',
    desc: 'For funded teams that want more detail and expert backing.',
    features: [
      'Everything in Essential',
      'Final attorney review',
      'Personalized onboarding',
      'Cofounder coaching',
      'Priority support',
    ],
    cta: 'Get started',
    featured: true,
  },
  {
    tier: 'Enterprise',
    price: "Let's talk",
    period: 'Contact for volume pricing',
    desc: "Running a fund or accelerator and want to deploy in bulk? We'll set you up.",
    features: [
      'Everything in Plus, for your cohort',
      'Cohort dashboard and progress tracking',
      'Branded experience for your program',
      'Dedicated account support',
    ],
    cta: 'Contact sales',
    enterprise: true,
  },
];

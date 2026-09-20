import type { Plan } from '@cherrytree/shared';

/** A purchasable plan (`Plan`) or the contact-us tier shown alongside them. */
export interface PricingPlan {
  name: string;
  key: Plan | 'enterprise';
  /** Display price, e.g. `'$200'` or `'Custom'`. */
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
    name: 'Starter',
    key: 'starter',
    price: '$200',
    priceValue: 200,
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
    name: 'Pro',
    key: 'pro',
    price: '$2000',
    priceValue: 2000,
    description: 'Everything in Starter, plus',
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
 * A plan card on the marketing pages (LandingPage, PricingPage). Note the copy differs from
 * `PRICING_PLANS` above (the in-app purchase/upgrade tiers): Bootstrapped/Scale vs
 * Starter/Pro, and the feature lists.
 */
export interface MarketingPlan {
  tier: string;
  /** `$…` or `Custom`; PricingPage renders the sign in its own span. */
  price: string;
  period: string;
  desc: string;
  features: readonly string[];
  cta: string;
  ctaStyle: 'outline' | 'filled' | 'solid';
  badge?: string;
  featured?: boolean;
  /** Contact sales opens the Tally form instead of the dashboard. */
  enterprise?: boolean;
}

export const MARKETING_PLANS: readonly MarketingPlan[] = [
  {
    tier: 'Bootstrapped',
    price: '$200',
    period: 'One-time payment',
    desc: 'Ideal for early-stage or bootstrapped teams that need to move fast and start building now.',
    features: [
      'Expert-designed survey',
      'Comprehensive agreements',
      'Proprietary equity calculator',
      'Best practices and tips',
      'Up to 5 collaborators',
    ],
    cta: 'Get started',
    ctaStyle: 'outline',
  },
  {
    tier: 'Scale',
    price: '$2,000',
    period: 'One-time payment',
    badge: 'Most popular',
    desc: 'Built for funded teams that need deeper control, greater detail, and stronger foundations.',
    features: [
      'Everything in Bootstrapped',
      'Final attorney review',
      'Personalized onboarding',
      'Cofounder coaching',
      'Priority support',
    ],
    cta: 'Get started',
    ctaStyle: 'filled',
    featured: true,
  },
  {
    tier: 'Enterprise',
    price: 'Custom',
    period: 'Contact for volume pricing',
    desc: "Running a fund or accelerator and want to deploy in bulk? We'll set you up.",
    features: [
      'Everything in Scale, for your cohort',
      'Cohort dashboard and progress tracking',
      'Branded experience for your program',
      'Dedicated account support',
    ],
    cta: 'Contact sales',
    ctaStyle: 'solid',
    enterprise: true,
  },
];

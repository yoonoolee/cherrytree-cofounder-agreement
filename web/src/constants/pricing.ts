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

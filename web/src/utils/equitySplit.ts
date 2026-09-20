import type { EquityCalculatorDraft } from '@cherrytree/shared';

/** A scoring category and the bucket it is shown under. */
export interface EquityCategory {
  name: string;
  group: string;
}

// Category list grouped into buckets — matches Anika's final-eqc3 design.
export const GROUPS: readonly { name: string; categories: readonly string[] }[] = [
  {
    name: 'Input',
    categories: ['Cash Invested', 'Time Commitment', 'Existing Work & IP', 'Equipment & Tools'],
  },
  {
    name: 'Execution',
    categories: [
      'Leadership & Management',
      'Engineering',
      'Sales',
      'Product',
      'Fundraising',
      'Recruiting',
      'Operations',
    ],
  },
  {
    name: 'Intangibles',
    categories: [
      'Domain Expertise',
      'Network Value',
      'Irreplaceability',
      'Role Scalability',
      'Opportunity Cost',
      'Risk Tolerance',
      'Idea Origination',
    ],
  },
];

export const CATEGORIES: readonly EquityCategory[] = GROUPS.flatMap((g) =>
  g.categories.map((name) => ({ name, group: g.name })),
);

/**
 * Weighted-average split: each cofounder's share = sum(importance * score) / sum(importance) for
 * all categories rated important, normalized to 100%. `scores` is keyed by cofounder index.
 * Returns null while nothing is rated important or every important category is unscored.
 */
export function calculateSplit(
  importance: EquityCalculatorDraft['importance'],
  scores: EquityCalculatorDraft['scores'],
  numCofounders: number,
): number[] | null {
  const active = CATEGORIES.filter((c) => (importance[c.name] || 0) > 0);
  if (!active.length) return null;
  const weighted = Array.from({ length: numCofounders }, (_, ci) =>
    active.reduce(
      (sum, c) => sum + (importance[c.name] || 0) * ((scores[ci] || {})[c.name] || 0),
      0,
    ),
  );
  const total = weighted.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return weighted.map((w) => (w / total) * 100);
}

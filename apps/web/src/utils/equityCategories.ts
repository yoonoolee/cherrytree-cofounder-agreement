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

/** All dropdown/radio/checkbox options. Display strings, so typed as plain `string`. */

export interface SelectOption {
  value: string;
  label: string;
}

export const US_STATES: readonly SelectOption[] = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export const ENTITY_TYPES: readonly string[] = ['C-Corp', 'S-Corp', 'LLC', 'Other'];

export const INDUSTRIES: readonly string[] = [
  'AI / Machine Learning',
  'AR / VR / Spatial Computing',
  'Biotech',
  'Climate / Clean Energy',
  'Consumer / D2C',
  'Cybersecurity',
  'E-commerce',
  'Edtech',
  'Fintech',
  'Food & Beverage / Foodtech',
  'Gaming / Entertainment',
  'Hardware / IoT',
  'Healthtech / Medtech',
  'HR / Future of Work',
  'Legaltech / Regtech',
  'Logistics / Supply Chain',
  'Media / Creator Economy',
  'Mobility / Transportation',
  'Proptech / Real Estate',
  'Social Impact / Nonprofit Tech',
  'Software / SaaS',
  'Sustainability / Carbon Tech',
  'Travel / Hospitality',
  'Web3 / Blockchain / Crypto',
  'Other',
];

export const ROLES: readonly string[] = [
  'Community / content',
  'Customer success / support',
  'Engineering / development',
  'Finance / operations',
  'Fundraising',
  'Hiring / culture',
  'Legal / compliance',
  'Marketing / growth',
  'Product strategy',
  'Sales / business development',
  'UX / design',
  'Other',
];

export const MAJOR_DECISIONS: readonly string[] = [
  'Accepting advisors',
  'Accepting investors',
  'Equity allocations',
  'Hiring key personnel',
  'Major partnerships or contracts',
  'Product pivots',
  'Selling the company or merging',
  'None of the above',
  'Other',
];

export const TIE_RESOLUTION_OPTIONS: readonly string[] = [
  'Consult agreed external advisor / board member',
  'Mediation with a neutral third party',
  'Final decision authority by domain',
];

export const VESTING_SCHEDULES: readonly string[] = [
  '4 years with 1-year cliff',
  '3 years with 1-year cliff',
  'Immediate',
  'Other',
];

export const VESTED_SHARES_DISPOSAL_OPTIONS: readonly string[] = [
  'The company has the option to repurchase vested shares at Fair Market Value',
  'The company must repurchase vested shares at Fair Market Value',
  "Vested shares transfer to the cofounder's estate or heirs, without voting or board rights",
];

export const PERFORMANCE_CONSEQUENCES: readonly string[] = [
  'Formal warning and performance plan',
  'Temporary suspension of voting rights',
  'Reduction or dilution of unvested equity',
  'Role reassignment or demotion',
  'Termination',
];

export const TERMINATION_WITH_CAUSE_OPTIONS: readonly string[] = [
  'Fraud, embezzlement, or theft',
  'Breach of fiduciary duty',
  'Willful misconduct or gross negligence',
  'Material breach of this agreement',
  'Criminal conviction',
  'Other',
];

export const NON_COMPETE_DURATIONS: readonly string[] = [
  '6 months',
  '1 year',
  '2 years',
  'No non-competition clause',
  'Other',
];

export const NON_SOLICIT_DURATIONS: readonly string[] = [
  '6 months',
  '1 year',
  '2 years',
  'No non-solicitation clause',
  'Other',
];

export const DISPUTE_RESOLUTION_OPTIONS: readonly string[] = [
  'Mediation first, then arbitration if mediation fails',
  'Binding arbitration',
  'Litigation in courts',
  'Other',
];

export const AMENDMENT_PROCESS_OPTIONS: readonly string[] = [
  'Unanimous written consent of all cofounders',
  'Majority vote of cofounders',
  'Other',
];

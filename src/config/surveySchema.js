/**
 * Survey Schema - Single Source of Truth
 *
 * This file defines all survey fields, their defaults, options, and "Other" field mappings.
 * When adding a new field with an "Other" option:
 * 1. Add the field to SURVEY_FIELDS with hasOther: true
 * 2. Add the otherField name
 * 3. The rest is automatic - no other code changes needed
 */

// =============================================================================
// FIELD NAME CONSTANTS - Use these instead of string literals
// =============================================================================

/**
 * Field name constants for type-safe access to form data
 * Usage: formData[FIELDS.COMPANY_NAME] instead of formData.companyName or formData['companyName']
 */
export const FIELDS = {
  // Section 1: Formation & Purpose
  COMPANY_NAME: 'companyName',
  ENTITY_TYPE: 'entityType',
  ENTITY_TYPE_OTHER: 'entityTypeOther',
  REGISTERED_STATE: 'registeredState',
  MAILING_STREET: 'mailingStreet',
  MAILING_STREET2: 'mailingStreet2',
  MAILING_CITY: 'mailingCity',
  MAILING_STATE: 'mailingState',
  MAILING_ZIP: 'mailingZip',
  FULL_MAILING_ADDRESS: 'fullMailingAddress',
  COMPANY_DESCRIPTION: 'companyDescription',
  INDUSTRIES: 'industries',
  INDUSTRY_OTHER: 'industryOther',

  // Section 2: Cofounder Info
  COFOUNDER_COUNT: 'cofounderCount',
  COFOUNDERS: 'cofounders',

  // Section 3: Equity Allocation
  FINAL_EQUITY_PERCENTAGES: 'finalEquityPercentages',
  ACKNOWLEDGE_EQUITY_ALLOCATION: 'acknowledgeEquityAllocation',
  EQUITY_CALCULATOR_DRAFT: 'equityCalculatorDraft',
  EQUITY_CALCULATOR_SUBMITTED: 'equityCalculatorSubmitted',

  // Section 4: Decision-Making & Voting
  MAJOR_DECISIONS: 'majorDecisions',
  MAJOR_DECISIONS_OTHER: 'majorDecisionsOther',
  EQUITY_VOTING_POWER: 'equityVotingPower',
  TIE_RESOLUTION: 'tieResolution',
  ACKNOWLEDGE_TIE_RESOLUTION: 'acknowledgeTieResolution',
  INCLUDE_SHOTGUN_CLAUSE: 'includeShotgunClause',
  ACKNOWLEDGE_SHOTGUN_CLAUSE: 'acknowledgeShotgunClause',

  // Section 5: Equity & Vesting
  VESTING_START_DATE: 'vestingStartDate',
  VESTING_SCHEDULE: 'vestingSchedule',
  VESTING_SCHEDULE_OTHER: 'vestingScheduleOther',
  CLIFF_PERCENTAGE: 'cliffPercentage',
  ACCELERATION_TRIGGER: 'accelerationTrigger',
  SHARES_SELL_NOTICE_DAYS: 'sharesSellNoticeDays',
  SHARES_BUYBACK_DAYS: 'sharesBuybackDays',
  ACKNOWLEDGE_FORFEITURE: 'acknowledgeForfeiture',
  VESTED_SHARES_DISPOSAL: 'vestedSharesDisposal',

  // Section 6: IP & Ownership
  HAS_PRE_EXISTING_IP: 'hasPreExistingIP',
  ACKNOWLEDGE_IP_ASSIGNMENT: 'acknowledgeIPAssignment',
  ACKNOWLEDGE_IP_OWNERSHIP: 'acknowledgeIPOwnership',

  // Section 7: Compensation & Expenses
  TAKING_COMPENSATION: 'takingCompensation',
  COMPENSATIONS: 'compensations',
  SPENDING_LIMIT: 'spendingLimit',

  // Section 8: Performance
  PERFORMANCE_CONSEQUENCES: 'performanceConsequences',
  REMEDY_PERIOD_DAYS: 'remedyPeriodDays',
  TERMINATION_WITH_CAUSE: 'terminationWithCause',
  TERMINATION_WITH_CAUSE_OTHER: 'terminationWithCauseOther',
  VOLUNTARY_NOTICE_DAYS: 'voluntaryNoticeDays',

  // Section 9: Non-Competition
  ACKNOWLEDGE_CONFIDENTIALITY: 'acknowledgeConfidentiality',
  NON_COMPETE_DURATION: 'nonCompeteDuration',
  NON_COMPETE_DURATION_OTHER: 'nonCompeteDurationOther',
  NON_SOLICIT_DURATION: 'nonSolicitDuration',
  NON_SOLICIT_DURATION_OTHER: 'nonSolicitDurationOther',

  // Section 10: Final Details
  DISPUTE_RESOLUTION: 'disputeResolution',
  DISPUTE_RESOLUTION_OTHER: 'disputeResolutionOther',
  GOVERNING_LAW: 'governingLaw',
  AMENDMENT_PROCESS: 'amendmentProcess',
  AMENDMENT_PROCESS_OTHER: 'amendmentProcessOther',
  REVIEW_FREQUENCY_MONTHS: 'reviewFrequencyMonths',
  ACKNOWLEDGE_PERIODIC_REVIEW: 'acknowledgePeriodicReview',
  ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST: 'acknowledgeAmendmentReviewRequest',
  ACKNOWLEDGE_ENTIRE_AGREEMENT: 'acknowledgeEntireAgreement',
  ACKNOWLEDGE_SEVERABILITY: 'acknowledgeSeverability',

  // Nested fields (inside cofounders)
  COFOUNDER_FULL_NAME: 'fullName',
  COFOUNDER_TITLE: 'title',
  COFOUNDER_EMAIL: 'email',
  COFOUNDER_ROLES: 'roles',
  COFOUNDER_ROLES_OTHER: 'rolesOther',

  // Nested fields (inside compensations)
  COMPENSATION_USER_ID: 'userId',
  COMPENSATION_NAME: 'name',
  COMPENSATION_AMOUNT: 'amount',
  COMPENSATION_FREQUENCY: 'frequency',
};

// =============================================================================
// FIELD OPTIONS - All dropdown/radio/checkbox options defined here
// =============================================================================

export const US_STATES = [
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
  { value: 'WY', label: 'Wyoming' }
];

export const ENTITY_TYPES = ['C-Corp', 'S-Corp', 'LLC', 'Other'];

export const INDUSTRIES = [
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
  'Other'
];

export const ROLES = [
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
  'Other'
];

export const MAJOR_DECISIONS = [
  'Accepting advisors',
  'Accepting investors',
  'Equity allocations',
  'Hiring key personnel',
  'Major partnerships or contracts',
  'Product pivots',
  'Selling the company or merging',
  'None of the above',
  'Other'
];

export const TIE_RESOLUTION_OPTIONS = [
  'Consult agreed external advisor / board member',
  'Mediation with a neutral third party',
  'Final decision authority by domain'
];

export const VESTING_SCHEDULES = [
  '4 years with 1-year cliff',
  '3 years with 1-year cliff',
  'Immediate',
  'Other'
];

export const VESTED_SHARES_DISPOSAL_OPTIONS = [
  'The company has the option to repurchase vested shares at Fair Market Value',
  'The company must repurchase vested shares at Fair Market Value',
  'Vested shares transfer to the cofounder\'s estate or heirs, without voting or board rights'
];

export const PERFORMANCE_CONSEQUENCES = [
  'Formal warning and performance plan',
  'Temporary suspension of voting rights',
  'Reduction or dilution of unvested equity',
  'Role reassignment or demotion',
  'Termination'
];

export const TERMINATION_WITH_CAUSE_OPTIONS = [
  'Fraud, embezzlement, or theft',
  'Breach of fiduciary duty',
  'Willful misconduct or gross negligence',
  'Material breach of this agreement',
  'Criminal conviction',
  'Other'
];

export const NON_COMPETE_DURATIONS = [
  '6 months',
  '1 year',
  '2 years',
  'No non-competition clause',
  'Other'
];

export const NON_SOLICIT_DURATIONS = [
  '6 months',
  '1 year',
  '2 years',
  'No non-solicitation clause',
  'Other'
];

export const DISPUTE_RESOLUTION_OPTIONS = [
  'Mediation first, then arbitration if mediation fails',
  'Binding arbitration',
  'Litigation in courts',
  'Other'
];

export const AMENDMENT_PROCESS_OPTIONS = [
  'Unanimous written consent of all cofounders',
  'Majority vote of cofounders',
  'Other'
];

export const SECTIONS = [
  { id: 0, name: 'Welcome' },
  { id: 1, name: 'Formation & Purpose' },
  { id: 2, name: 'Cofounder Info' },
  { id: 3, name: 'Equity Allocation' },
  { id: 4, name: 'Vesting Schedule' },
  { id: 5, name: 'Decision-Making' },
  { id: 6, name: 'IP & Ownership' },
  { id: 7, name: 'Compensation' },
  { id: 8, name: 'Performance' },
  { id: 9, name: 'Non-Competition' },
  { id: 10, name: 'General Provisions' }
];

// =============================================================================
// SURVEY FIELDS SCHEMA
// =============================================================================

/**
 * Field schema definition
 * - default: Initial value for the field
 * - type: 'string' | 'array' | 'object'
 * - hasOther: true if this field has an "Other" option that needs custom input
 * - otherField: name of the field that stores the custom "Other" value
 * - options: (optional) reference to options array for dropdowns/radios/checkboxes
 */
export const SURVEY_FIELDS = {
  // Section 1: Formation & Purpose
  companyName: { default: '', type: 'string' },
  entityType: { default: '', type: 'string', hasOther: true, otherField: 'entityTypeOther', options: ENTITY_TYPES },
  entityTypeOther: { default: '', type: 'string' },
  registeredState: { default: '', type: 'string', options: US_STATES },
  mailingStreet: { default: '', type: 'string' },
  mailingStreet2: { default: '', type: 'string' },
  mailingCity: { default: '', type: 'string' },
  mailingState: { default: '', type: 'string' },
  mailingZip: { default: '', type: 'string' },
  fullMailingAddress: { default: '', type: 'string' },
  companyDescription: { default: '', type: 'string' },
  industries: { default: [], type: 'array', hasOther: true, otherField: 'industryOther', options: INDUSTRIES },
  industryOther: { default: '', type: 'string' },

  // Section 2: Cofounder Info
  cofounderCount: { default: '', type: 'string' },
  cofounders: { default: [], type: 'array' },

  // Section 3: Equity Allocation
  finalEquityPercentages: { default: {}, type: 'object' },
  acknowledgeEquityAllocation: { default: {}, type: 'object' },
  equityCalculatorDraft: { default: {}, type: 'object' },
  equityCalculatorSubmitted: { default: {}, type: 'object' },

  // Section 4: Decision-Making & Voting
  majorDecisions: { default: [], type: 'array', hasOther: true, otherField: 'majorDecisionsOther', options: MAJOR_DECISIONS },
  majorDecisionsOther: { default: '', type: 'string' },
  equityVotingPower: { default: '', type: 'string' },
  tieResolution: { default: '', type: 'string', options: TIE_RESOLUTION_OPTIONS },
  acknowledgeTieResolution: { default: {}, type: 'object' },
  includeShotgunClause: { default: '', type: 'string' },
  acknowledgeShotgunClause: { default: {}, type: 'object' },

  // Section 5: Equity & Vesting
  vestingStartDate: { default: '', type: 'string' },
  vestingSchedule: { default: '', type: 'string', hasOther: true, otherField: 'vestingScheduleOther', options: VESTING_SCHEDULES },
  vestingScheduleOther: { default: '', type: 'string' },
  cliffPercentage: { default: '', type: 'string' },
  accelerationTrigger: { default: '', type: 'string' },
  sharesSellNoticeDays: { default: '', type: 'string' },
  sharesBuybackDays: { default: '', type: 'string' },
  acknowledgeForfeiture: { default: {}, type: 'object' },
  vestedSharesDisposal: { default: '', type: 'string', options: VESTED_SHARES_DISPOSAL_OPTIONS },

  // Section 6: IP & Ownership
  hasPreExistingIP: { default: '', type: 'string' },
  acknowledgeIPAssignment: { default: {}, type: 'object' },
  acknowledgeIPOwnership: { default: {}, type: 'object' },

  // Section 7: Compensation & Expenses
  takingCompensation: { default: '', type: 'string' },
  compensations: { default: [], type: 'array' },
  spendingLimit: { default: '', type: 'string' },

  // Section 8: Performance
  performanceConsequences: { default: [], type: 'array', options: PERFORMANCE_CONSEQUENCES },
  remedyPeriodDays: { default: '', type: 'string' },
  terminationWithCause: { default: [], type: 'array', hasOther: true, otherField: 'terminationWithCauseOther', options: TERMINATION_WITH_CAUSE_OPTIONS },
  terminationWithCauseOther: { default: '', type: 'string' },
  voluntaryNoticeDays: { default: '', type: 'string' },

  // Section 9: Non-Competition
  acknowledgeConfidentiality: { default: {}, type: 'object' },
  nonCompeteDuration: { default: '', type: 'string', hasOther: true, otherField: 'nonCompeteDurationOther', options: NON_COMPETE_DURATIONS },
  nonCompeteDurationOther: { default: '', type: 'string' },
  nonSolicitDuration: { default: '', type: 'string', hasOther: true, otherField: 'nonSolicitDurationOther', options: NON_SOLICIT_DURATIONS },
  nonSolicitDurationOther: { default: '', type: 'string' },

  // Section 10: Final Details
  disputeResolution: { default: '', type: 'string', hasOther: true, otherField: 'disputeResolutionOther', options: DISPUTE_RESOLUTION_OPTIONS },
  disputeResolutionOther: { default: '', type: 'string' },
  governingLaw: { default: '', type: 'string', options: US_STATES },
  amendmentProcess: { default: '', type: 'string', hasOther: true, otherField: 'amendmentProcessOther', options: AMENDMENT_PROCESS_OPTIONS },
  amendmentProcessOther: { default: '', type: 'string' },
  reviewFrequencyMonths: { default: '', type: 'string' },
  acknowledgePeriodicReview: { default: {}, type: 'object' },
  acknowledgeAmendmentReviewRequest: { default: {}, type: 'object' },
  acknowledgeEntireAgreement: { default: {}, type: 'object' },
  acknowledgeSeverability: { default: {}, type: 'object' }
};

// =============================================================================
// AUTO-GENERATED EXPORTS
// =============================================================================

/**
 * Initial form data with all default values
 * Auto-generated from SURVEY_FIELDS
 */
export const INITIAL_FORM_DATA = Object.fromEntries(
  Object.entries(SURVEY_FIELDS).map(([key, config]) => [key, config.default])
);

/**
 * Configuration for fields with "Other" options
 * Used by useAutoSave.js and cloud functions for merging "Other" values
 * Auto-generated from SURVEY_FIELDS
 */
export const OTHER_FIELD_CONFIG = Object.entries(SURVEY_FIELDS)
  .filter(([_, config]) => config.hasOther)
  .map(([field, config]) => ({
    field,
    otherField: config.otherField,
    type: config.type
  }));

/**
 * List of all "Other" field names (e.g., entityTypeOther, industryOther)
 * Useful for cleaning up data before sending to external services
 */
export const OTHER_FIELD_NAMES = OTHER_FIELD_CONFIG.map(config => config.otherField);

/**
 * Merge "Other" fields into their parent fields
 * Used for PDF generation - keeps data clean in Firestore but merged for external use
 * @param {object} data - Survey data object
 * @returns {object} - Data with "Other" fields merged into parent fields
 */
export function mergeOtherFields(data) {
  if (!data) return {};

  const merged = { ...data };

  for (const { field, otherField, type } of OTHER_FIELD_CONFIG) {
    if (type === 'array' && merged[field]?.includes('Other') && merged[otherField]) {
      merged[field] = merged[field].map(item => item === 'Other' ? merged[otherField] : item);
    } else if (type === 'string' && merged[field] === 'Other' && merged[otherField]) {
      merged[field] = merged[otherField];
    }
    delete merged[otherField];
  }

  return merged;
}

/**
 * Survey schema: every field with its default value.
 * `INITIAL_FORM_DATA` is derived from it and is the client's starting form state.
 *
 * `hasOther`/`otherField`/`options` document each field; the "Other" merge itself is
 * driven by `OTHER_FIELD_CONFIG` (otherFields.ts) and the option lists by questionConfig.
 */
import type { SurveyData } from '../domain/surveyData.ts';
import {
  AMENDMENT_PROCESS_OPTIONS,
  DISPUTE_RESOLUTION_OPTIONS,
  ENTITY_TYPES,
  INDUSTRIES,
  MAJOR_DECISIONS,
  NON_COMPETE_DURATIONS,
  NON_SOLICIT_DURATIONS,
  PERFORMANCE_CONSEQUENCES,
  TERMINATION_WITH_CAUSE_OPTIONS,
  TIE_RESOLUTION_OPTIONS,
  US_STATES,
  VESTED_SHARES_DISPOSAL_OPTIONS,
  VESTING_SCHEDULES,
  type SelectOption,
} from './options.ts';

interface FieldConfig<T> {
  /** Initial value for the field */
  default: T;
  type: 'string' | 'array' | 'object';
  /** true if this field has an "Other" option that needs custom input */
  hasOther?: boolean;
  /** name of the field that stores the custom "Other" value */
  otherField?: string;
  /** reference to the options array for dropdowns/radios/checkboxes */
  options?: readonly string[] | readonly SelectOption[];
}

// Mapped over SurveyData so every field is present and every default matches its type.
const SURVEY_FIELDS: { [K in keyof SurveyData]: FieldConfig<SurveyData[K]> } = {
  // Section 1: Formation & Purpose
  companyName: { default: '', type: 'string' },
  entityType: {
    default: '',
    type: 'string',
    hasOther: true,
    otherField: 'entityTypeOther',
    options: ENTITY_TYPES,
  },
  entityTypeOther: { default: '', type: 'string' },
  registeredState: { default: '', type: 'string', options: US_STATES },
  mailingStreet: { default: '', type: 'string' },
  mailingStreet2: { default: '', type: 'string' },
  mailingCity: { default: '', type: 'string' },
  mailingState: { default: '', type: 'string' },
  mailingZip: { default: '', type: 'string' },
  companyDescription: { default: '', type: 'string' },
  industries: {
    default: [],
    type: 'array',
    hasOther: true,
    otherField: 'industryOther',
    options: INDUSTRIES,
  },
  industryOther: { default: '', type: 'string' },

  // Section 2: Cofounder Info
  cofounderCount: { default: '', type: 'string' },
  cofounders: { default: [], type: 'array' },

  // Section 3: Equity Allocation
  equityEntries: { default: [], type: 'array' },
  finalEquityPercentages: { default: {}, type: 'object' },
  acknowledgeEquityAllocation: { default: {}, type: 'object' },
  equityCalculatorDraft: { default: {}, type: 'object' },
  equityCalculatorSubmitted: { default: {}, type: 'object' },

  // Section 4: Decision-Making & Voting
  majorDecisions: {
    default: [],
    type: 'array',
    hasOther: true,
    otherField: 'majorDecisionsOther',
    options: MAJOR_DECISIONS,
  },
  majorDecisionsOther: { default: '', type: 'string' },
  equityVotingPower: { default: '', type: 'string' },
  tieResolution: { default: '', type: 'string', options: TIE_RESOLUTION_OPTIONS },
  acknowledgeTieResolution: { default: {}, type: 'object' },
  includeShotgunClause: { default: '', type: 'string' },
  acknowledgeShotgunClause: { default: {}, type: 'object' },

  // Section 5: Equity & Vesting
  vestingStartDate: { default: '', type: 'string' },
  vestingSchedule: {
    default: '',
    type: 'string',
    hasOther: true,
    otherField: 'vestingScheduleOther',
    options: VESTING_SCHEDULES,
  },
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
  terminationWithCause: {
    default: [],
    type: 'array',
    hasOther: true,
    otherField: 'terminationWithCauseOther',
    options: TERMINATION_WITH_CAUSE_OPTIONS,
  },
  terminationWithCauseOther: { default: '', type: 'string' },
  voluntaryNoticeDays: { default: '', type: 'string' },

  // Section 9: Non-Competition
  acknowledgeConfidentiality: { default: {}, type: 'object' },
  nonCompeteDuration: {
    default: '',
    type: 'string',
    hasOther: true,
    otherField: 'nonCompeteDurationOther',
    options: NON_COMPETE_DURATIONS,
  },
  nonCompeteDurationOther: { default: '', type: 'string' },
  nonSolicitDuration: {
    default: '',
    type: 'string',
    hasOther: true,
    otherField: 'nonSolicitDurationOther',
    options: NON_SOLICIT_DURATIONS,
  },
  nonSolicitDurationOther: { default: '', type: 'string' },

  // Section 10: Final Details
  disputeResolution: {
    default: '',
    type: 'string',
    hasOther: true,
    otherField: 'disputeResolutionOther',
    options: DISPUTE_RESOLUTION_OPTIONS,
  },
  disputeResolutionOther: { default: '', type: 'string' },
  governingLaw: { default: '', type: 'string', options: US_STATES },
  amendmentProcess: {
    default: '',
    type: 'string',
    hasOther: true,
    otherField: 'amendmentProcessOther',
    options: AMENDMENT_PROCESS_OPTIONS,
  },
  amendmentProcessOther: { default: '', type: 'string' },
  reviewFrequencyMonths: { default: '', type: 'string' },
  acknowledgePeriodicReview: { default: {}, type: 'object' },
  acknowledgeAmendmentReviewRequest: { default: {}, type: 'object' },
  acknowledgeEntireAgreement: { default: {}, type: 'object' },
  acknowledgeSeverability: { default: {}, type: 'object' },
};

/**
 * Initial form data with all default values, derived from SURVEY_FIELDS.
 * The default arrays/objects are shared by reference: spread it before mutating.
 */
export const INITIAL_FORM_DATA = Object.fromEntries(
  Object.entries(SURVEY_FIELDS).map(([key, config]) => [key, config.default]),
  // Object.fromEntries cannot carry the per-key types; each default is checked above.
) as unknown as SurveyData;

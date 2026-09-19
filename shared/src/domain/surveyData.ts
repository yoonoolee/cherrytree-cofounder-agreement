/**
 * The survey form as the client holds it in state and writes it to `projects/{id}.surveyData`.
 * Every key is present on the client (defaults come from `INITIAL_FORM_DATA`); a stored
 * document may hold any subset, so read it as `Partial<SurveyData>`.
 *
 * Interfaces are mutable on purpose: the server mutates `doc.data()` in place.
 */

/** One cofounder as entered in the "Cofounder Info" section. */
export interface Cofounder {
  id: string;
  fullName: string;
  title: string;
  email: string;
  roles: string[];
  rolesOther: string;
}

/** Equity split row. `percentage` is kept as the input string (`''` or e.g. `'25.0'`). */
export interface EquityEntry {
  name: string;
  percentage: string;
}

/** Compensation row. `amount` is kept as the input string without `$` or commas. */
export interface Compensation {
  who: string;
  amount: string;
}

/** Per-user acknowledgment state, keyed by Clerk user id. */
export type AcknowledgmentMap = Record<string, boolean>;

/** In-progress equity calculator answers: category importance and per-cofounder scores (keyed by index). */
export interface EquityCalculatorDraft {
  importance: Record<string, number>;
  scores: Record<string, Record<string, number>>;
}

export interface EquityCalculatorSubmission extends EquityCalculatorDraft {
  /** ISO 8601 */
  submittedAt: string;
}

export interface SurveyData {
  // Section 1: Formation & Purpose
  companyName: string;
  entityType: string;
  entityTypeOther: string;
  registeredState: string;
  mailingStreet: string;
  mailingStreet2: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  companyDescription: string;
  industries: string[];
  industryOther: string;

  // Section 2: Cofounder Info
  cofounderCount: string;
  cofounders: Cofounder[];

  // Section 3: Equity Allocation
  equityEntries: EquityEntry[];
  /** Declared in the schema but never written (see docs/REFACTOR_PLAN.md). */
  finalEquityPercentages: Record<string, number>;
  acknowledgeEquityAllocation: AcknowledgmentMap;
  equityCalculatorDraft: Record<string, EquityCalculatorDraft>;
  equityCalculatorSubmitted: Record<string, EquityCalculatorSubmission>;

  // Section 4: Decision-Making & Voting
  majorDecisions: string[];
  majorDecisionsOther: string;
  equityVotingPower: string;
  tieResolution: string;
  acknowledgeTieResolution: AcknowledgmentMap;
  includeShotgunClause: string;
  acknowledgeShotgunClause: AcknowledgmentMap;

  // Section 5: Equity & Vesting
  vestingStartDate: string;
  vestingSchedule: string;
  vestingScheduleOther: string;
  cliffPercentage: string;
  accelerationTrigger: string;
  /** Follow-up shown when `accelerationTrigger` is 'Yes'; not part of any completion rule. */
  accelerationProtectionMonths: string;
  sharesSellNoticeDays: string;
  sharesBuybackDays: string;
  acknowledgeForfeiture: AcknowledgmentMap;
  vestedSharesDisposal: string;

  // Section 6: IP & Ownership
  hasPreExistingIP: string;
  acknowledgeIPAssignment: AcknowledgmentMap;
  acknowledgeIPOwnership: AcknowledgmentMap;

  // Section 7: Compensation & Expenses
  takingCompensation: string;
  compensations: Compensation[];
  spendingLimit: string;

  // Section 8: Performance
  performanceConsequences: string[];
  remedyPeriodDays: string;
  terminationWithCause: string[];
  terminationWithCauseOther: string;
  voluntaryNoticeDays: string;

  // Section 9: Non-Competition
  acknowledgeConfidentiality: AcknowledgmentMap;
  nonCompeteDuration: string;
  nonCompeteDurationOther: string;
  nonSolicitDuration: string;
  nonSolicitDurationOther: string;

  // Section 10: Final Details
  disputeResolution: string;
  disputeResolutionOther: string;
  governingLaw: string;
  amendmentProcess: string;
  amendmentProcessOther: string;
  reviewFrequencyMonths: string;
  acknowledgePeriodicReview: AcknowledgmentMap;
  acknowledgeAmendmentReviewRequest: AcknowledgmentMap;
  acknowledgeEntireAgreement: AcknowledgmentMap;
  acknowledgeSeverability: AcknowledgmentMap;
}

export type SurveyFieldName = keyof SurveyData;

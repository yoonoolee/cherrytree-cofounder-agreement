import { INITIAL_FORM_DATA } from './schema.ts';

// Locks the exact field set the client writes to `projects/{id}.surveyData`.
const EXPECTED_DEFAULTS = {
  companyName: '',
  entityType: '',
  entityTypeOther: '',
  registeredState: '',
  mailingStreet: '',
  mailingStreet2: '',
  mailingCity: '',
  mailingState: '',
  mailingZip: '',
  companyDescription: '',
  industries: [],
  industryOther: '',
  cofounderCount: '',
  cofounders: [],
  equityEntries: [],
  finalEquityPercentages: {},
  acknowledgeEquityAllocation: {},
  equityCalculatorDraft: {},
  equityCalculatorSubmitted: {},
  majorDecisions: [],
  majorDecisionsOther: '',
  equityVotingPower: '',
  tieResolution: '',
  acknowledgeTieResolution: {},
  includeShotgunClause: '',
  acknowledgeShotgunClause: {},
  vestingStartDate: '',
  vestingSchedule: '',
  vestingScheduleOther: '',
  cliffPercentage: '',
  accelerationTrigger: '',
  sharesSellNoticeDays: '',
  sharesBuybackDays: '',
  acknowledgeForfeiture: {},
  vestedSharesDisposal: '',
  hasPreExistingIP: '',
  acknowledgeIPAssignment: {},
  acknowledgeIPOwnership: {},
  takingCompensation: '',
  compensations: [],
  spendingLimit: '',
  performanceConsequences: [],
  remedyPeriodDays: '',
  terminationWithCause: [],
  terminationWithCauseOther: '',
  voluntaryNoticeDays: '',
  acknowledgeConfidentiality: {},
  nonCompeteDuration: '',
  nonCompeteDurationOther: '',
  nonSolicitDuration: '',
  nonSolicitDurationOther: '',
  disputeResolution: '',
  disputeResolutionOther: '',
  governingLaw: '',
  amendmentProcess: '',
  amendmentProcessOther: '',
  reviewFrequencyMonths: '',
  acknowledgePeriodicReview: {},
  acknowledgeAmendmentReviewRequest: {},
  acknowledgeEntireAgreement: {},
  acknowledgeSeverability: {},
};

describe('INITIAL_FORM_DATA', () => {
  it('has exactly the expected keys, in schema order', () => {
    expect(Object.keys(INITIAL_FORM_DATA)).toEqual(Object.keys(EXPECTED_DEFAULTS));
  });

  it('has the expected default for every field', () => {
    expect(INITIAL_FORM_DATA).toEqual(EXPECTED_DEFAULTS);
  });
});

/**
 * Field name constants — use these instead of string literals.
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
  COMPANY_DESCRIPTION: 'companyDescription',
  INDUSTRIES: 'industries',
  INDUSTRY_OTHER: 'industryOther',

  // Section 2: Cofounder Info
  COFOUNDER_COUNT: 'cofounderCount',
  COFOUNDERS: 'cofounders',

  // Section 3: Equity Allocation
  EQUITY_ENTRIES: 'equityEntries',
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
  COFOUNDER_ID: 'id',
  COFOUNDER_FULL_NAME: 'fullName',
  COFOUNDER_TITLE: 'title',
  COFOUNDER_EMAIL: 'email',
  COFOUNDER_ROLES: 'roles',
  COFOUNDER_ROLES_OTHER: 'rolesOther',

  // Nested fields (inside compensations) — unused; rows are stored as `{ who, amount }`
  // (see docs/REFACTOR_PLAN.md)
  COMPENSATION_USER_ID: 'userId',
  COMPENSATION_NAME: 'name',
  COMPENSATION_AMOUNT: 'amount',
  COMPENSATION_FREQUENCY: 'frequency',

  // Nested fields (inside equityEntries)
  EQUITY_ENTRY_NAME: 'name',
  EQUITY_ENTRY_PERCENTAGE: 'percentage',
} as const;

/**
 * Collaborator field constants for accessing collaborator data
 * Usage: collaborator[COLLABORATOR_FIELDS.FIRST_NAME]
 */
export const COLLABORATOR_FIELDS = {
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  ROLE: 'role',
  IS_ACTIVE: 'isActive',
  HISTORY: 'history',
} as const;

/**
 * Per-user acknowledgment fields (`{ [userId]: boolean }` maps inside surveyData).
 */

/** Initialized on project creation and when a collaborator joins. */
export const REQUIRED_ACKNOWLEDGMENT_FIELDS: readonly string[] = [
  'acknowledgeEquityAllocation',
  'acknowledgeForfeiture',
  'acknowledgeIPOwnership',
  'acknowledgeConfidentiality',
  'acknowledgePeriodicReview',
  'acknowledgeAmendmentReviewRequest',
  'acknowledgeEntireAgreement',
  'acknowledgeSeverability',
];

/**
 * Created/deleted dynamically based on a parent question.
 * Only initialized for a joining collaborator if the map already exists in surveyData.
 */
export const CONDITIONAL_ACKNOWLEDGMENT_FIELDS: readonly string[] = [
  'acknowledgeTieResolution',
  'acknowledgeShotgunClause',
  'acknowledgeIPAssignment',
];

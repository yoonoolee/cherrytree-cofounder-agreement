import { FIELDS } from '../config/surveySchema';

/**
 * Standalone progress calculation utility
 * Can be used both in hooks and components
 */

/**
 * Helper to check if "Other" field is valid
 */
const isOtherFieldValid = (value, otherValue) => {
  if (value === 'Other') {
    return otherValue && otherValue.trim() !== '';
  }
  return !!value;
};

/**
 * Helper to check if array with "Other" is valid
 */
const isOtherArrayFieldValid = (array, otherValue) => {
  if (!array || array.length === 0) return false;
  if (array.includes('Other')) {
    return otherValue && otherValue.trim() !== '';
  }
  return true;
};

/**
 * Calculate progress for a project
 * @param {object} project - Project object with surveyData and collaborators
 * @returns {number} - Progress percentage (0-100)
 */
export const calculateProjectProgress = (project) => {
  const formData = project.surveyData || {};
  let totalRequired = 0;
  let completed = 0;

  // Get all collaborator userIds from the project
  const collaboratorIds = Object.keys(project?.collaborators || {});

  // Section 1: Formation & Purpose (9 fields)
  if (formData[FIELDS.COMPANY_NAME]) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData[FIELDS.ENTITY_TYPE], formData[FIELDS.ENTITY_TYPE_OTHER])) completed++;
  totalRequired++;
  if (formData[FIELDS.REGISTERED_STATE]) completed++;
  totalRequired++;
  if (formData[FIELDS.MAILING_STREET]) completed++;
  totalRequired++;
  if (formData[FIELDS.MAILING_CITY]) completed++;
  totalRequired++;
  if (formData[FIELDS.MAILING_STATE]) completed++;
  totalRequired++;
  if (formData[FIELDS.MAILING_ZIP]) completed++;
  totalRequired++;
  if (formData[FIELDS.COMPANY_DESCRIPTION]) completed++;
  totalRequired++;
  if (isOtherArrayFieldValid(formData[FIELDS.INDUSTRIES], formData[FIELDS.INDUSTRY_OTHER])) completed++;
  totalRequired++;

  // Section 2: Cofounder Info
  if (formData[FIELDS.COFOUNDER_COUNT]) completed++;
  totalRequired++;
  if (formData[FIELDS.COFOUNDERS] && formData[FIELDS.COFOUNDERS].length > 0) {
    const allCofoundersFilled = formData[FIELDS.COFOUNDERS].every(cf =>
      cf[FIELDS.COFOUNDER_FULL_NAME] && cf[FIELDS.COFOUNDER_TITLE] && cf[FIELDS.COFOUNDER_EMAIL] && cf[FIELDS.COFOUNDER_ROLES] && cf[FIELDS.COFOUNDER_ROLES].length > 0
    );
    if (allCofoundersFilled) completed++;
    totalRequired++;
  }

  // Section 3: Equity Allocation
  if (formData[FIELDS.FINAL_EQUITY_PERCENTAGES] && Object.keys(formData[FIELDS.FINAL_EQUITY_PERCENTAGES]).length > 0) {
    const allPercentagesFilled = collaboratorIds.every(userId =>
      formData[FIELDS.FINAL_EQUITY_PERCENTAGES][userId] && formData[FIELDS.FINAL_EQUITY_PERCENTAGES][userId] !== ''
    );
    if (allPercentagesFilled) completed++;
    totalRequired++;

    const totalEquity = collaboratorIds.reduce((sum, userId) =>
      sum + (parseFloat(formData[FIELDS.FINAL_EQUITY_PERCENTAGES][userId]) || 0), 0
    );
    if (Math.abs(totalEquity - 100) <= 0.01) completed++;
    totalRequired++;
  }
  const allAcknowledgedEquityAllocation = collaboratorIds.length > 0 &&
    collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION]?.[userId]);
  if (allAcknowledgedEquityAllocation) completed++;
  totalRequired++;

  // Section 4: Decision-Making (5 fields)
  if (isOtherArrayFieldValid(formData[FIELDS.MAJOR_DECISIONS], formData[FIELDS.MAJOR_DECISIONS_OTHER])) completed++;
  totalRequired++;
  if (formData[FIELDS.EQUITY_VOTING_POWER]) completed++;
  totalRequired++;
  if (formData[FIELDS.TIE_RESOLUTION]) completed++;
  totalRequired++;
  const allAcknowledgedTieResolution = collaboratorIds.length > 0 &&
    collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_TIE_RESOLUTION]?.[userId]);
  if (allAcknowledgedTieResolution) completed++;
  totalRequired++;
  if (formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE]) completed++;
  totalRequired++;
  if (formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === 'Yes') {
    const allAcknowledgedShotgunClause = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE]?.[userId]);
    if (allAcknowledgedShotgunClause) completed++;
    totalRequired++;
  }

  // Section 5: Equity & Vesting (8 fields)
  if (formData[FIELDS.VESTING_START_DATE]) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData[FIELDS.VESTING_SCHEDULE], formData[FIELDS.VESTING_SCHEDULE_OTHER])) completed++;
  totalRequired++;
  if (formData[FIELDS.CLIFF_PERCENTAGE]) completed++;
  totalRequired++;
  if (formData[FIELDS.ACCELERATION_TRIGGER]) completed++;
  totalRequired++;
  if (formData[FIELDS.SHARES_SELL_NOTICE_DAYS]) completed++;
  totalRequired++;
  if (formData[FIELDS.SHARES_BUYBACK_DAYS]) completed++;
  totalRequired++;
  const allAcknowledgedForfeiture = collaboratorIds.length > 0 &&
    collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_FORFEITURE]?.[userId]);
  if (allAcknowledgedForfeiture) completed++;
  totalRequired++;
  if (formData[FIELDS.VESTED_SHARES_DISPOSAL]) completed++;
  totalRequired++;

  // Section 6: IP & Ownership (2 fields)
  if (formData[FIELDS.HAS_PRE_EXISTING_IP]) completed++;
  totalRequired++;
  const allAcknowledgedIPOwnership = collaboratorIds.length > 0 &&
    collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_IP_OWNERSHIP]?.[userId]);
  if (allAcknowledgedIPOwnership) completed++;
  totalRequired++;

  // Section 7: Compensation (2 fields)
  if (formData[FIELDS.TAKING_COMPENSATION]) completed++;
  totalRequired++;
  if (formData[FIELDS.SPENDING_LIMIT]) completed++;
  totalRequired++;

  // Section 8: Performance (4 fields)
  if (formData[FIELDS.PERFORMANCE_CONSEQUENCES] && formData[FIELDS.PERFORMANCE_CONSEQUENCES].length > 0) completed++;
  totalRequired++;
  if (formData[FIELDS.REMEDY_PERIOD_DAYS]) completed++;
  totalRequired++;
  if (isOtherArrayFieldValid(formData[FIELDS.TERMINATION_WITH_CAUSE], formData[FIELDS.TERMINATION_WITH_CAUSE_OTHER])) completed++;
  totalRequired++;
  if (formData[FIELDS.VOLUNTARY_NOTICE_DAYS]) completed++;
  totalRequired++;

  // Section 9: Non-Competition (3 fields)
  const allAcknowledgedConfidentiality = collaboratorIds.length > 0 &&
    collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY]?.[userId]);
  if (allAcknowledgedConfidentiality) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData[FIELDS.NON_COMPETE_DURATION], formData[FIELDS.NON_COMPETE_DURATION_OTHER])) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData[FIELDS.NON_SOLICIT_DURATION], formData[FIELDS.NON_SOLICIT_DURATION_OTHER])) completed++;
  totalRequired++;

  // Section 10: Final Details (7 fields)
  if (isOtherFieldValid(formData[FIELDS.DISPUTE_RESOLUTION], formData[FIELDS.DISPUTE_RESOLUTION_OTHER])) completed++;
  totalRequired++;
  if (formData[FIELDS.GOVERNING_LAW]) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData[FIELDS.AMENDMENT_PROCESS], formData[FIELDS.AMENDMENT_PROCESS_OTHER])) completed++;
  totalRequired++;
  if (formData[FIELDS.REVIEW_FREQUENCY_MONTHS]) completed++;
  totalRequired++;
  const allAcknowledgedPeriodicReview = collaboratorIds.length > 0 &&
    collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW]?.[userId]);
  if (allAcknowledgedPeriodicReview) completed++;
  totalRequired++;
  const allAcknowledgedAmendmentReviewRequest = collaboratorIds.length > 0 &&
    collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST]?.[userId]);
  if (allAcknowledgedAmendmentReviewRequest) completed++;
  totalRequired++;
  const allAcknowledgedEntireAgreement = collaboratorIds.length > 0 &&
    collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT]?.[userId]);
  if (allAcknowledgedEntireAgreement) completed++;
  totalRequired++;
  const allAcknowledgedSeverability = collaboratorIds.length > 0 &&
    collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_SEVERABILITY]?.[userId]);
  if (allAcknowledgedSeverability) completed++;
  totalRequired++;

  return totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0;
};

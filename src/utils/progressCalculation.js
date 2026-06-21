import { FIELDS, COLLABORATOR_FIELDS } from '../config/surveySchema';
import { SECTION_IDS, SECTION_ORDER } from '../config/sectionConfig';

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

  // Get active collaborator userIds from the project
  const collaboratorIds = Object.entries(project?.collaborators || {})
    .filter(([_, data]) => data[COLLABORATOR_FIELDS.IS_ACTIVE] !== false)
    .map(([userId]) => userId);

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
  const equityEntries = formData[FIELDS.EQUITY_ENTRIES] || [];
  if (equityEntries.length > 0) {
    const allEntriesFilled = equityEntries.every(entry =>
      entry[FIELDS.EQUITY_ENTRY_NAME] && entry[FIELDS.EQUITY_ENTRY_PERCENTAGE] && entry[FIELDS.EQUITY_ENTRY_PERCENTAGE] !== ''
    );
    if (allEntriesFilled) completed++;
    totalRequired++;

    const totalEquity = equityEntries.reduce((sum, entry) =>
      sum + (parseFloat(entry[FIELDS.EQUITY_ENTRY_PERCENTAGE]) || 0), 0
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

/**
 * Count how many of the 10 sections are fully completed.
 * Mirrors isSectionCompleted from useValidation as a standalone utility.
 */
export const countCompletedSections = (project) => {
  const formData = project?.surveyData || {};
  const collaboratorIds = Object.entries(project?.collaborators || {})
    .filter(([_, data]) => data[COLLABORATOR_FIELDS.IS_ACTIVE] !== false)
    .map(([userId]) => userId);

  const isSectionDone = (sectionId) => {
    switch (sectionId) {
      case SECTION_IDS.FORMATION:
        return !!(formData[FIELDS.COMPANY_NAME] &&
          isOtherFieldValid(formData[FIELDS.ENTITY_TYPE], formData[FIELDS.ENTITY_TYPE_OTHER]) &&
          formData[FIELDS.REGISTERED_STATE] &&
          formData[FIELDS.MAILING_STREET] && formData[FIELDS.MAILING_CITY] &&
          formData[FIELDS.MAILING_STATE] && formData[FIELDS.MAILING_ZIP] &&
          formData[FIELDS.COMPANY_DESCRIPTION] &&
          isOtherArrayFieldValid(formData[FIELDS.INDUSTRIES], formData[FIELDS.INDUSTRY_OTHER]));

      case SECTION_IDS.COFOUNDERS:
        if (!formData[FIELDS.COFOUNDER_COUNT]) return false;
        if ((formData[FIELDS.COFOUNDERS] || []).length > collaboratorIds.length) return false;
        if (formData[FIELDS.COFOUNDERS]?.length > 0) {
          return formData[FIELDS.COFOUNDERS].every(cf =>
            cf[FIELDS.COFOUNDER_FULL_NAME] && cf[FIELDS.COFOUNDER_TITLE] &&
            cf[FIELDS.COFOUNDER_EMAIL] && cf[FIELDS.COFOUNDER_ROLES]?.length > 0
          );
        }
        return true;

      case SECTION_IDS.EQUITY_ALLOCATION: {
        const entries = formData[FIELDS.EQUITY_ENTRIES] || [];
        if (!entries.length) return false;
        if (!entries.every(e => e[FIELDS.EQUITY_ENTRY_NAME] && e[FIELDS.EQUITY_ENTRY_PERCENTAGE] !== '')) return false;
        const total = entries.reduce((s, e) => s + (parseFloat(e[FIELDS.EQUITY_ENTRY_PERCENTAGE]) || 0), 0);
        if (Math.abs(total - 100) > 0.01) return false;
        return collaboratorIds.length > 0 && collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION]?.[id]);
      }

      case SECTION_IDS.VESTING:
        return !!(formData[FIELDS.VESTING_START_DATE] &&
          isOtherFieldValid(formData[FIELDS.VESTING_SCHEDULE], formData[FIELDS.VESTING_SCHEDULE_OTHER]) &&
          formData[FIELDS.CLIFF_PERCENTAGE] && formData[FIELDS.ACCELERATION_TRIGGER] &&
          formData[FIELDS.SHARES_SELL_NOTICE_DAYS] && formData[FIELDS.SHARES_BUYBACK_DAYS] &&
          collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_FORFEITURE]?.[id]) &&
          formData[FIELDS.VESTED_SHARES_DISPOSAL]);

      case SECTION_IDS.DECISION_MAKING: {
        const shotgunOk = formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === 'Yes'
          ? collaboratorIds.length > 0 && collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE]?.[id])
          : true;
        return !!(isOtherArrayFieldValid(formData[FIELDS.MAJOR_DECISIONS], formData[FIELDS.MAJOR_DECISIONS_OTHER]) &&
          formData[FIELDS.EQUITY_VOTING_POWER] && formData[FIELDS.TIE_RESOLUTION] &&
          collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_TIE_RESOLUTION]?.[id]) &&
          formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] && shotgunOk);
      }

      case SECTION_IDS.IP:
        return !!(formData[FIELDS.HAS_PRE_EXISTING_IP] &&
          collaboratorIds.length > 0 && collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_IP_OWNERSHIP]?.[id]));

      case SECTION_IDS.COMPENSATION:
        return !!(formData[FIELDS.TAKING_COMPENSATION] && formData[FIELDS.SPENDING_LIMIT]);

      case SECTION_IDS.PERFORMANCE:
        return !!(formData[FIELDS.PERFORMANCE_CONSEQUENCES]?.length > 0 &&
          formData[FIELDS.REMEDY_PERIOD_DAYS] &&
          isOtherArrayFieldValid(formData[FIELDS.TERMINATION_WITH_CAUSE], formData[FIELDS.TERMINATION_WITH_CAUSE_OTHER]) &&
          formData[FIELDS.VOLUNTARY_NOTICE_DAYS]);

      case SECTION_IDS.NON_COMPETITION:
        return !!(collaboratorIds.length > 0 && collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY]?.[id]) &&
          isOtherFieldValid(formData[FIELDS.NON_COMPETE_DURATION], formData[FIELDS.NON_COMPETE_DURATION_OTHER]) &&
          isOtherFieldValid(formData[FIELDS.NON_SOLICIT_DURATION], formData[FIELDS.NON_SOLICIT_DURATION_OTHER]));

      case SECTION_IDS.GENERAL_PROVISIONS:
        return !!(isOtherFieldValid(formData[FIELDS.DISPUTE_RESOLUTION], formData[FIELDS.DISPUTE_RESOLUTION_OTHER]) &&
          formData[FIELDS.GOVERNING_LAW] &&
          isOtherFieldValid(formData[FIELDS.AMENDMENT_PROCESS], formData[FIELDS.AMENDMENT_PROCESS_OTHER]) &&
          formData[FIELDS.REVIEW_FREQUENCY_MONTHS] &&
          collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW]?.[id]) &&
          collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST]?.[id]) &&
          collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT]?.[id]) &&
          collaboratorIds.every(id => formData[FIELDS.ACKNOWLEDGE_SEVERABILITY]?.[id]));

      default:
        return false;
    }
  };

  return SECTION_ORDER.filter(isSectionDone).length;
};

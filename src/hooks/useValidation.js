import { FIELDS } from '../config/surveySchema';

/**
 * Custom hook for survey validation logic
 * Handles progress calculation and section completion checking
 *
 * @param {object} formData - Current form data
 * @param {object} project - Current project
 * @returns {object} - { calculateProgress, isSectionCompleted, isOtherFieldValid, isOtherArrayFieldValid }
 */
export function useValidation(formData, project) {

  /**
   * Helper function to check if a field with "Other" option is properly filled
   */
  const isOtherFieldValid = (value, otherValue) => {
    if (value === 'Other') {
      return otherValue && otherValue.trim() !== '';
    }
    return !!value;
  };

  /**
   * Helper function to check if an array field with "Other" option is properly filled
   */
  const isOtherArrayFieldValid = (array, otherValue) => {
    if (!array || array.length === 0) return false;
    if (array.includes('Other')) {
      return otherValue && otherValue.trim() !== '';
    }
    return true;
  };

  /**
   * Calculate progress across all sections
   * Returns percentage (0-100) of completed required fields
   */
  const calculateProgress = () => {
    let totalRequired = 0;
    let completed = 0;

    // Get all collaborator userIds from the project
    const collaboratorIds = Object.keys(project?.collaborators || {});

    // Section 1: Formation & Purpose
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
    // Check if all cofounders have required fields
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

    // Section 4: Decision-Making
    if (isOtherArrayFieldValid(formData[FIELDS.MAJOR_DECISIONS], formData[FIELDS.MAJOR_DECISIONS_OTHER])) completed++;
    totalRequired++;
    if (formData[FIELDS.EQUITY_VOTING_POWER]) completed++;
    totalRequired++;
    if (formData[FIELDS.TIE_RESOLUTION]) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged tie resolution
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

    // Section 5: Equity & Vesting
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
    // Check if all collaborators have acknowledged forfeiture
    const allAcknowledgedForfeiture = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_FORFEITURE]?.[userId]);
    if (allAcknowledgedForfeiture) completed++;
    totalRequired++;
    if (formData[FIELDS.VESTED_SHARES_DISPOSAL]) completed++;
    totalRequired++;

    // Section 6: IP & Ownership
    if (formData[FIELDS.HAS_PRE_EXISTING_IP]) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged IP ownership
    const allAcknowledgedIPOwnership = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_IP_OWNERSHIP]?.[userId]);
    if (allAcknowledgedIPOwnership) completed++;
    totalRequired++;

    // Section 7: Compensation
    if (formData[FIELDS.TAKING_COMPENSATION]) completed++;
    totalRequired++;
    if (formData[FIELDS.SPENDING_LIMIT]) completed++;
    totalRequired++;

    // Section 8: Performance (Cofounder Performance & Departure)
    if (formData[FIELDS.PERFORMANCE_CONSEQUENCES] && formData[FIELDS.PERFORMANCE_CONSEQUENCES].length > 0) completed++;
    totalRequired++;
    if (formData[FIELDS.REMEDY_PERIOD_DAYS]) completed++;
    totalRequired++;
    if (isOtherArrayFieldValid(formData[FIELDS.TERMINATION_WITH_CAUSE], formData[FIELDS.TERMINATION_WITH_CAUSE_OTHER])) completed++;
    totalRequired++;
    if (formData[FIELDS.VOLUNTARY_NOTICE_DAYS]) completed++;
    totalRequired++;

    // Section 9: Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
    // Check if all collaborators have acknowledged confidentiality
    const allAcknowledgedConfidentiality = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY]?.[userId]);
    if (allAcknowledgedConfidentiality) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData[FIELDS.NON_COMPETE_DURATION], formData[FIELDS.NON_COMPETE_DURATION_OTHER])) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData[FIELDS.NON_SOLICIT_DURATION], formData[FIELDS.NON_SOLICIT_DURATION_OTHER])) completed++;
    totalRequired++;

    // Section 10: Final Details
    if (isOtherFieldValid(formData[FIELDS.DISPUTE_RESOLUTION], formData[FIELDS.DISPUTE_RESOLUTION_OTHER])) completed++;
    totalRequired++;
    if (formData[FIELDS.GOVERNING_LAW]) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData[FIELDS.AMENDMENT_PROCESS], formData[FIELDS.AMENDMENT_PROCESS_OTHER])) completed++;
    totalRequired++;
    if (formData[FIELDS.REVIEW_FREQUENCY_MONTHS]) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged periodic review
    const allAcknowledgedPeriodicReview = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW]?.[userId]);
    if (allAcknowledgedPeriodicReview) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged amendment review request
    const allAcknowledgedAmendmentReviewRequest = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST]?.[userId]);
    if (allAcknowledgedAmendmentReviewRequest) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged entire agreement
    const allAcknowledgedEntireAgreement = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT]?.[userId]);
    if (allAcknowledgedEntireAgreement) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged severability
    const allAcknowledgedSeverability = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_SEVERABILITY]?.[userId]);
    if (allAcknowledgedSeverability) completed++;
    totalRequired++;

    return Math.round((completed / totalRequired) * 100);
  };

  /**
   * Check if a specific section is completed
   * @param {number} sectionId - The section number (1-10)
   * @returns {boolean} - Whether the section is complete
   */
  const isSectionCompleted = (sectionId) => {
    // Get all collaborator userIds from the project
    const collaboratorIds = Object.keys(project?.collaborators || {});

    switch(sectionId) {
      case 1: // Formation & Purpose
        return formData[FIELDS.COMPANY_NAME] &&
               isOtherFieldValid(formData[FIELDS.ENTITY_TYPE], formData[FIELDS.ENTITY_TYPE_OTHER]) &&
               formData[FIELDS.REGISTERED_STATE] &&
               formData[FIELDS.MAILING_STREET] && formData[FIELDS.MAILING_CITY] && formData[FIELDS.MAILING_STATE] &&
               formData[FIELDS.MAILING_ZIP] && formData[FIELDS.COMPANY_DESCRIPTION] &&
               isOtherArrayFieldValid(formData[FIELDS.INDUSTRIES], formData[FIELDS.INDUSTRY_OTHER]);

      case 2: // Cofounder Info
        if (!formData[FIELDS.COFOUNDER_COUNT]) return false;
        if (formData[FIELDS.COFOUNDERS] && formData[FIELDS.COFOUNDERS].length > 0) {
          // Check that all cofounders have all required fields filled
          const allCofoundersFilled = formData[FIELDS.COFOUNDERS].every(cf =>
            cf[FIELDS.COFOUNDER_FULL_NAME] && cf[FIELDS.COFOUNDER_TITLE] && cf[FIELDS.COFOUNDER_EMAIL] &&
            cf[FIELDS.COFOUNDER_ROLES] && cf[FIELDS.COFOUNDER_ROLES].length > 0
          );
          return allCofoundersFilled;
        }
        return true;

      case 3: // Equity Allocation
        // Check that all equity percentages are filled
        const allPercentagesFilled = collaboratorIds.every(userId =>
          formData[FIELDS.FINAL_EQUITY_PERCENTAGES]?.[userId] && formData[FIELDS.FINAL_EQUITY_PERCENTAGES][userId] !== ''
        );
        if (!allPercentagesFilled) return false;

        // Check that total equity equals 100%
        const totalEquity = collaboratorIds.reduce((sum, userId) =>
          sum + (parseFloat(formData[FIELDS.FINAL_EQUITY_PERCENTAGES]?.[userId]) || 0), 0
        );
        if (Math.abs(totalEquity - 100) > 0.01) return false;

        // Check that all collaborators have acknowledged
        const allAcknowledgedEquityAllocation = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION]?.[userId]);
        return allAcknowledgedEquityAllocation;

      case 4: // Vesting Schedule
        const allAcknowledgedForfeiture = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_FORFEITURE]?.[userId]);
        return formData[FIELDS.VESTING_START_DATE] &&
               isOtherFieldValid(formData[FIELDS.VESTING_SCHEDULE], formData[FIELDS.VESTING_SCHEDULE_OTHER]) &&
               formData[FIELDS.CLIFF_PERCENTAGE] && formData[FIELDS.ACCELERATION_TRIGGER] &&
               formData[FIELDS.SHARES_SELL_NOTICE_DAYS] && formData[FIELDS.SHARES_BUYBACK_DAYS] &&
               allAcknowledgedForfeiture && formData[FIELDS.VESTED_SHARES_DISPOSAL];

      case 5: // Decision-Making
        const allAcknowledgedTieResolution = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_TIE_RESOLUTION]?.[userId]);
        const allAcknowledgedShotgunClause = formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === 'Yes' ? (
          collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE]?.[userId])
        ) : true;
        return isOtherArrayFieldValid(formData[FIELDS.MAJOR_DECISIONS], formData[FIELDS.MAJOR_DECISIONS_OTHER]) &&
               formData[FIELDS.EQUITY_VOTING_POWER] &&
               formData[FIELDS.TIE_RESOLUTION] &&
               allAcknowledgedTieResolution &&
               formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] && allAcknowledgedShotgunClause;

      case 6: // IP & Ownership
        const allAcknowledgedIPOwnership = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_IP_OWNERSHIP]?.[userId]);
        return formData[FIELDS.HAS_PRE_EXISTING_IP] && allAcknowledgedIPOwnership;

      case 7: // Compensation
        return formData[FIELDS.TAKING_COMPENSATION] && formData[FIELDS.SPENDING_LIMIT];

      case 8: // Performance (Cofounder Performance & Departure)
        return formData[FIELDS.PERFORMANCE_CONSEQUENCES] && formData[FIELDS.PERFORMANCE_CONSEQUENCES].length > 0 &&
               formData[FIELDS.REMEDY_PERIOD_DAYS] &&
               isOtherArrayFieldValid(formData[FIELDS.TERMINATION_WITH_CAUSE], formData[FIELDS.TERMINATION_WITH_CAUSE_OTHER]) &&
               formData[FIELDS.VOLUNTARY_NOTICE_DAYS];

      case 9: // Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
        const allAcknowledgedConfidentiality = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY]?.[userId]);
        return allAcknowledgedConfidentiality &&
               isOtherFieldValid(formData[FIELDS.NON_COMPETE_DURATION], formData[FIELDS.NON_COMPETE_DURATION_OTHER]) &&
               isOtherFieldValid(formData[FIELDS.NON_SOLICIT_DURATION], formData[FIELDS.NON_SOLICIT_DURATION_OTHER]);

      case 10: // Final Details
        const allAcknowledgedPeriodicReview = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW]?.[userId]);
        const allAcknowledgedAmendmentReviewRequest = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST]?.[userId]);
        const allAcknowledgedEntireAgreement = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT]?.[userId]);
        const allAcknowledgedSeverability = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_SEVERABILITY]?.[userId]);
        return isOtherFieldValid(formData[FIELDS.DISPUTE_RESOLUTION], formData[FIELDS.DISPUTE_RESOLUTION_OTHER]) &&
               formData[FIELDS.GOVERNING_LAW] &&
               isOtherFieldValid(formData[FIELDS.AMENDMENT_PROCESS], formData[FIELDS.AMENDMENT_PROCESS_OTHER]) &&
               formData[FIELDS.REVIEW_FREQUENCY_MONTHS] &&
               allAcknowledgedPeriodicReview && allAcknowledgedAmendmentReviewRequest &&
               allAcknowledgedEntireAgreement && allAcknowledgedSeverability;

      default:
        return false;
    }
  };

  return {
    calculateProgress,
    isSectionCompleted,
    isOtherFieldValid,
    isOtherArrayFieldValid
  };
}

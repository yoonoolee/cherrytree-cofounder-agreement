import {
  FIELDS,
  COLLABORATOR_FIELDS,
  SECTION_IDS,
  type Project,
  type SurveyData,
} from '@cherrytree/shared';

import {
  calculateProjectProgress,
  isOtherArrayFieldValid,
  isOtherFieldValid,
} from '../utils/progressCalculation.ts';

/**
 * Custom hook for survey validation logic
 * Handles progress calculation and section completion checking
 *
 * @param formData - Current form data
 * @param project - Current project
 */
export function useValidation(
  formData: Partial<SurveyData>,
  project: Pick<Project, 'collaborators'> | null | undefined,
) {
  /**
   * Calculate progress across all sections
   * Returns percentage (0-100) of completed required fields
   */
  const calculateProgress = (): number => {
    return calculateProjectProgress({
      surveyData: formData,
      collaborators: project?.collaborators,
    });
  };

  /**
   * Check if a specific section is completed
   * @param sectionId - The section id (SECTION_IDS)
   * @returns Whether the section is complete
   */
  const isSectionCompleted = (sectionId: string): boolean => {
    // Get active collaborator userIds from the project
    const collaboratorIds = Object.entries(project?.collaborators || {})
      .filter(([_, data]) => data[COLLABORATOR_FIELDS.IS_ACTIVE] !== false)
      .map(([userId]) => userId);

    switch (sectionId) {
      case SECTION_IDS.FORMATION: // Formation & Purpose
        return !!(
          formData[FIELDS.COMPANY_NAME] &&
          isOtherFieldValid(formData[FIELDS.ENTITY_TYPE], formData[FIELDS.ENTITY_TYPE_OTHER]) &&
          formData[FIELDS.REGISTERED_STATE] &&
          formData[FIELDS.MAILING_STREET] &&
          formData[FIELDS.MAILING_CITY] &&
          formData[FIELDS.MAILING_STATE] &&
          formData[FIELDS.MAILING_ZIP] &&
          formData[FIELDS.COMPANY_DESCRIPTION] &&
          isOtherArrayFieldValid(formData[FIELDS.INDUSTRIES], formData[FIELDS.INDUSTRY_OTHER])
        );

      case SECTION_IDS.COFOUNDERS: {
        // Cofounder Info
        const cofounders = formData[FIELDS.COFOUNDERS] || [];
        if (!formData[FIELDS.COFOUNDER_COUNT]) return false;
        // Block if more cofounders than collaborators (collaborator was removed from project)
        if (cofounders.length > collaboratorIds.length) return false;
        if (cofounders.length > 0) {
          // Check that all cofounders have all required fields filled
          const allCofoundersFilled = cofounders.every(
            (cf) =>
              cf[FIELDS.COFOUNDER_FULL_NAME] &&
              cf[FIELDS.COFOUNDER_TITLE] &&
              cf[FIELDS.COFOUNDER_EMAIL] &&
              cf[FIELDS.COFOUNDER_ROLES] &&
              cf[FIELDS.COFOUNDER_ROLES].length > 0,
          );
          return allCofoundersFilled;
        }
        return true;
      }

      case SECTION_IDS.EQUITY_ALLOCATION: {
        // Equity Allocation
        // Check that equity entries exist and all are filled
        const equityEntries = formData[FIELDS.EQUITY_ENTRIES] || [];
        if (equityEntries.length === 0) return false;
        const allEntriesFilled = equityEntries.every(
          (entry) =>
            entry[FIELDS.EQUITY_ENTRY_NAME] &&
            entry[FIELDS.EQUITY_ENTRY_PERCENTAGE] &&
            entry[FIELDS.EQUITY_ENTRY_PERCENTAGE] !== '',
        );
        if (!allEntriesFilled) return false;

        // Check that total equity equals 100%
        const totalEquity = equityEntries.reduce(
          (sum, entry) => sum + (parseFloat(entry[FIELDS.EQUITY_ENTRY_PERCENTAGE]) || 0),
          0,
        );
        if (Math.abs(totalEquity - 100) > 0.01) return false;

        // Check that all collaborators have acknowledged
        const allAcknowledgedEquityAllocation =
          collaboratorIds.length > 0 &&
          collaboratorIds.every(
            (userId) => formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION]?.[userId],
          );
        return allAcknowledgedEquityAllocation;
      }

      case SECTION_IDS.VESTING: {
        // Vesting Schedule
        const allAcknowledgedForfeiture =
          collaboratorIds.length > 0 &&
          collaboratorIds.every((userId) => formData[FIELDS.ACKNOWLEDGE_FORFEITURE]?.[userId]);
        return !!(
          formData[FIELDS.VESTING_START_DATE] &&
          isOtherFieldValid(
            formData[FIELDS.VESTING_SCHEDULE],
            formData[FIELDS.VESTING_SCHEDULE_OTHER],
          ) &&
          formData[FIELDS.CLIFF_PERCENTAGE] &&
          formData[FIELDS.ACCELERATION_TRIGGER] &&
          formData[FIELDS.SHARES_SELL_NOTICE_DAYS] &&
          formData[FIELDS.SHARES_BUYBACK_DAYS] &&
          allAcknowledgedForfeiture &&
          formData[FIELDS.VESTED_SHARES_DISPOSAL]
        );
      }

      case SECTION_IDS.DECISION_MAKING: {
        // Decision-Making
        const allAcknowledgedTieResolution =
          collaboratorIds.length > 0 &&
          collaboratorIds.every((userId) => formData[FIELDS.ACKNOWLEDGE_TIE_RESOLUTION]?.[userId]);
        const allAcknowledgedShotgunClause =
          formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === 'Yes'
            ? collaboratorIds.length > 0 &&
              collaboratorIds.every(
                (userId) => formData[FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE]?.[userId],
              )
            : true;
        return !!(
          isOtherArrayFieldValid(
            formData[FIELDS.MAJOR_DECISIONS],
            formData[FIELDS.MAJOR_DECISIONS_OTHER],
          ) &&
          formData[FIELDS.EQUITY_VOTING_POWER] &&
          formData[FIELDS.TIE_RESOLUTION] &&
          allAcknowledgedTieResolution &&
          formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] &&
          allAcknowledgedShotgunClause
        );
      }

      case SECTION_IDS.IP: {
        // IP & Ownership
        const allAcknowledgedIPOwnership =
          collaboratorIds.length > 0 &&
          collaboratorIds.every((userId) => formData[FIELDS.ACKNOWLEDGE_IP_OWNERSHIP]?.[userId]);
        return !!(formData[FIELDS.HAS_PRE_EXISTING_IP] && allAcknowledgedIPOwnership);
      }

      case SECTION_IDS.COMPENSATION: // Compensation
        return !!(formData[FIELDS.TAKING_COMPENSATION] && formData[FIELDS.SPENDING_LIMIT]);

      case SECTION_IDS.PERFORMANCE: {
        // Performance (Cofounder Performance & Departure)
        const performanceConsequences = formData[FIELDS.PERFORMANCE_CONSEQUENCES];
        return !!(
          performanceConsequences &&
          performanceConsequences.length > 0 &&
          formData[FIELDS.REMEDY_PERIOD_DAYS] &&
          isOtherArrayFieldValid(
            formData[FIELDS.TERMINATION_WITH_CAUSE],
            formData[FIELDS.TERMINATION_WITH_CAUSE_OTHER],
          ) &&
          formData[FIELDS.VOLUNTARY_NOTICE_DAYS]
        );
      }

      case SECTION_IDS.NON_COMPETITION: {
        // Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
        const allAcknowledgedConfidentiality =
          collaboratorIds.length > 0 &&
          collaboratorIds.every((userId) => formData[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY]?.[userId]);
        return !!(
          allAcknowledgedConfidentiality &&
          isOtherFieldValid(
            formData[FIELDS.NON_COMPETE_DURATION],
            formData[FIELDS.NON_COMPETE_DURATION_OTHER],
          ) &&
          isOtherFieldValid(
            formData[FIELDS.NON_SOLICIT_DURATION],
            formData[FIELDS.NON_SOLICIT_DURATION_OTHER],
          )
        );
      }

      case SECTION_IDS.GENERAL_PROVISIONS: {
        // Final Details
        const allAcknowledgedPeriodicReview =
          collaboratorIds.length > 0 &&
          collaboratorIds.every((userId) => formData[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW]?.[userId]);
        const allAcknowledgedAmendmentReviewRequest =
          collaboratorIds.length > 0 &&
          collaboratorIds.every(
            (userId) => formData[FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST]?.[userId],
          );
        const allAcknowledgedEntireAgreement =
          collaboratorIds.length > 0 &&
          collaboratorIds.every(
            (userId) => formData[FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT]?.[userId],
          );
        const allAcknowledgedSeverability =
          collaboratorIds.length > 0 &&
          collaboratorIds.every((userId) => formData[FIELDS.ACKNOWLEDGE_SEVERABILITY]?.[userId]);
        return !!(
          isOtherFieldValid(
            formData[FIELDS.DISPUTE_RESOLUTION],
            formData[FIELDS.DISPUTE_RESOLUTION_OTHER],
          ) &&
          formData[FIELDS.GOVERNING_LAW] &&
          isOtherFieldValid(
            formData[FIELDS.AMENDMENT_PROCESS],
            formData[FIELDS.AMENDMENT_PROCESS_OTHER],
          ) &&
          formData[FIELDS.REVIEW_FREQUENCY_MONTHS] &&
          allAcknowledgedPeriodicReview &&
          allAcknowledgedAmendmentReviewRequest &&
          allAcknowledgedEntireAgreement &&
          allAcknowledgedSeverability
        );
      }

      default:
        return false;
    }
  };

  return {
    calculateProgress,
    isSectionCompleted,
    isOtherFieldValid,
    isOtherArrayFieldValid,
  };
}

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
    if (formData.companyName) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.entityType, formData.entityTypeOther)) completed++;
    totalRequired++;
    if (formData.registeredState) completed++;
    totalRequired++;
    if (formData.mailingStreet) completed++;
    totalRequired++;
    if (formData.mailingCity) completed++;
    totalRequired++;
    if (formData.mailingState) completed++;
    totalRequired++;
    if (formData.mailingZip) completed++;
    totalRequired++;
    if (formData.companyDescription) completed++;
    totalRequired++;
    if (isOtherArrayFieldValid(formData.industries, formData.industryOther)) completed++;
    totalRequired++;

    // Section 2: Cofounder Info
    if (formData.cofounderCount) completed++;
    totalRequired++;
    // Check if all cofounders have required fields
    if (formData.cofounders && formData.cofounders.length > 0) {
      const allCofoundersFilled = formData.cofounders.every(cf =>
        cf.fullName && cf.title && cf.email && cf.roles && cf.roles.length > 0
      );
      if (allCofoundersFilled) completed++;
      totalRequired++;
    }

    // Section 3: Equity Allocation
    if (formData.finalEquityPercentages && Object.keys(formData.finalEquityPercentages).length > 0) {
      const allPercentagesFilled = collaboratorIds.every(userId =>
        formData.finalEquityPercentages[userId] && formData.finalEquityPercentages[userId] !== ''
      );
      if (allPercentagesFilled) completed++;
      totalRequired++;

      const totalEquity = collaboratorIds.reduce((sum, userId) =>
        sum + (parseFloat(formData.finalEquityPercentages[userId]) || 0), 0
      );
      if (Math.abs(totalEquity - 100) <= 0.01) completed++;
      totalRequired++;
    }
    const allAcknowledgedEquityAllocation = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData.acknowledgeEquityAllocation?.[userId]);
    if (allAcknowledgedEquityAllocation) completed++;
    totalRequired++;

    // Section 4: Decision-Making
    if (isOtherArrayFieldValid(formData.majorDecisions, formData.majorDecisionsOther)) completed++;
    totalRequired++;
    if (formData.equityVotingPower) completed++;
    totalRequired++;
    if (formData.tieResolution) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged tie resolution
    const allAcknowledgedTieResolution = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData.acknowledgeTieResolution?.[userId]);
    if (allAcknowledgedTieResolution) completed++;
    totalRequired++;
    if (formData.includeShotgunClause) completed++;
    totalRequired++;
    if (formData.includeShotgunClause === 'Yes') {
      const allAcknowledgedShotgunClause = collaboratorIds.length > 0 &&
        collaboratorIds.every(userId => formData.acknowledgeShotgunClause?.[userId]);
      if (allAcknowledgedShotgunClause) completed++;
      totalRequired++;
    }

    // Section 5: Equity & Vesting
    if (formData.vestingStartDate) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.vestingSchedule, formData.vestingScheduleOther)) completed++;
    totalRequired++;
    if (formData.cliffPercentage) completed++;
    totalRequired++;
    if (formData.accelerationTrigger) completed++;
    totalRequired++;
    if (formData.sharesSellNoticeDays) completed++;
    totalRequired++;
    if (formData.sharesBuybackDays) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged forfeiture
    const allAcknowledgedForfeiture = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData.acknowledgeForfeiture?.[userId]);
    if (allAcknowledgedForfeiture) completed++;
    totalRequired++;
    if (formData.vestedSharesDisposal) completed++;
    totalRequired++;

    // Section 6: IP & Ownership
    if (formData.hasPreExistingIP) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged IP ownership
    const allAcknowledgedIPOwnership = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData.acknowledgeIPOwnership?.[userId]);
    if (allAcknowledgedIPOwnership) completed++;
    totalRequired++;

    // Section 7: Compensation
    if (formData.takingCompensation) completed++;
    totalRequired++;
    if (formData.spendingLimit) completed++;
    totalRequired++;

    // Section 8: Performance (Cofounder Performance & Departure)
    if (formData.performanceConsequences && formData.performanceConsequences.length > 0) completed++;
    totalRequired++;
    if (formData.remedyPeriodDays) completed++;
    totalRequired++;
    if (isOtherArrayFieldValid(formData.terminationWithCause, formData.terminationWithCauseOther)) completed++;
    totalRequired++;
    if (formData.voluntaryNoticeDays) completed++;
    totalRequired++;

    // Section 9: Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
    // Check if all collaborators have acknowledged confidentiality
    const allAcknowledgedConfidentiality = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData.acknowledgeConfidentiality?.[userId]);
    if (allAcknowledgedConfidentiality) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.nonCompeteDuration, formData.nonCompeteDurationOther)) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.nonSolicitDuration, formData.nonSolicitDurationOther)) completed++;
    totalRequired++;

    // Section 10: Final Details
    if (isOtherFieldValid(formData.disputeResolution, formData.disputeResolutionOther)) completed++;
    totalRequired++;
    if (formData.governingLaw) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.amendmentProcess, formData.amendmentProcessOther)) completed++;
    totalRequired++;
    if (formData.reviewFrequencyMonths) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged periodic review
    const allAcknowledgedPeriodicReview = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData.acknowledgePeriodicReview?.[userId]);
    if (allAcknowledgedPeriodicReview) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged amendment review request
    const allAcknowledgedAmendmentReviewRequest = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData.acknowledgeAmendmentReviewRequest?.[userId]);
    if (allAcknowledgedAmendmentReviewRequest) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged entire agreement
    const allAcknowledgedEntireAgreement = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData.acknowledgeEntireAgreement?.[userId]);
    if (allAcknowledgedEntireAgreement) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged severability
    const allAcknowledgedSeverability = collaboratorIds.length > 0 &&
      collaboratorIds.every(userId => formData.acknowledgeSeverability?.[userId]);
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
        return formData.companyName &&
               isOtherFieldValid(formData.entityType, formData.entityTypeOther) &&
               formData.registeredState &&
               formData.mailingStreet && formData.mailingCity && formData.mailingState &&
               formData.mailingZip && formData.companyDescription &&
               isOtherArrayFieldValid(formData.industries, formData.industryOther);

      case 2: // Cofounder Info
        if (!formData.cofounderCount) return false;
        if (formData.cofounders && formData.cofounders.length > 0) {
          // Check that all cofounders have all required fields filled
          const allCofoundersFilled = formData.cofounders.every(cf =>
            cf.fullName && cf.title && cf.email &&
            cf.roles && cf.roles.length > 0
          );
          return allCofoundersFilled;
        }
        return true;

      case 3: // Equity Allocation
        // Check that all equity percentages are filled
        const allPercentagesFilled = collaboratorIds.every(userId =>
          formData.finalEquityPercentages?.[userId] && formData.finalEquityPercentages[userId] !== ''
        );
        if (!allPercentagesFilled) return false;

        // Check that total equity equals 100%
        const totalEquity = collaboratorIds.reduce((sum, userId) =>
          sum + (parseFloat(formData.finalEquityPercentages?.[userId]) || 0), 0
        );
        if (Math.abs(totalEquity - 100) > 0.01) return false;

        // Check that all collaborators have acknowledged
        const allAcknowledgedEquityAllocation = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgeEquityAllocation?.[userId]);
        return allAcknowledgedEquityAllocation;

      case 4: // Vesting Schedule
        const allAcknowledgedForfeiture = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgeForfeiture?.[userId]);
        return formData.vestingStartDate &&
               isOtherFieldValid(formData.vestingSchedule, formData.vestingScheduleOther) &&
               formData.cliffPercentage && formData.accelerationTrigger &&
               formData.sharesSellNoticeDays && formData.sharesBuybackDays &&
               allAcknowledgedForfeiture && formData.vestedSharesDisposal;

      case 5: // Decision-Making
        const allAcknowledgedTieResolution = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgeTieResolution?.[userId]);
        const allAcknowledgedShotgunClause = formData.includeShotgunClause === 'Yes' ? (
          collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgeShotgunClause?.[userId])
        ) : true;
        return isOtherArrayFieldValid(formData.majorDecisions, formData.majorDecisionsOther) &&
               formData.equityVotingPower &&
               formData.tieResolution &&
               allAcknowledgedTieResolution &&
               formData.includeShotgunClause && allAcknowledgedShotgunClause;

      case 6: // IP & Ownership
        const allAcknowledgedIPOwnership = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgeIPOwnership?.[userId]);
        return formData.hasPreExistingIP && allAcknowledgedIPOwnership;

      case 7: // Compensation
        return formData.takingCompensation && formData.spendingLimit;

      case 8: // Performance (Cofounder Performance & Departure)
        return formData.performanceConsequences && formData.performanceConsequences.length > 0 &&
               formData.remedyPeriodDays &&
               isOtherArrayFieldValid(formData.terminationWithCause, formData.terminationWithCauseOther) &&
               formData.voluntaryNoticeDays;

      case 9: // Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
        const allAcknowledgedConfidentiality = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgeConfidentiality?.[userId]);
        return allAcknowledgedConfidentiality &&
               isOtherFieldValid(formData.nonCompeteDuration, formData.nonCompeteDurationOther) &&
               isOtherFieldValid(formData.nonSolicitDuration, formData.nonSolicitDurationOther);

      case 10: // Final Details
        const allAcknowledgedPeriodicReview = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgePeriodicReview?.[userId]);
        const allAcknowledgedAmendmentReviewRequest = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgeAmendmentReviewRequest?.[userId]);
        const allAcknowledgedEntireAgreement = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgeEntireAgreement?.[userId]);
        const allAcknowledgedSeverability = collaboratorIds.length > 0 &&
          collaboratorIds.every(userId => formData.acknowledgeSeverability?.[userId]);
        return isOtherFieldValid(formData.disputeResolution, formData.disputeResolutionOther) &&
               formData.governingLaw &&
               isOtherFieldValid(formData.amendmentProcess, formData.amendmentProcessOther) &&
               formData.reviewFrequencyMonths &&
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

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Initial blank form data structure
 * Defines all form fields across all survey sections
 */
const getInitialFormData = () => ({
  // Section 1: Formation & Purpose
  companyName: '',
  entityType: '',
  entityTypeOther: '',
  registeredState: '',
  mailingStreet: '',
  mailingStreet2: '',
  mailingCity: '',
  mailingState: '',
  mailingZip: '',
  fullMailingAddress: '',
  companyDescription: '',
  industries: [],
  industryOther: '',

  // Section 2: Cofounder Info
  cofounderCount: '',
  cofounders: [],

  // Section 3: Equity Allocation
  finalEquityPercentages: {},
  acknowledgeEquityAllocation: {},
  equityCalculatorDraft: {},
  equityCalculatorSubmitted: {},

  // Section 4: Decision-Making & Voting
  majorDecisions: [],
  majorDecisionsOther: '',
  equityVotingPower: '',
  tieResolution: '',
  tieResolutionOther: '',
  acknowledgeTieResolution: {},
  includeShotgunClause: '',
  acknowledgeShotgunClause: {},

  // Section 5: Equity & Vesting
  vestingStartDate: '',
  vestingSchedule: '',
  vestingScheduleOther: '',
  cliffPercentage: '',
  accelerationTrigger: '',
  sharesSellNoticeDays: '',
  sharesBuybackDays: '',
  acknowledgeForfeiture: false,
  vestedSharesDisposal: '',

  // Section 6: IP & Ownership
  hasPreExistingIP: '',
  preExistingIPList: '',
  acknowledgeIPAssignment: false,
  acknowledgeIPOwnership: false,

  // Section 7: Compensation & Expenses
  takingCompensation: '',
  compensations: [],
  spendingLimit: '',

  // Section 8: Performance
  performanceConsequences: [],
  remedyPeriodDays: '',
  terminationWithCause: [],
  terminationWithCauseOther: '',
  voluntaryNoticeDays: '',

  // Section 9: Non-Competition
  acknowledgeConfidentiality: false,
  nonCompeteDuration: '',
  nonCompeteDurationOther: '',
  nonSolicitDuration: '',
  nonSolicitDurationOther: '',

  // Section 10: Final Details
  disputeResolution: '',
  disputeResolutionOther: '',
  governingLaw: '',
  amendmentProcess: '',
  amendmentProcessOther: '',
  reviewFrequencyMonths: '',
  acknowledgePeriodicReview: {},
  acknowledgeAmendmentReviewRequest: {},
  acknowledgeEntireAgreement: {},
  acknowledgeSeverability: {}
});

/**
 * Custom hook for syncing project data from Firestore
 * Sets up real-time listener and manages project/form state
 *
 * @param {string} projectId - The project ID to sync
 * @param {React.RefObject} isSavingRef - Reference to track if save is in progress
 * @param {function} calculateFullMailingAddress - Function to calculate full mailing address
 * @returns {object} - { project, formData, setFormData, accessDenied, lastSaved, setLastSaved }
 */
export function useProjectSync(projectId, isSavingRef, calculateFullMailingAddress) {
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [accessDenied, setAccessDenied] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    const projectRef = doc(db, 'projects', projectId);

    const unsubscribe = onSnapshot(
      projectRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setProject(data);
          setAccessDenied(false);

          // Only update form data if not currently saving
          if (!isSavingRef.current) {
            const initialFormData = getInitialFormData();

            const loadedData = {
              ...initialFormData,
              ...(data.surveyData || {})
            };

            // Calculate fullMailingAddress if it doesn't exist (backwards compatibility)
            if (!loadedData.fullMailingAddress && loadedData.mailingStreet) {
              loadedData.fullMailingAddress = calculateFullMailingAddress(loadedData);
            }

            setFormData(loadedData);
          }

          // Set lastSaved from updatedAt if available
          if (data.updatedAt && !lastSaved) {
            setLastSaved(data.updatedAt.toDate());
          }
        }
      },
      (error) => {
        console.error('Error loading project:', error);
        if (error.code === 'permission-denied') {
          setAccessDenied(true);
        }
      }
    );

    return unsubscribe;
  }, [projectId, isSavingRef, calculateFullMailingAddress, lastSaved]);

  return {
    project,
    formData,
    setFormData,
    accessDenied,
    lastSaved,
    setLastSaved
  };
}

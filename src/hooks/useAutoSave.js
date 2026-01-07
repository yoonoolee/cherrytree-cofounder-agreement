import { useState, useRef, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Constants
const AUTO_SAVE_DELAY_MS = 2000; // Debounce delay before saving (2 seconds)
const SAVE_COMPLETION_DELAY_MS = 500; // Delay before marking save as complete

/**
 * Custom hook for auto-saving form data to Firestore
 * Handles debouncing, "Other" field merging, and save status tracking
 *
 * @param {string} projectId - The project ID
 * @param {object} project - The project object
 * @param {object} currentUser - The current user object
 * @returns {object} - { saveStatus, lastSaved, handleChange, saveFormData }
 */
export function useAutoSave(projectId, project, currentUser) {
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);

  /**
   * Save form data to Firestore
   * Merges "Other" fields and handles change detection
   */
  const saveFormData = useCallback(async (dataToSave) => {
    if (!project) return;

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      const projectRef = doc(db, 'projects', projectId);

      // Clean and merge "Other" fields before saving
      const cleanedData = { ...dataToSave };

      // Merge "Other" array fields
      if (cleanedData.industries?.includes('Other') && cleanedData.industryOther) {
        cleanedData.industries = cleanedData.industries.map(item =>
          item === 'Other' ? cleanedData.industryOther : item
        );
      }
      if (cleanedData.majorDecisions?.includes('Other') && cleanedData.majorDecisionsOther) {
        cleanedData.majorDecisions = cleanedData.majorDecisions.map(item =>
          item === 'Other' ? cleanedData.majorDecisionsOther : item
        );
      }
      if (cleanedData.terminationWithCause?.includes('Other') && cleanedData.terminationWithCauseOther) {
        cleanedData.terminationWithCause = cleanedData.terminationWithCause.map(item =>
          item === 'Other' ? cleanedData.terminationWithCauseOther : item
        );
      }

      // Merge "Other" string fields
      if (cleanedData.entityType === 'Other' && cleanedData.entityTypeOther) {
        cleanedData.entityType = cleanedData.entityTypeOther;
      }
      if (cleanedData.tieResolution === 'Other' && cleanedData.tieResolutionOther) {
        cleanedData.tieResolution = cleanedData.tieResolutionOther;
      }
      if (cleanedData.vestingSchedule === 'Other' && cleanedData.vestingScheduleOther) {
        cleanedData.vestingSchedule = cleanedData.vestingScheduleOther;
      }
      if (cleanedData.nonCompeteDuration === 'Other' && cleanedData.nonCompeteDurationOther) {
        cleanedData.nonCompeteDuration = cleanedData.nonCompeteDurationOther;
      }
      if (cleanedData.nonSolicitDuration === 'Other' && cleanedData.nonSolicitDurationOther) {
        cleanedData.nonSolicitDuration = cleanedData.nonSolicitDurationOther;
      }
      if (cleanedData.disputeResolution === 'Other' && cleanedData.disputeResolutionOther) {
        cleanedData.disputeResolution = cleanedData.disputeResolutionOther;
      }
      if (cleanedData.amendmentProcess === 'Other' && cleanedData.amendmentProcessOther) {
        cleanedData.amendmentProcess = cleanedData.amendmentProcessOther;
      }

      // Remove all "*Other" fields after merging
      const otherFields = [
        'entityTypeOther', 'industryOther', 'majorDecisionsOther', 'tieResolutionOther', 'vestingScheduleOther',
        'nonCompeteDurationOther', 'nonSolicitDurationOther', 'terminationWithCauseOther',
        'disputeResolutionOther', 'amendmentProcessOther'
      ];
      otherFields.forEach(field => delete cleanedData[field]);

      // Check if there are actual changes
      const oldData = project.surveyData || {};
      const changedFields = Object.keys(cleanedData).filter(key => {
        return JSON.stringify(oldData[key]) !== JSON.stringify(cleanedData[key]);
      });

      const updateData = {
        surveyData: cleanedData,
        lastUpdated: serverTimestamp(),
        lastEditedBy: currentUser?.primaryEmailAddress?.emailAddress
      };

      // Reset approvals only if there are actual changes
      if (changedFields.length > 0 && project.requiresApprovals) {
        updateData.approvals = {};
      }

      await updateDoc(projectRef, updateData);

      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
    } finally {
      setTimeout(() => {
        isSavingRef.current = false;
      }, SAVE_COMPLETION_DELAY_MS);
    }
  }, [project, projectId, currentUser]);

  /**
   * Handle form field changes with debounced auto-save
   * @param {function} setFormData - Form data setter
   * @param {function} calculateFullMailingAddress - Address calculator function
   */
  const createChangeHandler = useCallback((setFormData, calculateFullMailingAddress) => {
    return (field, value) => {
      setFormData(prevFormData => {
        const newFormData = {
          ...prevFormData,
          [field]: value
        };

        // Auto-update fullMailingAddress when any address field changes
        const addressFields = ['mailingStreet', 'mailingStreet2', 'mailingCity', 'mailingState', 'mailingZip'];
        if (addressFields.includes(field)) {
          newFormData.fullMailingAddress = calculateFullMailingAddress(newFormData);
        }

        setSaveStatus('saving');

        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          saveFormData(newFormData);
        }, AUTO_SAVE_DELAY_MS);

        return newFormData;
      });
    };
  }, [saveFormData]);

  return {
    saveStatus,
    lastSaved,
    saveFormData,
    createChangeHandler,
    isSavingRef
  };
}

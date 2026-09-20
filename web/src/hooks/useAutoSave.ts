import {
  useState,
  useRef,
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { serverTimestamp, updateDoc, type FieldValue, type UpdateData } from 'firebase/firestore';
import type { Project, SurveyData, SurveyFieldName } from '@cherrytree/shared';

import type { ClerkUser } from './useUser.ts';
import { projectRef } from '../lib/firebase.ts';

// Constants
const AUTO_SAVE_DELAY_MS = 2000; // Debounce delay before saving (2 seconds)
const SAVE_COMPLETION_DELAY_MS = 500; // Delay before marking save as complete

export type SaveStatus = 'saved' | 'saving' | 'error';

/**
 * Exactly what an auto-save writes (the Firestore rules allow only these client fields).
 * Firestore's UpdateData<Project> cannot express the nested Record<string, object> survey
 * fields, so the shape is pinned here and cast once at the call.
 */
interface AutoSaveUpdate {
  surveyData: SurveyData;
  lastUpdated: FieldValue;
  lastEditedBy: string | undefined;
  approvals?: Project['approvals'];
}

/** `handleChange(field, value)` as the section components call it. */
export type ChangeHandler = <K extends SurveyFieldName>(field: K, value: SurveyData[K]) => void;

/**
 * Custom hook for auto-saving form data to Firestore
 * Handles debouncing and save status tracking
 *
 * @param projectId - The project ID
 * @param project - The project object
 * @param currentUser - The current user object
 * @param isSavingRef - Shared with `useProjectSync`: true from the start of a write until shortly
 *   after it settles, so the snapshot of our own write does not overwrite newer local edits
 */
export function useAutoSave(
  projectId: string,
  project: Pick<Project, 'surveyData'> | null | undefined,
  currentUser: ClerkUser | null | undefined,
  isSavingRef: RefObject<boolean>,
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Save form data to Firestore
   * Keeps "Other" fields separate - merging happens only in cloud functions for PDF generation
   */
  const saveFormData = useCallback(
    async (dataToSave: SurveyData) => {
      if (!project) return;

      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        // Check if there are actual changes
        const oldData: Partial<SurveyData> = project.surveyData || {};
        const changedFields = (Object.keys(dataToSave) as SurveyFieldName[]).filter((key) => {
          return JSON.stringify(oldData[key]) !== JSON.stringify(dataToSave[key]);
        });

        const updateData: AutoSaveUpdate = {
          surveyData: dataToSave,
          lastUpdated: serverTimestamp(),
          lastEditedBy: currentUser?.primaryEmailAddress?.emailAddress,
        };

        // Reset approvals if there are actual changes
        if (changedFields.length > 0) {
          updateData.approvals = {};
        }

        await updateDoc(projectRef(projectId), updateData as UpdateData<Project>);

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
    },
    [project, projectId, currentUser, isSavingRef],
  );

  /**
   * Handle form field changes with debounced auto-save
   * @param setFormData - Form data setter
   */
  const createChangeHandler = useCallback(
    (setFormData: Dispatch<SetStateAction<SurveyData>>): ChangeHandler => {
      return (field, value) => {
        setFormData((prevFormData) => {
          const newFormData = {
            ...prevFormData,
            [field]: value,
          };

          setSaveStatus('saving');

          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }

          saveTimeoutRef.current = setTimeout(() => {
            void saveFormData(newFormData);
          }, AUTO_SAVE_DELAY_MS);

          return newFormData;
        });
      };
    },
    [saveFormData],
  );

  return {
    saveStatus,
    lastSaved,
    saveFormData,
    createChangeHandler,
  };
}

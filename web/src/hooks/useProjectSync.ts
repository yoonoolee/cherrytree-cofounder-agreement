import { useState, useEffect, type RefObject } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { INITIAL_FORM_DATA, type Project, type SurveyData } from '@cherrytree/shared';

import { projectRef } from '../lib/firebase.ts';

/** A project document together with its id (the Clerk organization id). */
export interface ProjectWithId extends Project {
  id: string;
}

/**
 * Get initial form data from survey schema
 */
const getInitialFormData = (): SurveyData => ({ ...INITIAL_FORM_DATA });

/**
 * Custom hook for syncing project data from Firestore
 * Sets up real-time listener and manages project/form state
 *
 * @param projectId - The project ID to sync
 * @param isSavingRef - Reference to track if save is in progress
 */
export function useProjectSync(projectId: string, isSavingRef: RefObject<boolean>) {
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [formData, setFormData] = useState<SurveyData>(getInitialFormData());
  const [accessDenied, setAccessDenied] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      projectRef(projectId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setProject({ ...data, id: doc.id });
          setAccessDenied(false);

          // Only update form data if not currently saving
          if (!isSavingRef.current) {
            const initialFormData = getInitialFormData();

            const loadedData = {
              ...initialFormData,
              ...(data.surveyData || {}),
            };

            setFormData(loadedData);
          }

          // Set lastSaved from lastUpdated if available
          if (data.lastUpdated && !lastSaved) {
            setLastSaved(data.lastUpdated.toDate());
          }
        }
      },
      (error) => {
        console.error('Error loading project:', error);
        if (error.code === 'permission-denied') {
          setAccessDenied(true);
        }
      },
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isSavingRef]);

  return {
    project,
    formData,
    setFormData,
    accessDenied,
    lastSaved,
    setLastSaved,
  };
}

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_FORM_DATA } from '../config/surveySchema';

/**
 * Get initial form data from survey schema
 */
const getInitialFormData = () => ({ ...INITIAL_FORM_DATA });

/**
 * Custom hook for syncing project data from Firestore
 * Sets up real-time listener and manages project/form state
 *
 * @param {string} projectId - The project ID to sync
 * @param {React.RefObject} isSavingRef - Reference to track if save is in progress
 * @returns {object} - { project, formData, setFormData, accessDenied, lastSaved, setLastSaved }
 */
export function useProjectSync(projectId, isSavingRef) {
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
  }, [projectId, isSavingRef]);

  return {
    project,
    formData,
    setFormData,
    accessDenied,
    lastSaved,
    setLastSaved
  };
}

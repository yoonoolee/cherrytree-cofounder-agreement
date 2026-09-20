import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Survey from '../components/Survey';
import { projectRef } from '../lib/firebase';
import { serverTimestamp, updateDoc } from 'firebase/firestore';

function SurveyPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Update lastOpened timestamp when project is accessed
  useEffect(() => {
    const updateLastOpened = async () => {
      if (!projectId) return;

      try {
        await updateDoc(projectRef(projectId), { lastOpened: serverTimestamp() });
      } catch (error) {
        console.error('Error updating lastOpened:', error);
      }
    };

    updateLastOpened();
  }, [projectId]);

  const handlePreview = () => {
    navigate(`/preview/${projectId}`);
  };

  const handleFinalAgreement = () => {
    navigate(`/final-agreement/${projectId}`);
  };

  return (
    <Survey
      projectId={projectId}
      onPreview={handlePreview}
      onFinalAgreement={handleFinalAgreement}
    />
  );
}

export default SurveyPage;

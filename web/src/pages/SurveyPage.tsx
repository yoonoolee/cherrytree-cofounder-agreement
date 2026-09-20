import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serverTimestamp, updateDoc } from 'firebase/firestore';

import Survey from '../components/Survey.tsx';
import { useProjectId } from '../hooks/useProjectId.ts';
import { projectRef } from '../lib/firebase.ts';

function SurveyPage() {
  const projectId = useProjectId();
  const navigate = useNavigate();

  // Update lastOpened timestamp when project is accessed
  useEffect(() => {
    const updateLastOpened = async () => {
      try {
        await updateDoc(projectRef(projectId), { lastOpened: serverTimestamp() });
      } catch (error) {
        console.error('Error updating lastOpened:', error);
      }
    };

    void updateLastOpened();
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

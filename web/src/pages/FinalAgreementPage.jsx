import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FinalAgreement from '../components/FinalAgreement';

function FinalAgreementPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const handleEdit = (sectionId = null) => {
    if (sectionId === 'generated-agreement') {
      // Navigate to Preview page for Review and Approve
      navigate(`/preview/${projectId}`);
    } else {
      // Navigate to Survey page for regular sections
      const url = sectionId ? `/survey/${projectId}?section=${sectionId}` : `/survey/${projectId}`;
      navigate(url);
    }
  };

  return <FinalAgreement projectId={projectId} onEdit={handleEdit} />;
}

export default FinalAgreementPage;

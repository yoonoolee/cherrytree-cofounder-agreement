import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FinalAgreement from '../components/FinalAgreement';
import PaymentModal from '../components/PaymentModal';

function FinalAgreementPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleEdit = (sectionId = null) => {
    if (sectionId === 'generated-agreement') {
      // Navigate to Preview page for Review and Approve
      navigate(`/preview/${projectId}`);
    } else {
      // Navigate to Survey page for regular sections
      const url = sectionId
        ? `/survey/${projectId}?section=${sectionId}`
        : `/survey/${projectId}`;
      navigate(url);
    }
  };

  const handleCreateProject = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (newProjectId) => {
    setShowPaymentModal(false);
    if (newProjectId) {
      navigate(`/survey/${newProjectId}`);
    }
  };

  const handleProjectSwitch = (newProjectId) => {
    navigate(`/survey/${newProjectId}`);
  };

  return (
    <>
      <FinalAgreement
        projectId={projectId}
        onEdit={handleEdit}
        onCreateProject={handleCreateProject}
        onProjectSwitch={handleProjectSwitch}
      />
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}

export default FinalAgreementPage;

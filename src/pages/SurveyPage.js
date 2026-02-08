import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Survey from '../components/Survey';
import PaymentModal from '../components/PaymentModal';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { useProjects } from '../hooks/useProjects';

function SurveyPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, userMemberships, organizationList, setActive, orgsLoaded } = useUser();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Use shared useProjects hook instead of duplicate fetching logic
  const { projects: allProjects } = useProjects(currentUser, userMemberships, orgsLoaded, authLoading);

  // Set active organization based on projectId (projectId === clerkOrgId)
  useEffect(() => {
    const setActiveOrg = async () => {
      if (!projectId || !orgsLoaded || !setActive) return;

      try {
        const org = organizationList?.find(o => o.organization.id === projectId);
        if (org) {
          await setActive({ organization: projectId });
        }
      } catch (error) {
        console.error('Error setting active organization:', error);
      }
    };

    setActiveOrg();
  }, [projectId, orgsLoaded, organizationList, setActive]);

  // Update lastOpened timestamp when project is accessed
  useEffect(() => {
    const updateLastOpened = async () => {
      if (!projectId) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
          lastOpened: new Date()
        });
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
      <Survey
        projectId={projectId}
        allProjects={allProjects}
        onPreview={handlePreview}
        onFinalAgreement={handleFinalAgreement}
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

export default SurveyPage;

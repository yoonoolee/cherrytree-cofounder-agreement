import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganizationList } from '@clerk/clerk-react';
import Survey from '../components/Survey';
import PaymentModal from '../components/PaymentModal';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';

function SurveyPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { setActive, organizationList, isLoaded } = useOrganizationList();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [allProjects, setAllProjects] = useState([]);

  // Set active organization based on projectId (projectId === clerkOrgId)
  useEffect(() => {
    const setActiveOrg = async () => {
      if (!projectId || !isLoaded || !setActive) return;

      try {
        // projectId is the Clerk org ID, so we can set it directly
        const org = organizationList?.find(o => o.organization.id === projectId);
        if (org) {
          await setActive({ organization: projectId });
        }
      } catch (error) {
        console.error('Error setting active organization:', error);
      }
    };

    setActiveOrg();
  }, [projectId, isLoaded, organizationList, setActive]);

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

  // Fetch all projects for the current user via their org memberships
  // orgId === projectId (Clerk org ID is the Firestore document ID)
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser || !isLoaded) return;

      try {
        const orgIds = organizationList?.map(org => org.organization.id) || [];

        // Fetch projects directly by ID (orgId === projectId)
        const projectPromises = orgIds.map(orgId =>
          getDoc(doc(db, 'projects', orgId))
        );
        const projectDocs = await Promise.all(projectPromises);

        const fetchedProjects = projectDocs
          .filter(projectDoc => projectDoc.exists())
          .map(projectDoc => ({ id: projectDoc.id, ...projectDoc.data() }));

        // Sort by lastOpened (most recent first)
        fetchedProjects.sort((a, b) => {
          const aTime = a.lastOpened?.toMillis?.() || 0;
          const bTime = b.lastOpened?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setAllProjects(fetchedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [projectId, currentUser, isLoaded, organizationList]);

  const handlePreview = () => {
    navigate(`/preview/${projectId}`);
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

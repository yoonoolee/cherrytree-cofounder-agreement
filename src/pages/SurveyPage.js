import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganizationList } from '@clerk/clerk-react';
import Survey from '../components/Survey';
import PaymentModal from '../components/PaymentModal';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, limit, getDoc } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';

function SurveyPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { setActive, organizationList, isLoaded } = useOrganizationList();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [allProjects, setAllProjects] = useState([]);

  // Set active organization based on project's clerkOrgId
  useEffect(() => {
    const setActiveOrg = async () => {
      if (!projectId || !isLoaded) return;

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          const clerkOrgId = projectData.clerkOrgId;

          // If project has a Clerk org, set it as active
          if (clerkOrgId && setActive) {
            const org = organizationList?.find(o => o.organization.id === clerkOrgId);
            if (org) {
              await setActive({ organization: clerkOrgId });
            }
          }
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
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser || !isLoaded) return;

      try {
        const allProjects = [];
        const orgIds = organizationList?.map(org => org.organization.id) || [];

        if (orgIds.length > 0) {
          const projectsRef = collection(db, 'projects');

          for (const orgId of orgIds) {
            const orgQuery = query(
              projectsRef,
              where('clerkOrgId', '==', orgId),
              limit(100)
            );
            const snapshot = await getDocs(orgQuery);

            snapshot.docs.forEach(doc => {
              if (!allProjects.find(p => p.id === doc.id)) {
                allProjects.push({ id: doc.id, ...doc.data() });
              }
            });
          }
        }

        // Sort by lastOpened (most recent first)
        allProjects.sort((a, b) => {
          const aTime = a.lastOpened?.toMillis?.() || 0;
          const bTime = b.lastOpened?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setAllProjects(allProjects);
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

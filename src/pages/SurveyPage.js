import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Survey from '../components/Survey';
import PaymentModal from '../components/PaymentModal';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';

function SurveyPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [allProjects, setAllProjects] = useState([]);

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

  // Fetch all projects for the current user (both owned and collaborated)
  useEffect(() => {
    const fetchProjects = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const projectsRef = collection(db, 'projects');

        // Query 1: Projects where user is the owner
        const ownedQuery = query(
          projectsRef,
          where('ownerId', '==', user.uid)
        );
        const ownedSnapshot = await getDocs(ownedQuery);

        // Query 2: Projects where user is a collaborator
        const collaboratorQuery = query(
          projectsRef,
          where('collaboratorIds', 'array-contains', user.uid)
        );
        const collaboratorSnapshot = await getDocs(collaboratorQuery);

        // Merge and deduplicate projects
        const projectsMap = new Map();

        ownedSnapshot.docs.forEach(doc => {
          projectsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        collaboratorSnapshot.docs.forEach(doc => {
          if (!projectsMap.has(doc.id)) {
            projectsMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });

        // Convert to array and sort by lastOpened
        const projects = Array.from(projectsMap.values()).sort((a, b) => {
          const aTime = a.lastOpened?.toMillis?.() || 0;
          const bTime = b.lastOpened?.toMillis?.() || 0;
          return bTime - aTime;
        });

        console.log('Fetched projects:', projects);
        setAllProjects(projects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [projectId]);

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

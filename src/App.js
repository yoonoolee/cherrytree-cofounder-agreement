import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import Auth from './components/Auth';
import PaymentModal from './components/PaymentModal';
import Survey from './components/Survey';
import Preview from './components/Preview';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('survey'); // 'survey', 'preview'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Fetch all projects (owned + collaborating)
  useEffect(() => {
    if (!user) {
      setLoadingProjects(false);
      return;
    }

    setLoadingProjects(true);
    const userEmail = user.email;

    // Use refs to track loading state
    const loadState = {
      ownedLoaded: false,
      collabLoaded: false,
      ownedProjects: [],
      collabProjects: []
    };

    const updateProjects = () => {
      if (loadState.ownedLoaded && loadState.collabLoaded) {
        // Combine and sort
        const allProjectsList = [...loadState.ownedProjects, ...loadState.collabProjects];
        allProjectsList.sort((a, b) => {
          const aTime = a.lastUpdated?.toMillis() || a.createdAt?.toMillis() || 0;
          const bTime = b.lastUpdated?.toMillis() || b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });

        console.log('Projects loaded:', allProjectsList.length);
        setAllProjects(allProjectsList);
        setLoadingProjects(false);
      }
    };

    // Listen to projects owned by user
    const ownedQuery = query(
      collection(db, 'projects'),
      where('ownerEmail', '==', userEmail)
    );

    const unsubscribeOwned = onSnapshot(ownedQuery, (snapshot) => {
      loadState.ownedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      loadState.ownedLoaded = true;
      console.log('Owned projects loaded:', loadState.ownedProjects.length);
      updateProjects();
    });

    // Listen to projects where user is a collaborator
    const collabQuery = query(
      collection(db, 'projects'),
      where('collaborators', 'array-contains', userEmail)
    );

    const unsubscribeCollab = onSnapshot(collabQuery, (snapshot) => {
      loadState.collabProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(p => p.ownerEmail !== userEmail); // Exclude owned projects
      loadState.collabLoaded = true;
      console.log('Collab projects loaded:', loadState.collabProjects.length);
      updateProjects();
    });

    return () => {
      unsubscribeOwned();
      unsubscribeCollab();
    };
  }, [user]);

  const handleSelectProject = useCallback(async (projectId) => {
    setSelectedProject(projectId);

    // Check if project is already submitted
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists() && projectSnap.data().submitted) {
      setViewMode('preview');
    } else {
      setViewMode('survey');
    }
  }, []);

  // Automatically select the latest project
  useEffect(() => {
    if (allProjects.length > 0 && !selectedProject) {
      const latestProject = allProjects[0];
      handleSelectProject(latestProject.id);
    }
  }, [allProjects, selectedProject, handleSelectProject]);

  const handleCreateProject = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (projectId) => {
    setShowPaymentModal(false);
    if (projectId) {
      handleSelectProject(projectId);
    }
  };

  const handleGoToPreview = async () => {
    setViewMode('preview');
  };

  const handleBackToEdit = () => {
    setViewMode('survey');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Show loading while projects are being fetched
  if (loadingProjects) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (selectedProject && viewMode === 'survey') {
    return (
      <>
        <Survey
          projectId={selectedProject}
          allProjects={allProjects}
          onProjectSwitch={handleSelectProject}
          onPreview={handleGoToPreview}
          onCreateProject={handleCreateProject}
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

  if (selectedProject && viewMode === 'preview') {
    return (
      <>
        <Preview
          projectId={selectedProject}
          allProjects={allProjects}
          onProjectSwitch={handleSelectProject}
          onEdit={handleBackToEdit}
          onCreateProject={handleCreateProject}
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

  // No projects - show create project screen
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Projects Found</h2>
        <p className="text-gray-600 mb-6">Create your first cofounder agreement project</p>
        <button
          onClick={handleCreateProject}
          className="bg-black text-white px-6 py-3 rounded font-medium hover:bg-gray-800 transition"
        >
          Create New Project
        </button>

        {showPaymentModal && (
          <PaymentModal
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}

export default App;
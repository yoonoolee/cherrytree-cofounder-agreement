import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import PaymentModal from '../components/PaymentModal';

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [waitingForNewProject, setWaitingForNewProject] = useState(false);

  // Simple payment redirect - if coming back from Stripe with session_id, go to newest project
  const [redirectingToProject, setRedirectingToProject] = useState(false);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Auto-redirect to newest project after Stripe payment
  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    // If we have a Stripe session_id AND we're not already redirecting AND projects are loaded
    if (sessionId && !redirectingToProject && !loadingProjects && allProjects.length > 0 && user) {
      console.log('Stripe payment detected, redirecting to newest project...');
      setRedirectingToProject(true);

      // Get the newest project
      const newestProject = allProjects[0];
      console.log('Redirecting to:', newestProject.id, newestProject.name);

      // Redirect immediately
      navigate(`/survey/${newestProject.id}`, { replace: true });
    }
  }, [searchParams, redirectingToProject, loadingProjects, allProjects, user, navigate]);

  // Listen to projects in real-time
  useEffect(() => {
    if (!user) {
      setAllProjects([]);
      setLoadingProjects(false);
      return;
    }

    setLoadingProjects(true);
    const userEmail = user.email;

    const loadState = {
      ownedLoaded: false,
      collabLoaded: false,
      ownedProjects: [],
      collabProjects: []
    };

    const updateProjects = () => {
      if (loadState.ownedLoaded && loadState.collabLoaded) {
        const allProjectsList = [...loadState.ownedProjects, ...loadState.collabProjects];
        allProjectsList.sort((a, b) => {
          const aTime = a.lastUpdated?.toMillis() || a.createdAt?.toMillis() || 0;
          const bTime = b.lastUpdated?.toMillis() || b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });

        setAllProjects(allProjectsList);
        setLoadingProjects(false);
      }
    };

    // Real-time listener for owned projects
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
      updateProjects();
    });

    // Real-time listener for collaborative projects
    const collabQuery = query(
      collection(db, 'projects'),
      where('collaborators', 'array-contains', userEmail)
    );

    const unsubscribeCollab = onSnapshot(collabQuery, (snapshot) => {
      loadState.collabProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(p => p.ownerEmail !== userEmail);
      loadState.collabLoaded = true;
      updateProjects();
    });

    return () => {
      unsubscribeOwned();
      unsubscribeCollab();
    };
  }, [user]);

  const handleCreateProject = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (projectId) => {
    setShowPaymentModal(false);
    // Projects will auto-update via real-time listeners
    if (projectId) {
      navigate(`/survey/${projectId}`);
    }
  };

  const handleProjectClick = (project) => {
    if (project.submitted) {
      navigate(`/preview/${project.id}`);
    } else {
      navigate(`/survey/${project.id}`);
    }
  };

  const handleSignOut = () => {
    signOut(auth).then(() => {
      navigate('/login');
    });
  };

  if (!user || redirectingToProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            {redirectingToProject ? 'Opening your new project...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || user.email}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-gray-600">{user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={handleCreateProject}
            className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            + New Cofounder Agreement
          </button>
        </div>

        {/* Projects List */}
        {loadingProjects ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading projects...</p>
          </div>
        ) : allProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No projects yet. Create your first cofounder agreement!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.name || 'Untitled Project'}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Owner: {project.ownerEmail}</p>
                  {project.collaborators && project.collaborators.length > 1 && (
                    <p>Collaborators: {project.collaborators.length}</p>
                  )}
                  <p className="mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      project.submitted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.submitted ? 'Completed' : 'In Progress'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default Dashboard;

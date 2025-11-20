import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import PaymentModal from '../components/PaymentModal';

function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) return;

      try {
        // First check if user has completed onboarding
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Redirect if hasCompletedOnboarding is explicitly false
          if (userData.hasCompletedOnboarding === false) {
            navigate('/onboarding', { replace: true });
            return;
          }
        } else {
          // User doc doesn't exist yet (race condition) - redirect to onboarding
          navigate('/onboarding', { replace: true });
          return;
        }

        const projectsRef = collection(db, 'projects');

        // Query for user's projects
        const ownedQuery = query(
          projectsRef,
          where('ownerId', '==', currentUser.uid),
          limit(100)
        );

        const collaboratorQuery = query(
          projectsRef,
          where('collaboratorIds', 'array-contains', currentUser.uid),
          limit(100)
        );

        const [ownedSnapshot, collaboratorSnapshot] = await Promise.all([
          getDocs(ownedQuery),
          getDocs(collaboratorQuery)
        ]);

        const allProjects = [];

        ownedSnapshot.docs.forEach(doc => {
          allProjects.push({ id: doc.id, ...doc.data() });
        });

        collaboratorSnapshot.docs.forEach(doc => {
          if (!allProjects.find(p => p.id === doc.id)) {
            allProjects.push({ id: doc.id, ...doc.data() });
          }
        });

        // Sort by lastOpened
        allProjects.sort((a, b) => {
          const aTime = a.lastOpened?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const bTime = b.lastOpened?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setProjects(allProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProjects();
    }
  }, [currentUser, authLoading, navigate]);

  const handlePaymentSuccess = (newProjectId) => {
    setShowPaymentModal(false);
    if (newProjectId) {
      navigate(`/survey/${newProjectId}`);
    }
  };


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <img src="/images/cherrytree-logo.png" alt="Cherrytree" className="h-6" />
        <button
          onClick={() => signOut(auth).then(() => navigate('/'))}
          className="text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Sign out
        </button>
      </div>

      {/* Floating Help Button */}
      <button
        onClick={() => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 })}
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-500 hover:border-gray-300 hover:shadow-md transition-all"
      >
        <span className="text-sm font-medium">?</span>
      </button>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-4xl font-light text-gray-900">
            Your Dashboard
          </h1>
        </div>

        {/* Two Column Layout */}
        <div className="flex gap-8 flex-1">
          {/* Left - Create New */}
          <div className="flex-1">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="group w-full h-full p-8 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 min-h-[450px] flex items-center justify-center"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center mb-4 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Create a new Cofounder Agreement</h3>
                <p className="text-sm text-gray-500">One agreement per company.</p>
              </div>
            </button>
          </div>

          {/* Right - Projects */}
          <div className="flex-1">
            {/* Projects List */}
            <div className="bg-white rounded-lg border border-gray-200 min-h-[450px] flex flex-col hover:border-gray-300 hover:shadow-lg transition-all duration-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Existing projects</span>
              </div>

              {projects.length > 0 ? (
                <div className="divide-y divide-gray-100 flex-1">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/survey/${project.id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                            {project.name || 'Untitled Project'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.name || 'Untitled Project'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-gray-500 flex-1 flex items-center justify-center">
                  No projects found
                </div>
              )}

            </div>
          </div>
        </div>
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

export default DashboardPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Create New Agreement Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-black text-white px-6 py-3 rounded hover:bg-[#1a1a1a] transition flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Create new agreement
          </button>
        </div>

        {/* Projects List */}
        {projects.length > 0 && (
          <div className="grid gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/survey/${project.id}`)}
                className="text-left p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {project.name || 'Untitled Project'}
                </h3>
                <p className="text-sm text-gray-500">
                  Last edited: {project.lastOpened?.toDate?.()?.toLocaleDateString() ||
                    project.createdAt?.toDate?.()?.toLocaleDateString() ||
                    'Unknown'}
                </p>
              </button>
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

export default DashboardPage;

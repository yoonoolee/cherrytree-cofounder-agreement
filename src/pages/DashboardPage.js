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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <img src="/images/cherrytree-logo.png" alt="Cherrytree" className="h-6" />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-4xl font-light text-gray-900">
            Your Dashboard
          </h1>
        </div>

        {/* Two Column Layout */}
        <div className="flex gap-12">
          {/* Left Column - Get Started */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-gray-600 mb-4">Get started</h2>

            {/* Action Card 1 */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full text-left p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition mb-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {/* Placeholder icon */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Create a new Cofounder Agreement</h3>
                  <p className="text-sm text-gray-500">Action description goes here</p>
                </div>
              </div>
            </button>

            {/* Action Card 2 */}
            <button
              className="w-full text-left p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition mb-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Action title</h3>
                  <p className="text-sm text-gray-500">Action description goes here</p>
                </div>
              </div>
            </button>

            {/* Section 2 */}
            <h2 className="text-sm font-medium text-gray-600 mb-4 mt-8">Section title</h2>

            {/* Action Card 3 */}
            <button
              className="w-full text-left p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition mb-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Action title</h3>
                  <p className="text-sm text-gray-500">Action description goes here</p>
                </div>
              </div>
            </button>

            {/* Action Card 4 */}
            <button
              className="w-full text-left p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Action title</h3>
                  <p className="text-sm text-gray-500">Action description goes here</p>
                </div>
              </div>
            </button>
          </div>

          {/* Right Column - Projects */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-gray-600 mb-4">Your projects</h2>

            {/* Projects List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Projects</span>
              </div>

              {projects.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/survey/${project.id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600 hover:underline truncate max-w-48">
                            {project.name || 'Untitled Project'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.name || 'Untitled Project'}
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-300 hover:text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </button>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No projects found
                </div>
              )}

              {/* Pagination */}
              {projects.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 text-sm text-gray-500">
                  <span>1 – {projects.length} of {projects.length}</span>
                  <button className="p-1 hover:bg-gray-100 rounded" disabled>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded" disabled>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                  </button>
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import PaymentModal from '../components/PaymentModal';

function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, loading: authLoading } = useUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [displayedTagline, setDisplayedTagline] = useState('');
  const fullTagline = 'Great companies start with great company.';

  useEffect(() => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= fullTagline.length) {
        setDisplayedTagline(fullTagline.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 38);

    return () => clearInterval(intervalId);
  }, []);

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

        // If payment was successful, redirect to the newly created project's survey
        if (searchParams.get('payment') === 'success') {
          const paymentStartTime = parseInt(sessionStorage.getItem('paymentStartTime') || '0', 10);
          sessionStorage.removeItem('paymentStartTime');

          // Find project created after payment started
          const newProject = allProjects.find(p => {
            const createdTime = p.createdAt?.toMillis?.() || 0;
            return createdTime > paymentStartTime;
          });

          if (newProject) {
            navigate(`/survey/${newProject.id}`, { replace: true });
            return;
          }

          // Project not created yet (webhook delay), poll for it
          const pollForProject = async (attempts = 0) => {
            if (attempts >= 20) {
              // Give up after 20 attempts (10 seconds)
              setLoading(false);
              return;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            const [ownedSnap, collabSnap] = await Promise.all([
              getDocs(query(collection(db, 'projects'), where('ownerId', '==', currentUser.uid), limit(100))),
              getDocs(query(collection(db, 'projects'), where('collaboratorIds', 'array-contains', currentUser.uid), limit(100)))
            ]);

            // Find project created after payment started
            const allDocs = [...ownedSnap.docs, ...collabSnap.docs];
            const newProj = allDocs.find(doc => {
              const createdTime = doc.data().createdAt?.toMillis?.() || 0;
              return createdTime > paymentStartTime;
            });

            if (newProj) {
              navigate(`/survey/${newProj.id}`, { replace: true });
            } else {
              pollForProject(attempts + 1);
            }
          };

          pollForProject();
          return;
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProjects();
    }
  }, [currentUser, authLoading, navigate, searchParams]);

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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-4xl font-light text-gray-900">
            Your Dashboard
          </h1>
          <p className="text-lg mt-2" style={{ color: '#6B7280' }}>{displayedTagline}</p>
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

          {/* Right - Projects + Resources */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Projects List */}
            <div className="bg-white rounded-lg border border-gray-200 max-h-[320px] flex flex-col hover:border-gray-300 hover:shadow-lg transition-all duration-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Existing projects</span>
              </div>

              {projects.length > 0 ? (
                <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
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

            {/* Resources Section */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Profile</h4>
                    <p className="text-xs text-gray-500">Your account</p>
                  </div>
                </div>
              </button>

              <a
                href="https://cherrytree.beehiiv.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd"/>
                      <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Newsletter</h4>
                    <p className="text-xs text-gray-500">Cofounder tips</p>
                  </div>
                </div>
              </a>

              <button
                onClick={() => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 })}
                className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Contact</h4>
                    <p className="text-xs text-gray-500">Get in touch</p>
                  </div>
                </div>
              </button>

              <a
                href="https://www.cherrytree.app/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Pricing</h4>
                    <p className="text-xs text-gray-500">View plans</p>
                  </div>
                </div>
              </a>
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

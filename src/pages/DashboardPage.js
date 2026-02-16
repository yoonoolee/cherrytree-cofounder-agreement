import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { UserButton, useClerk } from '@clerk/clerk-react';
import PaymentModal from '../components/PaymentModal';
import { useProjects } from '../hooks/useProjects';
import { calculateProjectProgress } from '../utils/progressCalculation';
import { FIELDS } from '../config/surveySchema';

function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, userMemberships, orgsLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [displayedTagline, setDisplayedTagline] = useState('\u00A0'); // Non-breaking space to reserve height

  // Constants
  const FULL_TAGLINE = 'Great companies start with great company.';
  const TYPING_SPEED_MS = 38; // Speed of typing animation

  // Fetch projects using custom hook (waits for Firebase auth via authLoading)
  const { projects, loading } = useProjects(currentUser, userMemberships, orgsLoaded, authLoading);

  useEffect(() => {
    // Only start animation after page is fully loaded
    if (authLoading || loading) return;

    let currentIndex = 0;
    let intervalId;

    // Delay the animation start by 500ms after loading completes
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (currentIndex <= FULL_TAGLINE.length) {
          setDisplayedTagline(FULL_TAGLINE.slice(0, currentIndex) || '\u00A0');
          currentIndex++;
        } else {
          clearInterval(intervalId);
        }
      }, TYPING_SPEED_MS);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [authLoading, loading]);

  const handlePaymentSuccess = (newProjectId) => {
    setShowPaymentModal(false);
  };


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf6f5]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf6f5] flex flex-col">
      {/* Header */}
      <div className="px-2 md:px-3 pt-2 md:pt-3">
        <div className="bg-white rounded-lg px-4 md:px-6 py-3 flex items-center justify-between border border-[#eae6e5]">
          <button onClick={() => navigate('/')} className="cursor-pointer">
            <img src="/images/cherrytree-logo.png" alt="Cherrytree" className="h-6" />
          </button>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className="text-xs font-medium text-gray-900 tracking-widest uppercase">Dashboard</button>
            <button onClick={() => navigate('/refer')} className="text-xs font-medium text-gray-400 tracking-widest uppercase hover:text-gray-900 transition">Refer a Friend</button>
            {/* UserButton - Clerk's built-in user menu with sign-out */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8'
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex px-2 md:px-3 pb-2 md:pb-3 pt-2 md:pt-3 gap-2 md:gap-3 flex-1">
        {/* Left Panel */}
        <div className="hidden md:flex w-56 shrink-0">
          <div className="bg-white rounded-lg border border-[#eae6e5] p-4 w-full">
            <h4 className="text-xs font-medium text-gray-400 tracking-widest uppercase px-3 mb-2">Platform</h4>
            <nav className="flex flex-col gap-1">
              <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-gray-900 text-left px-3 py-2 rounded-lg flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#06271D] shrink-0"></span>Dashboard</button>
              <button className="text-sm font-medium text-gray-500 text-left px-3 py-2 rounded-lg hover:bg-[#fbf6f5] transition">Projects</button>
              <button className="text-sm font-medium text-gray-500 text-left px-3 py-2 rounded-lg hover:bg-[#fbf6f5] transition">Billing</button>
              <button onClick={() => navigate('/refer')} className="text-sm font-medium text-gray-500 text-left px-3 py-2 rounded-lg hover:bg-[#fbf6f5] transition">Refer a Friend</button>
            </nav>

            <div className="mt-6 pt-4 border-t border-[#eae6e5]">
              <h4 className="text-xs font-medium text-gray-400 tracking-widest uppercase px-3 mb-2">Resources</h4>
              <nav className="flex flex-col gap-1">
                <button onClick={() => openUserProfile()} className="text-sm font-medium text-gray-500 text-left px-3 py-2 rounded-lg hover:bg-[#fbf6f5] transition">Account</button>
                <a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-500 text-left px-3 py-2 rounded-lg hover:bg-[#fbf6f5] transition">Newsletter</a>

                <button onClick={() => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 })} className="text-sm font-medium text-gray-500 text-left px-3 py-2 rounded-lg hover:bg-[#fbf6f5] transition">Contact</button>

              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 bg-white rounded-lg border border-[#eae6e5] p-6 md:p-10">
          {/* Greeting */}
          <div className="mb-8 md:mb-10 text-left">
            <h1 className="font-heading-transform-origin-left text-3xl md:text-4xl font-medium text-gray-900">
              Welcome{currentUser?.firstName ? `, ${currentUser.firstName}` : ''}!
            </h1>
            <p className="text-sm md:text-lg mt-1 text-gray-500 min-h-[1.5em]">{displayedTagline}</p>
          </div>

          {/* Your Projects */}
          <h2 className="text-lg md:text-xl font-normal text-gray-900 mb-4">Your Projects</h2>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-3" style={{ gridAutoRows: 'minmax(252px, auto)' }}>
          {/* Projects */}
          {projects.length > 0 ? (
            projects.map((project) => {
              const progress = calculateProjectProgress(project);

              // Calculate time since last edit
              const lastEditTime = project.updatedAt || project.createdAt;
              let timeAgo = '';
              if (lastEditTime) {
                const now = new Date();
                const lastEdit = lastEditTime.toDate ? lastEditTime.toDate() : new Date(lastEditTime);
                const hoursAgo = Math.floor((now - lastEdit) / (1000 * 60 * 60));

                if (hoursAgo < 1) {
                  const minutesAgo = Math.floor((now - lastEdit) / (1000 * 60));
                  timeAgo = minutesAgo < 1 ? 'just now' : `${minutesAgo}m ago`;
                } else if (hoursAgo < 24) {
                  timeAgo = `${hoursAgo}h ago`;
                } else {
                  const daysAgo = Math.floor(hoursAgo / 24);
                  timeAgo = `${daysAgo}d ago`;
                }
              }

              // Get cofounder first names
              const cofounders = project.surveyData?.cofounders || [];
              const cofounderNames = cofounders
                .map(cf => cf[FIELDS.COFOUNDER_FULL_NAME]?.split(' ')[0])
                .filter(Boolean);

              let agreementText = 'Cofounder Agreement';
              if (cofounderNames.length > 0) {
                if (cofounderNames.length === 1) {
                  agreementText = `Cofounder Agreement for ${cofounderNames[0]}`;
                } else {
                  const namesList = cofounderNames.length === 2
                    ? `${cofounderNames[0]} and ${cofounderNames[1]}`
                    : `${cofounderNames.slice(0, -1).join(', ')}, and ${cofounderNames[cofounderNames.length - 1]}`;
                  agreementText = `Cofounder Agreement between ${namesList}`;
                }
              } else if (currentUser?.firstName) {
                agreementText = `Cofounder Agreement for ${currentUser.firstName}`;
              }

              return (
                <button
                  key={project.id}
                  onClick={() => navigate(`/survey/${project.id}`)}
                  className="w-full h-full bg-[#fbf6f5] rounded-lg border border-[#eae6e5] hover:border-[#d5d1d0] hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                >
                  <div className="py-6 sm:py-8 px-4 sm:px-6 flex-grow">
                    <h2 className="text-base font-semibold text-gray-900 mb-2 text-left">
                      {project.name || 'Untitled Project'}
                    </h2>
                    <p className="text-sm text-gray-500 text-left mb-4">
                      {agreementText}
                    </p>
                  </div>
                  {/* Progress Bar */}
                  <div className="px-4 sm:px-6 pb-6 sm:pb-8 mt-auto">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-[#eae6e5] rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, backgroundColor: '#000000' }}
                      />
                    </div>
                    {/* Status and Last Edited */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                      <span>
                        {progress < 100 && (
                          <span className="px-2 py-1 rounded" style={{ color: '#000000', backgroundColor: '#eae6e5' }}>In progress</span>
                        )}
                      </span>
                      {timeAgo && <span>Last edited {timeAgo}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="w-full h-full bg-[#fbf6f5] rounded-lg border border-gray-200 p-6 sm:p-8 flex items-center justify-center">
              <p className="text-sm text-gray-500">No projects found</p>
            </div>
          )}

          {/* Create New Button */}
          <button
            onClick={() => setShowPaymentModal(true)}
            className="group w-full h-full py-6 sm:py-8 px-4 sm:px-6 bg-[#fbf6f5] rounded-lg border-2 border-dotted border-[#eae6e5] hover:border-[#d5d1d0] hover:shadow-lg transition-all duration-200 flex items-center justify-center"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#eae6e5] group-hover:bg-[#d5d1d0] flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Create a new Cofounder Agreement</h3>
              <p className="text-xs text-gray-500">One agreement per company.</p>
            </div>
          </button>
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

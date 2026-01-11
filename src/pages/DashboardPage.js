import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useOrganizationList, UserButton } from '@clerk/clerk-react';
import PaymentModal from '../components/PaymentModal';
import { useProjects } from '../hooks/useProjects';

function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useUser();
  const { userMemberships, isLoaded: orgsLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true
    }
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [displayedTagline, setDisplayedTagline] = useState('');

  // Constants
  const FULL_TAGLINE = 'Great companies start with great company.';
  const TYPING_SPEED_MS = 38; // Speed of typing animation

  // Fetch projects using custom hook
  const { projects, loading } = useProjects(currentUser, userMemberships, orgsLoaded);

  useEffect(() => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= FULL_TAGLINE.length) {
        setDisplayedTagline(FULL_TAGLINE.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, TYPING_SPEED_MS);

    return () => clearInterval(intervalId);
  }, []);

  const handlePaymentSuccess = (newProjectId) => {
    setShowPaymentModal(false);
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
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
        <img src="/images/cherrytree-logo.png" alt="Cherrytree" className="h-6" />

        <div className="flex items-center gap-4">
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Greeting */}
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-light text-gray-900">
            Welcome{currentUser?.firstName ? `, ${currentUser.firstName}` : ''}!
          </h1>
          <p className="text-sm md:text-lg mt-2 text-gray-500">{displayedTagline}</p>
        </div>

        {/* Two Column Layout - stacks on mobile */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* Left - Projects List */}
          <div className="w-full md:flex-1 flex flex-col gap-4">
            {/* Projects List */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
              <h2 className="text-base font-semibold text-gray-900 mb-3">My cofounder agreements</h2>

              {projects.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/survey/${project.id}`)}
                      className="w-full text-left p-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {project.name || 'Untitled Project'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-center text-sm text-gray-500 flex-1 flex items-center justify-center">
                  No projects found
                </div>
              )}

            </div>
          </div>

          {/* Right - Create New */}
          <div className="w-full md:flex-1 flex flex-col gap-4">
            {/* Create New Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="group w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex items-center justify-center"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center mb-3 transition-colors">
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

        {/* Resources Section - Bottom */}
        <div className="mt-8 md:mt-12 flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
            <a
              href="https://cherrytree.beehiiv.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 p-6 flex flex-col items-center justify-center text-center aspect-square"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-blue-900">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd"/>
                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"/>
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Newsletter</h4>
              <p className="text-xs text-gray-500">placeholder placeholder.</p>
            </a>

            <button
              onClick={() => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 })}
              className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 p-6 flex flex-col items-center justify-center text-center aspect-square"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-blue-900">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Contact</h4>
              <p className="text-xs text-gray-500">placeholder placeholder.</p>
            </button>

            <a
              href="https://www.cherrytree.app/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 p-6 flex flex-col items-center justify-center text-center aspect-square"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-blue-900">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Pricing</h4>
              <p className="text-xs text-gray-500">placeholder placeholder.</p>
            </a>
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

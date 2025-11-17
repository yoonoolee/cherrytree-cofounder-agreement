import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import PaymentModal from './PaymentModal';

function SurveyNavigation({
  displayTitle, // What to show in the header (user name or project name)
  children, // The navigation items (sections/settings tabs)
  bottomSection, // Optional bottom section content
  currentPage = 'survey', // 'survey' or 'settings'
  projectId = null, // Current project ID if on survey page
  allProjects: providedProjects = null, // Optional: pre-fetched projects
  onProjectSwitch: providedOnProjectSwitch = null, // Optional: custom project switch handler
  onCreateProject: providedOnCreateProject = null // Optional: custom create project handler
}) {
  const navigate = useNavigate();
  const [fetchedProjects, setFetchedProjects] = useState([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const dropdownRef = useRef(null);

  // Use provided projects or fetch them
  const allProjects = providedProjects !== null ? providedProjects : fetchedProjects;

  // Fetch all projects for the current user (only if not provided)
  useEffect(() => {
    if (providedProjects !== null) return; // Skip if projects are provided

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

        setFetchedProjects(projects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [projectId, providedProjects]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false);
      }
    };

    if (showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectDropdown]);

  const handleCreateProject = () => {
    if (providedOnCreateProject) {
      providedOnCreateProject();
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (newProjectId) => {
    setShowPaymentModal(false);
    if (newProjectId) {
      navigate(`/survey/${newProjectId}`);
    }
  };

  const handleProjectSwitch = (newProjectId) => {
    if (providedOnProjectSwitch) {
      providedOnProjectSwitch(newProjectId);
    } else {
      navigate(`/survey/${newProjectId}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Use window.location instead of navigate to force a full page reload
      // This ensures all auth state is cleared from memory
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <div className="border-r border-gray-200 flex flex-col fixed h-screen" style={{ backgroundColor: '#FFFFFF', width: '270px', top: 0, height: '100vh', zIndex: 100 }}>
        {/* Header */}
        <div className="px-3 flex items-center gap-3" style={{ height: '64px' }}>
          <svg width="24" height="24" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shapeRendering="geometricPrecision"/>
          </svg>
          <div className="relative flex-1" ref={dropdownRef}>
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors flex items-center justify-between w-full text-left"
            >
              <span className="truncate">{displayTitle}</span>
              <svg
                className={`w-4 h-4 flex-shrink-0 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showProjectDropdown && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* Settings */}
                <button
                  onClick={() => {
                    setShowProjectDropdown(false);
                    navigate('/settings');
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                    currentPage === 'settings'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>

                <div className="border-t border-gray-200 my-2"></div>

                {/* Projects List */}
                <div className="px-4 py-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">Your Projects</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {allProjects && allProjects.length > 0 ? (
                    allProjects
                      .sort((a, b) => {
                        const aTime = a.lastOpened?.toMillis?.() || 0;
                        const bTime = b.lastOpened?.toMillis?.() || 0;
                        return bTime - aTime;
                      })
                      .map((proj) => (
                        <button
                          key={proj.id}
                          onClick={() => {
                            handleProjectSwitch(proj.id);
                            setShowProjectDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            proj.id === projectId
                              ? 'bg-gray-100 text-gray-900 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="truncate">{proj.name}</div>
                        </button>
                      ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      {allProjects ? 'No projects found' : 'Loading projects...'}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 my-2"></div>

                {/* Create New Agreement */}
                <button
                  onClick={() => {
                    handleCreateProject();
                    setShowProjectDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create new agreement
                </button>

                <div className="border-t border-gray-200 my-2"></div>

                {/* Contact Us */}
                <a
                  href="mailto:hello@cherrytree.so"
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  onClick={() => setShowProjectDropdown(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact us
                </a>

                {/* Sign Out */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col">
          {children}
        </div>

        {/* Bottom Section */}
        {bottomSection && (
          <div className="p-3 space-y-2 border-t border-gray-200">
            {bottomSection}
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
    </>
  );
}

export default SurveyNavigation;

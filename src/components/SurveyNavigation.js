import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import PaymentModal from './PaymentModal';

function SurveyNavigation({
  displayTitle, // What to show in the header (user name or project name)
  children, // The navigation items (sections/settings tabs)
  bottomSection, // Optional bottom section content
  currentPage = 'survey', // 'survey' or 'settings'
  projectId = null, // Current project ID if on survey page
  allProjects: providedProjects = null, // Optional: pre-fetched projects
  onProjectSwitch: providedOnProjectSwitch = null, // Optional: custom project switch handler
  onCreateProject: providedOnCreateProject = null, // Optional: custom create project handler
  hideUpgrade = false // Optional: hide the upgrade button
}) {
  const navigate = useNavigate();
  const [fetchedProjects, setFetchedProjects] = useState([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
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
          where('ownerId', '==', user.uid),
          limit(100)
        );
        const ownedSnapshot = await getDocs(ownedQuery);

        // Query 2: Projects where user is a collaborator
        const collaboratorQuery = query(
          projectsRef,
          where('collaboratorIds', 'array-contains', user.uid),
          limit(100)
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

  // Fetch user's current plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserPlan(userSnap.data().plan || null);
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };

    fetchUserPlan();
  }, []);

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

  const handleLogout = () => {
    // Set flag to prevent ProtectedRoute from intercepting
    sessionStorage.setItem('isLoggingOut', 'true');

    const isProduction = window.location.hostname.includes('cherrytree.app');
    const targetUrl = isProduction ? 'https://cherrytree.app' : 'http://localhost:3000';

    // Sign out (will trigger React re-renders but flag prevents redirect)
    signOut(auth).catch(err => console.error('Error signing out:', err));

    // Then redirect (page will unload and clear sessionStorage)
    window.location.replace(targetUrl);
  };

  return (
    <>
      <div className="border-r border-gray-200 flex flex-col fixed h-screen" style={{ backgroundColor: '#FFFFFF', width: '270px', top: 0, height: '100vh', zIndex: 100 }}>
        {/* Header */}
        <div className="px-3 flex items-center gap-3" style={{ height: '64px' }}>
          <svg width="24" height="24" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shapeRendering="geometricPrecision"/>
          </svg>
          <div className="flex-1">
            <span className="text-lg font-semibold text-gray-900 truncate block">
              {displayTitle}
            </span>
          </div>
        </div>

        {/* Main Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4 flex flex-col">
          {children}
        </div>

        {/* Upgrade Button */}
        {!hideUpgrade && (
          <div className="px-3 pb-1">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="text-left px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-200 flex items-center text-gray-600"
              style={{ width: '100%', fontSize: '15px' }}
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 text-gray-500" style={{ fontSize: '15px' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <span className="nav-link-underline">Upgrade your plan</span>
              </div>
            </button>
          </div>
        )}

        {/* Dashboard Button */}
        <div className="px-3 pb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-left px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-200 flex items-center text-gray-600"
            style={{ width: '100%', fontSize: '15px' }}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 text-gray-500" style={{ fontSize: '15px' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              <span className="nav-link-underline">Back to dashboard</span>
            </div>
          </button>
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
          currentPlan={userPlan}
          projectName={displayTitle}
        />
      )}
    </>
  );
}

export default SurveyNavigation;

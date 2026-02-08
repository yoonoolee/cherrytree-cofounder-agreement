import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentModal from './PaymentModal';
import UpgradeModal from './UpgradeModal';
import { SECTION_ORDER, SECTIONS as SECTION_CONFIG } from '../config/sectionConfig';
import { useProjectSync } from '../hooks/useProjectSync';
import { useAutoSave } from '../hooks/useAutoSave';
import { useValidation } from '../hooks/useValidation';
import { useUser } from '../contexts/UserContext';

/**
 * Self-contained navigation component with all hooks and logic.
 * Used identically on both Survey and Preview pages.
 */
function SurveyNavigation({
  projectId, // Required: Current project ID
  currentSection, // Required: Current active section ID
  onSectionClick, // Required: Handler for section clicks
  onReviewAndApproveClick, // Required: Handler for Review and Approve button
  allProjects = [], // Optional: All projects for switching
  onProjectSwitch = null, // Optional: Project switch handler
  onCreateProject = null, // Optional: Create project handler
  isMobileNavOpen = false, // Mobile nav state from parent
  setIsMobileNavOpen = () => {}, // Mobile nav setState from parent
}) {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // All data hooks live here - no duplication in parent components
  const isSavingRef = useRef(false);
  const { project, lastSaved } = useProjectSync(projectId, isSavingRef);
  const { saveStatus, lastSaved: autoSaveLastSaved } = useAutoSave(projectId, project, currentUser);
  const { calculateProgress, isSectionCompleted } = useValidation(project?.surveyData || {}, project);

  const handlePaymentSuccess = (newProjectId) => {
    setShowPaymentModal(false);
    if (newProjectId) {
      navigate(`/survey/${newProjectId}`);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-[99]"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Mobile Hamburger Button - Only show when nav is closed */}
      {!isMobileNavOpen && (
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="md:hidden fixed top-4 left-4 z-[101] p-2 bg-white rounded-lg shadow-md border border-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <div
        className={`border-r border-gray-200 flex flex-col fixed h-screen transition-transform duration-300 md:translate-x-0 bg-white w-[270px] top-0 z-[100] ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-3 flex items-center gap-3 justify-between h-16">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <svg width="24" height="24" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shapeRendering="geometricPrecision"/>
            </svg>
            <div className="flex-1 min-w-0">
              <span className="text-lg font-semibold text-gray-900 truncate block">
                {project?.name || 'Loading...'}
              </span>
              {project?.currentPlan && (
                <span className={`text-xs font-medium ${project.currentPlan === 'pro' ? 'text-purple-600' : 'text-gray-500'}`}>
                  {project.currentPlan === 'pro' ? 'Pro' : 'Starter'}
                </span>
              )}
            </div>
          </div>

          {/* Close button - only on mobile */}
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4 flex flex-col">
          {/* Progress Bar - always shown */}
          {calculateProgress && (
            <div className="px-2 pb-2">
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-600">Progress</span>
              </div>
              <div className="pl-2 pr-3">
                <div className="flex justify-end items-center mb-2">
                  <span className="text-xs font-medium text-gray-600">{calculateProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-black h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 pl-2" style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                {saveStatus === 'saving' && (
                  <span className="text-xs text-gray-500">Saving...</span>
                )}
                {saveStatus === 'saved' && (autoSaveLastSaved || lastSaved) && (
                  <span className="text-xs text-gray-500">
                    Saved at {(autoSaveLastSaved || lastSaved).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-xs text-red-950">Error saving</span>
                )}
              </div>
            </div>
          )}

          {/* Section Navigation - always shown */}
          {currentSection !== null && (
            <div className="flex-1 overflow-y-auto pb-3 px-1 pt-4 flex flex-col">
              <div>
                <div className="px-2 mb-2">
                  <span className="text-xs font-medium text-gray-600">Sections</span>
                </div>
                {SECTION_ORDER.map((sectionId, index) => {
                  const sectionConfig = SECTION_CONFIG[sectionId];
                  const isCompleted = isSectionCompleted ? isSectionCompleted(sectionId) : false;
                  return (
                    <button
                      key={sectionId}
                      data-section-id={sectionId}
                      onClick={() => {
                        onSectionClick(sectionId);
                        setIsMobileNavOpen(false);
                      }}
                      className={`text-left px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-200 flex items-center justify-between ${
                        currentSection === sectionId
                          ? 'text-black font-semibold'
                          : 'text-gray-600'
                      }`}
                      style={{ width: '100%', fontSize: '15px' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center justify-center w-6 h-6 ${
                          currentSection === sectionId
                            ? 'font-medium'
                            : ''
                        } text-gray-500`} style={{ fontSize: '15px' }}>
                          {isCompleted ? (
                            <svg width="16" height="16" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                              <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shapeRendering="geometricPrecision"/>
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span className="nav-link-underline">{sectionConfig.displayName}</span>
                      </div>
                    </button>
                  );
                })}

                <div className="px-2 py-3 mt-2">
                  <div className="border-t border-gray-300"></div>
                  <div className="text-xs font-medium text-gray-600 mt-3">Final</div>
                </div>

                {/* Review and Approve Button - always shown */}
                {(() => {
                  const allSectionsComplete = isSectionCompleted
                    ? SECTION_ORDER.every(sectionId => isSectionCompleted(sectionId))
                    : false;
                  const isActive = currentSection === 'generated-agreement';

                  return (
                    <button
                      onClick={() => {
                        if (allSectionsComplete) {
                          onReviewAndApproveClick();
                          setIsMobileNavOpen(false);
                        }
                      }}
                      disabled={!allSectionsComplete}
                      className={`text-left px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-200 flex items-center justify-between ${
                        isActive && allSectionsComplete
                          ? 'text-black font-semibold'
                          : allSectionsComplete
                          ? 'text-gray-600'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      style={{ width: '100%', fontSize: '15px' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center justify-center w-6 h-6 ${allSectionsComplete ? 'text-gray-500' : 'text-gray-300'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <span className="nav-link-underline">Review and Approve</span>
                      </div>
                    </button>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Button - shown unless pro plan */}
        {project?.currentPlan !== 'pro' && (
          <div className="px-3 pb-1">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-left px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-200 flex items-center text-gray-600"
              style={{ width: '100%', fontSize: '15px' }}
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <span className="nav-link-underline">Upgrade</span>
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
              <span className="flex items-center justify-center w-6 h-6 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </span>
              <span className="nav-link-underline">Back to dashboard</span>
            </div>
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={project?.currentPlan || 'starter'}
        />
      )}
    </>
  );
}

export default SurveyNavigation;

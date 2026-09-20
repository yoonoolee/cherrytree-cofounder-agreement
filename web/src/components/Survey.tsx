import { useState, useEffect, useRef, type ComponentType } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoadScript, type Libraries } from '@react-google-maps/api';
import { updateDoc, type UpdateData } from 'firebase/firestore';
import { useAuth, UserButton } from '@clerk/clerk-react';
import {
  SECTION_IDS,
  SECTION_ORDER,
  getNextSection,
  isLastSection,
  isSectionId,
  type Project,
  type SectionId,
} from '@cherrytree/shared';

import { env } from '../lib/env.ts';
import { projectRef } from '../lib/firebase.ts';
import { useUser } from '../hooks/useUser.ts';
import { useAutoSave } from '../hooks/useAutoSave.ts';
import { useProjectSync } from '../hooks/useProjectSync.ts';
import { useValidation } from '../hooks/useValidation.ts';
import { isProjectReadOnly } from '../utils/dateUtils.ts';
import SectionFormation from './SectionFormation.tsx';
import SectionCofounders from './SectionCofounders.tsx';
import SectionEquityAllocation from './SectionEquityAllocation.tsx';
import SectionDecisionMaking from './SectionDecisionMaking.tsx';
import SectionEquityVesting from './SectionEquityVesting.tsx';
import SectionIP from './SectionIP.tsx';
import SectionCompensation from './SectionCompensation.tsx';
import SectionPerformance from './SectionPerformance.tsx';
import SectionNonCompete from './SectionNonCompete.tsx';
import SectionFinal from './SectionFinal.tsx';
import CollaboratorsModal from './CollaboratorsModal.tsx';
import SurveyNavigation from './SurveyNavigation.tsx';
import WelcomePopup from './WelcomePopup.tsx';
import type { SurveySectionProps } from './sectionProps.ts';

const libraries: Libraries = ['places'];

const SECTION_COMPONENTS: Record<SectionId, ComponentType<SurveySectionProps>> = {
  [SECTION_IDS.FORMATION]: SectionFormation,
  [SECTION_IDS.COFOUNDERS]: SectionCofounders,
  [SECTION_IDS.EQUITY_ALLOCATION]: SectionEquityAllocation,
  [SECTION_IDS.VESTING]: SectionEquityVesting,
  [SECTION_IDS.DECISION_MAKING]: SectionDecisionMaking,
  [SECTION_IDS.IP]: SectionIP,
  [SECTION_IDS.COMPENSATION]: SectionCompensation,
  [SECTION_IDS.PERFORMANCE]: SectionPerformance,
  [SECTION_IDS.NON_COMPETITION]: SectionNonCompete,
  [SECTION_IDS.GENERAL_PROVISIONS]: SectionFinal,
};

/** Marks one user's onboarding flag without touching the other users' entries. */
const onboardingUpdate = (userId: string, completed: boolean): UpdateData<Project> => ({
  [`onboardingCompleted.${userId}`]: completed,
});

interface SurveyProps {
  projectId: string;
  /** Leave for the Review & Approve page. */
  onPreview: () => void;
  /** Leave for the Final Agreement page. */
  onFinalAgreement: () => void;
}

function Survey({ projectId, onPreview, onFinalAgreement }: SurveyProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, setActive, userMemberships, orgsLoaded } = useUser();
  const { orgId } = useAuth();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: env.googleMapsApiKey, libraries });

  // UI state
  const [currentSection, setCurrentSection] = useState<SectionId>(SECTION_IDS.FORMATION);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Custom hooks for managing survey state and logic
  const isSavingRef = useRef(false);
  const { project, formData, setFormData, accessDenied, lastSaved } = useProjectSync(
    projectId,
    isSavingRef,
  );
  const {
    saveStatus,
    lastSaved: autoSaveLastSaved,
    saveFormData,
    createChangeHandler,
  } = useAutoSave(projectId, project, currentUser, isSavingRef);
  const { isSectionCompleted } = useValidation(formData, project);
  const handleChange = createChangeHandler(setFormData);

  // Read section from URL query parameter or default to Formation
  useEffect(() => {
    const sectionFromUrl = searchParams.get('section');
    setCurrentSection(isSectionId(sectionFromUrl) ? sectionFromUrl : SECTION_IDS.FORMATION);
  }, [projectId, searchParams]);

  // Show welcome popup on first visit per user per project
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (project && currentUser) {
        const hasCompletedOnboarding = project.onboardingCompleted?.[currentUser.id];

        // If user is not in onboardingCompleted map at all, add them with false
        if (hasCompletedOnboarding === undefined) {
          try {
            await updateDoc(projectRef(projectId), onboardingUpdate(currentUser.id, false));
          } catch (error) {
            console.error('Error initializing onboarding status:', error);
          }
        }

        // Show popup if they haven't completed onboarding
        if (hasCompletedOnboarding === false || hasCompletedOnboarding === undefined) {
          setShowWelcomePopup(true);
        }
      }
    };

    void initializeOnboarding();
  }, [project, currentUser, projectId]);

  const dismissWelcomePopup = async () => {
    setShowWelcomePopup(false);

    // Mark onboarding as completed for this user on this project
    if (currentUser) {
      try {
        await updateDoc(projectRef(projectId), onboardingUpdate(currentUser.id, true));
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
  };

  // Automatically switch to the project's organization (projectId === clerkOrgId)
  useEffect(() => {
    const switchToProjectOrg = async () => {
      // Wait for Clerk to load organization data
      if (!orgsLoaded || !projectId || !setActive || !userMemberships) {
        return;
      }

      // Check if we're already in the right org
      if (orgId === projectId) {
        return;
      }

      // Find the membership for this project's org
      const membership = userMemberships.data?.find((m) => m.organization.id === projectId);

      if (membership) {
        try {
          await setActive({ organization: projectId });
        } catch (error) {
          console.error('Error switching organization:', error);
        }
      }
    };

    void switchToProjectOrg();
  }, [projectId, orgId, setActive, userMemberships, orgsLoaded]);

  // Project sync, auto-save, and validation are now handled by custom hooks
  // See: useProjectSync, useAutoSave, useValidation

  // Check if survey should be read-only (logic in dateUtils.ts)
  const isReadOnly = isProjectReadOnly(project);

  // Show a section and mirror it in the URL
  const goToSection = (sectionId: SectionId) => {
    setCurrentSection(sectionId);
    setSearchParams({ section: sectionId });
  };

  // Find first incomplete section
  const findFirstIncompleteSection = (): SectionId | null => {
    for (const sectionId of SECTION_ORDER) {
      if (!isSectionCompleted(sectionId)) {
        return sectionId;
      }
    }
    return null;
  };

  // Handle preview/submit click
  const handlePreviewClick = async () => {
    // Save immediately before preview
    await saveFormData(formData);

    // Check if all sections are complete
    const firstIncompleteSection = findFirstIncompleteSection();
    if (firstIncompleteSection) {
      setShowValidation(true);
      goToSection(firstIncompleteSection);

      // After section loads, scroll to first validation error
      setTimeout(() => {
        const firstError = document.querySelector('.text-red-700, .validation-error');
        if (firstError) {
          // Find the closest parent question container
          const questionContainer = firstError.closest('div');
          if (questionContainer) {
            questionContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    } else {
      onPreview();
    }
  };

  // Show access denied message if user doesn't have permission
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-sm text-gray-600 mb-6">
              You do not have permission to access this project. Please contact the project owner to
              grant you access. If this is an error, please contact hello@cherrytree.app for
              support.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner while waiting for project data
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const savedAt = autoSaveLastSaved || lastSaved;
  const CurrentSection = SECTION_COMPONENTS[currentSection];

  return (
    <div className="min-h-screen flex survey-bg">
      {/* Welcome Popup */}
      <WelcomePopup isOpen={showWelcomePopup} onClose={dismissWelcomePopup} />

      {/* Top Header */}
      <div
        className="fixed top-0 left-0 right-0 h-16 flex items-center gap-4 px-4 md:pl-[262px] md:pr-[52px]"
        style={{ zIndex: 50, background: 'var(--ct-bg)', fontFamily: "'Outfit', sans-serif" }}
      >
        {/* Back to Dashboard + Save Status */}
        <div className="flex items-center" style={{ gap: '14px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 300,
              color: '#666',
              fontFamily: 'Outfit, sans-serif',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
          >
            ← Back to Dashboard
          </button>
          {saveStatus === 'saving' && (
            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 300 }}>Saving...</span>
          )}
          {saveStatus === 'saved' && savedAt && (
            <span style={{ fontSize: '11px', color: '#4B7263', fontWeight: 300 }}>
              Saved{' '}
              {savedAt.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: '11px', color: '#b97070', fontWeight: 300 }}>
              Error saving
            </span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Avatar */}
        <UserButton appearance={{ elements: { avatarBox: 'w-[34px] h-[34px]' } }} />
      </div>

      {/* Sidebar Navigation - self-contained with all hooks */}
      <SurveyNavigation
        projectId={projectId}
        currentSection={currentSection}
        onSectionClick={goToSection}
        onReviewAndApproveClick={onPreview}
        onFinalAgreementClick={onFinalAgreement}
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
        onManageCollaborators={() => setShowCollaborators(true)}
      />

      {/* Collaborators Modal */}
      {showCollaborators && (
        <CollaboratorsModal project={project} onClose={() => setShowCollaborators(false)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto md:ml-[210px] mt-16 survey-bg">
        <div className="px-4 md:px-[52px] pt-7 pb-[60px]" key={currentSection}>
          {/* Section Content (Formation waits for the Google Maps script) */}
          <div className="animate-fade-down">
            {currentSection === SECTION_IDS.FORMATION && !isLoaded ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <CurrentSection
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
                project={project}
              />
            )}
          </div>

          {/* Next Button */}
          {!isReadOnly && (
            <div className="mt-16 flex justify-end">
              {!isLastSection(currentSection) ? (
                <button
                  onClick={() => {
                    const nextSection = getNextSection(currentSection);
                    if (nextSection) {
                      goToSection(nextSection);
                    }
                  }}
                  style={{
                    background: '#4B7263',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 400,
                    fontFamily: 'Outfit, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#3d5f52')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#4B7263')}
                >
                  Continue
                  <svg
                    width="16"
                    height="13"
                    viewBox="0 0 20 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 8L18 8M18 8L12 2M18 8L12 14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handlePreviewClick}
                  disabled={saveStatus === 'saving'}
                  style={{
                    background: '#4B7263',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 400,
                    fontFamily: 'Outfit, sans-serif',
                    cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s',
                    opacity: saveStatus === 'saving' ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (saveStatus !== 'saving') e.currentTarget.style.background = '#3d5f52';
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#4B7263')}
                >
                  Review &amp; Approve
                  <svg
                    width="16"
                    height="13"
                    viewBox="0 0 20 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 8L18 8M18 8L12 2M18 8L12 14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Help Button */}
      <button
        onClick={() => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 })}
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-500 hover:border-gray-300 hover:shadow-md transition-all z-50"
      >
        <span className="text-sm font-medium">?</span>
      </button>
    </div>
  );
}

export default Survey;

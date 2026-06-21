import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '@clerk/clerk-react';
import { SECTION_IDS, SECTION_ORDER, SECTIONS as SECTION_CONFIG, getNextSection, isLastSection } from '../config/sectionConfig';
import { getQuestionsBySection } from '../config/questionConfig';
import { useAutoSave } from '../hooks/useAutoSave';
import { useProjectSync } from '../hooks/useProjectSync';
import { useValidation } from '../hooks/useValidation';
import { isProjectReadOnly } from '../utils/dateUtils';
import SectionFormation from './SectionFormation';
import SectionCofounders from './SectionCofounders';
import SectionEquityAllocation from './SectionEquityAllocation';
import SectionDecisionMaking from './SectionDecisionMaking';
import SectionEquityVesting from './SectionEquityVesting';
import SectionIP from './SectionIP';
import SectionCompensation from './SectionCompensation';
import SectionPerformance from './SectionPerformance';
import SectionNonCompete from './SectionNonCompete';
import SectionFinal from './SectionFinal';
import CollaboratorManager from './CollaboratorManager';
import SurveyNavigation from './SurveyNavigation';
import WelcomePopup from './WelcomePopup';

const libraries = ['places'];

function Survey({ projectId, allProjects = [], onProjectSwitch, onPreview, onFinalAgreement, onCreateProject }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, setActive, userMemberships, orgsLoaded } = useUser();
  const { orgId } = useAuth();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // UI state
  const [currentSection, setCurrentSection] = useState(SECTION_IDS.FORMATION);
  const section3Ref = useRef(null);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [section3InResultsView, setSection3InResultsView] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Custom hooks for managing survey state and logic
  const isSavingRef = useRef(false);
  const { project, formData, setFormData, accessDenied, lastSaved } = useProjectSync(projectId, isSavingRef);
  const { saveStatus, lastSaved: autoSaveLastSaved, saveFormData, createChangeHandler } = useAutoSave(projectId, project, currentUser);
  const { isSectionCompleted } = useValidation(formData, project);
  const handleChange = createChangeHandler(setFormData);

  // Read section from URL query parameter or default to Formation
  useEffect(() => {
    const sectionFromUrl = searchParams.get('section');
    const validSection = SECTION_ORDER.includes(sectionFromUrl) ? sectionFromUrl : SECTION_IDS.FORMATION;
    setCurrentSection(validSection);
    setSection3InResultsView(false);
  }, [projectId, searchParams]);


  // Reset section3InResultsView when leaving equity allocation section
  useEffect(() => {
    if (currentSection !== SECTION_IDS.EQUITY_ALLOCATION) {
      setSection3InResultsView(false);
    }
  }, [currentSection]);

  // Show welcome popup on first visit per user per project
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (project && currentUser) {
        const hasCompletedOnboarding = project.onboardingCompleted?.[currentUser.id];

        // If user is not in onboardingCompleted map at all, add them with false
        if (hasCompletedOnboarding === undefined) {
          try {
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
              [`onboardingCompleted.${currentUser.id}`]: false
            });
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

    initializeOnboarding();
  }, [project, currentUser, projectId]);

  const dismissWelcomePopup = async () => {
    setShowWelcomePopup(false);

    // Mark onboarding as completed for this user on this project
    if (currentUser) {
      try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
          [`onboardingCompleted.${currentUser.id}`]: true
        });
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
      const membership = userMemberships.data?.find(
        m => m.organization.id === projectId
      );

      if (membership) {
        try {
          await setActive({ organization: projectId });
        } catch (error) {
          console.error('Error switching organization:', error);
        }
      }
    };

    switchToProjectOrg();
  }, [projectId, orgId, setActive, userMemberships, orgsLoaded]);

  // Project sync, auto-save, and validation are now handled by custom hooks
  // See: useProjectSync, useAutoSave, useValidation

  // Check if survey should be read-only (logic in dateUtils.js)
  const isReadOnly = isProjectReadOnly(project);

  // Find first incomplete section
  const findFirstIncompleteSection = () => {
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

    // Wait for any pending saves to complete
    if (saveStatus === 'saving') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Check if all sections are complete
    const firstIncompleteSection = findFirstIncompleteSection();
    if (firstIncompleteSection) {
      setShowValidation(true);
      // Simulate clicking the section button
      const sectionButton = document.querySelector(`[data-section-id="${firstIncompleteSection}"]`);
      if (sectionButton) {
        sectionButton.click();
      }

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

  // Auto-generate search data from questionConfig
  const SEARCH_DATA = React.useMemo(() => {
    return SECTION_ORDER.map((sectionId, index) => {
      const sectionConfig = SECTION_CONFIG[sectionId];
      const questions = getQuestionsBySection(sectionId);

      // Extract all questions (text only, not nested/acknowledgment fields)
      const questionTexts = questions
        .filter(q => !q.nested && q.type !== 'custom')
        .map(q => q.question);

      // Extract all answer options (static answers only)
      const answers = questions
        .filter(q => q.options && Array.isArray(q.options))
        .flatMap(q => q.options)
        .filter((value, index, self) => self.indexOf(value) === index); // Dedupe

      return {
        id: index + 1, // Keep numeric ID for backwards compatibility with rendering
        sectionId: sectionId, // Add section ID for future use
        name: sectionConfig.displayName,
        questions: questionTexts,
        answers: answers
      };
    });
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    SEARCH_DATA.forEach(section => {
      const sectionNameMatches = section.name.toLowerCase().includes(lowerQuery);
      const matchingQuestions = section.questions.filter(q =>
        q.toLowerCase().includes(lowerQuery)
      );
      const matchingAnswers = (section.answers || []).filter(a =>
        a.toLowerCase().includes(lowerQuery)
      );

      // If section name matches, add the section itself (highest priority)
      if (sectionNameMatches && matchingQuestions.length === 0 && matchingAnswers.length === 0) {
        results.push({
          id: section.id,
          name: section.name,
          type: 'section'
        });
      }

      // Add each matching question as a separate result
      matchingQuestions.forEach(question => {
        results.push({
          id: section.id,
          name: section.name,
          question: question,
          type: 'question'
        });
      });

      // Add each matching answer as a separate result (lower priority)
      matchingAnswers.forEach(answer => {
        results.push({
          id: section.id,
          name: section.name,
          answer: answer,
          type: 'answer'
        });
      });
    });

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleSearchResultClick = (resultId) => {
    // resultId is the numeric id from SEARCH_DATA, need to convert to sectionId
    const sectionId = SECTION_ORDER[resultId - 1];
    setCurrentSection(sectionId);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Show access denied message if user doesn't have permission
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              You do not have permission to access this project. Please contact the project owner to grant you access. If this is an error, please contact hello@cherrytree.app for support.
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

  return (
    <div className="min-h-screen flex survey-bg">

      {/* Welcome Popup */}
      <WelcomePopup isOpen={showWelcomePopup} onClose={dismissWelcomePopup} />

      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 h-16 flex items-center gap-4 px-4 md:pl-[262px] md:pr-[52px]" style={{ zIndex: 50, background: 'var(--ct-bg)', fontFamily: "'Outfit', sans-serif" }}>
        {/* Back to Dashboard + Save Status */}
        <div className="flex items-center" style={{ gap: '14px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 300, color: '#666',
              fontFamily: 'Outfit, sans-serif', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.color = '#666'}
          >
            ← Back to Dashboard
          </button>
          {saveStatus === 'saving' && (
            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 300 }}>Saving...</span>
          )}
          {saveStatus === 'saved' && (autoSaveLastSaved || lastSaved) && (
            <span style={{ fontSize: '11px', color: '#4B7263', fontWeight: 300 }}>
              Saved {(autoSaveLastSaved || lastSaved).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: '11px', color: '#b97070', fontWeight: 300 }}>Error saving</span>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center items-center">
        <div className="max-w-lg w-full relative" style={{ maxWidth: '512px' }}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={(e) => {
                if (searchQuery) setShowSearchResults(true);
              }}
              onBlur={(e) => {
                setTimeout(() => setShowSearchResults(false), 200);
              }}
              className="w-full text-sm transition text-gray-500 placeholder-gray-500 bg-gray-100 focus:bg-gray-200 rounded-lg border-none pl-10 pr-4 py-2 outline-none"
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-[9999]">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.id}-${index}`}
                  onClick={() => handleSearchResultClick(result.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition text-sm border-b border-gray-100 last:border-b-0"
                >
                  {result.type === 'section' ? (
                    <span className="font-medium text-gray-900">{result.name}</span>
                  ) : result.type === 'question' ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-900">{result.question}</span>
                      <span className="text-xs text-gray-500">{result.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-900">{result.answer}</span>
                      <span className="text-xs text-gray-500">{result.name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]">
              <p className="text-sm text-gray-500">No results found</p>
            </div>
          )}
        </div>
        </div>

        {/* Avatar */}
        <div
          style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: '#ccc9c0', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
          </svg>
        </div>

      </div>

      {/* Sidebar Navigation - self-contained with all hooks */}
      <SurveyNavigation
        projectId={projectId}
        currentSection={currentSection}
        onSectionClick={(sectionId) => {
          setCurrentSection(sectionId);
          setSearchParams({ section: sectionId });
        }}
        onReviewAndApproveClick={onPreview}
        onFinalAgreementClick={onFinalAgreement}
        allProjects={allProjects}
        onProjectSwitch={onProjectSwitch}
        onCreateProject={onCreateProject}
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
        onManageCollaborators={() => setShowCollaborators(true)}
      />

      {/* Collaborators Modal */}
      {showCollaborators && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" style={{ zIndex: 10000 }} onClick={() => setShowCollaborators(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10001, background: '#F6F3EE', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '90vw', maxWidth: '480px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif' }}>
            <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #d6d2c9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '22px', fontWeight: 400, color: '#1a1a1a' }}>Collaborators</h3>
              <button onClick={() => setShowCollaborators(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '22px 26px 26px' }}>
              <CollaboratorManager project={{ ...project, id: projectId }} />
            </div>
          </div>
        </>
      )}


      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto md:ml-[210px] mt-16 survey-bg">
        <div className="px-4 md:px-[52px] pt-7 pb-[60px]" key={currentSection}>
          {/* Section Content */}
          {currentSection === SECTION_IDS.FORMATION && (
            <div className="animate-fade-down">
              {isLoaded ? (
                <SectionFormation
                  formData={formData}
                  handleChange={handleChange}
                  isReadOnly={isReadOnly}
                  showValidation={showValidation}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading...</p>
                </div>
              )}
            </div>
          )}
          {currentSection === SECTION_IDS.COFOUNDERS && (
            <div className="animate-fade-down">
              <SectionCofounders
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
                project={project}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.EQUITY_ALLOCATION && (
            <div className="animate-fade-down">
              <SectionEquityAllocation
                ref={section3Ref}
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
                onViewModeChange={setSection3InResultsView}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.VESTING && (
            <div className="animate-fade-down">
              <SectionEquityVesting
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.DECISION_MAKING && (
            <div className="animate-fade-down">
              <SectionDecisionMaking
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.IP && (
            <div className="animate-fade-down">
              <SectionIP
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.COMPENSATION && (
            <div className="animate-fade-down">
              <SectionCompensation
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
                project={project}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.PERFORMANCE && (
            <div className="animate-fade-down">
              <SectionPerformance
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.NON_COMPETITION && (
            <div className="animate-fade-down">
              <SectionNonCompete
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.GENERAL_PROVISIONS && (
            <div className="animate-fade-down">
              <SectionFinal
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}

          {/* Next Button */}
          {!isReadOnly && (
            <div className="mt-16 flex justify-end">
              {!isLastSection(currentSection) ? (
                <button
                  onClick={() => {
                    // If on Equity Allocation section
                    if (currentSection === SECTION_IDS.EQUITY_ALLOCATION) {
                      // If in results view, proceed to next section
                      if (section3InResultsView) {
                        const nextSection = getNextSection(currentSection);
                        if (nextSection) {
                          setCurrentSection(nextSection);
                          setSearchParams({ section: nextSection });
                        }
                        return;
                      }
                      // If in edit view, submit the calculator first
                      if (section3Ref.current) {
                        const submitted = section3Ref.current.submitEquityCalculator();
                        // Only proceed if submission was successful
                        if (submitted === false) {
                          // Submission failed validation, stay on this section
                          return;
                        }
                        // Don't move to next section - the submit will show results view
                        return;
                      }
                    }
                    // For other sections, proceed normally
                    const nextSection = getNextSection(currentSection);
                    if (nextSection) {
                      setCurrentSection(nextSection);
                      setSearchParams({ section: nextSection });
                    }
                  }}
                  style={{ background: '#4B7263', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 400, fontFamily: 'Outfit, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#3d5f52'}
                  onMouseLeave={e => e.currentTarget.style.background = '#4B7263'}
                >
                  Continue
                  <svg width="16" height="13" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handlePreviewClick}
                  disabled={saveStatus === 'saving'}
                  style={{ background: '#4B7263', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 400, fontFamily: 'Outfit, sans-serif', cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.15s', opacity: saveStatus === 'saving' ? 0.5 : 1 }}
                  onMouseEnter={e => { if (saveStatus !== 'saving') e.currentTarget.style.background = '#3d5f52'; }}
                  onMouseLeave={e => e.currentTarget.style.background = '#4B7263'}
                >
                  Review &amp; Approve
                  <svg width="16" height="13" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

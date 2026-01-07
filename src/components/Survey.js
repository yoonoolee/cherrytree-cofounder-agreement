import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useAuth, useOrganizationList } from '@clerk/clerk-react';
import { SECTIONS, INDUSTRIES, MAJOR_DECISIONS, TERMINATION_CONSEQUENCES, US_STATES } from './surveyConstants';
import { useAutoSave } from '../hooks/useAutoSave';
import { useProjectSync } from '../hooks/useProjectSync';
import { useValidation } from '../hooks/useValidation';
import Section1Formation from './Section1Formation';
import Section2Cofounders from './Section2Cofounders';
import Section3EquityAllocation from './Section3EquityAllocation';
import Section4DecisionMaking from './Section4DecisionMaking';
import Section5EquityVesting from './Section5EquityVesting';
import Section6IP from './Section6IP';
import Section7Compensation from './Section7Compensation';
import Section8Performance from './Section8Performance';
import Section9NonCompete from './Section9NonCompete';
import Section10Final from './Section10Final';
import CollaboratorManager from './CollaboratorManager';
import SurveyNavigation from './SurveyNavigation';

const libraries = ['places'];

function Survey({ projectId, allProjects = [], onProjectSwitch, onPreview, onCreateProject }) {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { getToken, orgId } = useAuth();
  const { setActive, userMemberships, isLoaded: orgsLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true // Enable fetching user memberships
    }
  });
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // UI state
  const [currentSection, setCurrentSection] = useState(0);
  const section3Ref = useRef(null);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [section3InResultsView, setSection3InResultsView] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(1);
  const [welcomeWiggle, setWelcomeWiggle] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Helper function to calculate fullMailingAddress
  const calculateFullMailingAddress = (addressData) => {
    const { mailingStreet, mailingStreet2, mailingCity, mailingState, mailingZip } = addressData;

    let fullAddress = '';
    if (mailingStreet) {
      fullAddress = mailingStreet;
      if (mailingStreet2) {
        fullAddress += '\n' + mailingStreet2;
      }
      if (mailingCity || mailingState || mailingZip) {
        fullAddress += '\n' + [mailingCity, mailingState, mailingZip].filter(Boolean).join(', ');
      }
    }
    return fullAddress;
  };

  // Custom hooks for managing survey state and logic
  // Note: isSavingRef needs to be created first for useProjectSync
  const isSavingRef = useRef(false);

  // Load project and form data from Firestore
  const { project, formData, setFormData, accessDenied, lastSaved, setLastSaved } = useProjectSync(projectId, isSavingRef, calculateFullMailingAddress);

  // Auto-save functionality
  const { saveStatus, saveFormData, createChangeHandler } = useAutoSave(projectId, project, currentUser);

  // Validation logic
  const { calculateProgress, isSectionCompleted, isOtherFieldValid, isOtherArrayFieldValid } = useValidation(formData, project);

  // Create the handleChange function using the hook
  const handleChange = createChangeHandler(formData, setFormData, calculateFullMailingAddress);

  // Set initial section when project changes - always start at Formation & Purpose
  useEffect(() => {
    setCurrentSection(1);
    setSection3InResultsView(false);
  }, [projectId]);


  // Reset section3InResultsView when leaving section 3
  useEffect(() => {
    if (currentSection !== 3) {
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



  // Automatically switch to the project's organization
  useEffect(() => {
    const switchToProjectOrg = async () => {
      // Wait for Clerk to load organization data
      if (!orgsLoaded || !project?.clerkOrgId || !setActive || !userMemberships) {
        return;
      }

      // Check if we're already in the right org
      if (orgId === project.clerkOrgId) {
        return;
      }

      // Find the membership for this project's org
      const membership = userMemberships.data?.find(
        m => m.organization.id === project.clerkOrgId
      );

      if (membership) {
        try {
          await setActive({ organization: project.clerkOrgId });
        } catch (error) {
          console.error('Error switching organization:', error);
        }
      }
    };

    switchToProjectOrg();
  }, [project?.clerkOrgId, orgId, setActive, userMemberships, orgsLoaded]);

  // Project sync, auto-save, and validation are now handled by custom hooks
  // See: useProjectSync, useAutoSave, useValidation

  const isReadOnly = project?.submitted;

  // Find first incomplete section
  const findFirstIncompleteSection = () => {
    for (let sectionId = 1; sectionId <= 10; sectionId++) {
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

  // Search data mapping sections to their questions and keywords
  const SEARCH_DATA = [
    {
      id: 1,
      name: 'Formation & Purpose',
      questions: [
        "What's your company's name?",
        "What is your company's current or intended legal structure?",
        "What state will your company be registered in?",
        "What's your company mailing address?",
        "Can you describe your company in 1 line?",
        "What industry is it in?"
      ],
      answers: [
        "C-Corp", "S-Corp", "LLC",
        ...INDUSTRIES,
        ...US_STATES.map(s => s.label)
      ]
    },
    {
      id: 2,
      name: 'Cofounder Info',
      questions: [
        "Full Name",
        "Title",
        "Email",
        "Roles & Responsibilities"
      ],
      answers: []
    },
    {
      id: 3,
      name: 'Equity Allocation',
      questions: [
        "Individual Assessments",
        "equity ownership",
        "equity split",
        "ownership percentage"
      ],
      answers: []
    },
    {
      id: 4,
      name: 'Vesting Schedule',
      questions: [
        "What date should the vesting start?",
        "What vesting schedule will you use?",
        "What percent of equity will be vested once the cliff is complete?",
        "Should unvested shares accelerate if the cofounder is terminated and the company is acquired?",
        "If a cofounder wants to sell their shares, how many days notice do they need to provide the Board and shareholders?",
        "If a cofounder resigns, how many days does the company have to buy back the shares?",
        "You acknowledge that if a cofounder dies, becomes permanently disabled, or is otherwise incapacitated, their unvested shares are automatically forfeited and returned to the company",
        "If a cofounder dies, becomes permanently disabled, or is otherwise incapacitated"
      ],
      answers: [
        "4-year with 1-year cliff", "3-year with 1-year cliff", "2-year with 6-month cliff",
        "Single trigger", "Double trigger", "No acceleration",
        "Company has the right to repurchase", "Cofounder can sell to any buyer", "Cofounder can only sell to existing shareholders"
      ]
    },
    {
      id: 5,
      name: 'Decision-Making',
      questions: [
        "Should equity ownership reflect voting power?",
        "If cofounders are deadlocked, how should the tie be resolved?",
        "Do you want to include a shotgun clause if you and your cofounder(s) cannot resolve deadlocks?"
      ],
      answers: [
        ...MAJOR_DECISIONS,
        "Mediation", "Arbitration", "Coin flip", "Third-party advisor", "Majority vote"
      ]
    },
    {
      id: 6,
      name: 'IP & Ownership',
      questions: [
        "Has any cofounder created code, designs, or other assets before joining the company that might be used in the business?",
        "intellectual property assignment",
        "IP ownership"
      ],
      answers: ["Yes", "No"]
    },
    {
      id: 7,
      name: 'Compensation',
      questions: [
        "Are any cofounders currently taking compensation or salary from the company?",
        "Compensation Details",
        "Compensation (USD/year)",
        "What's the spending limit, in USD, before a cofounder needs to check with other cofounders?"
      ],
      answers: ["Yes", "No"]
    },
    {
      id: 8,
      name: 'Performance',
      questions: [
        "What happens if a cofounder fails to meet their agreed-upon obligations (e.g., time commitment, role performance, or deliverables)?",
        "How many days does a cofounder have to fix the issue after receiving written notice before termination can occur?",
        "Which of the following constitutes termination with cause?",
        "How many days is the notice period if a Cofounder wishes to voluntarily leave?"
      ],
      answers: [
        ...TERMINATION_CONSEQUENCES,
        "Breach of fiduciary duty", "Criminal conviction", "Fraud or dishonesty", "Material breach of agreement", "Gross negligence", "Willful misconduct"
      ]
    },
    {
      id: 9,
      name: 'Non-Competition',
      questions: [
        "How long should the non-competition obligation last after a cofounder leaves?",
        "How long should the non-solicitation obligation last after a cofounder leaves?",
        "non-compete agreement",
        "confidentiality"
      ],
      answers: [
        "6 months", "1 year", "2 years", "3 years", "None"
      ]
    },
    {
      id: 10,
      name: 'General Provisions',
      questions: [
        "How should disputes among cofounders be resolved?",
        "Which state's laws will govern this agreement?",
        "How can this agreement be amended or modified?",
        "How often (in months) should this agreement be reviewed by the cofounders?"
      ],
      answers: [
        "Mediation first, then arbitration", "Arbitration only", "Litigation in court",
        "Unanimous consent", "Majority vote", "Board approval"
      ]
    }
  ];

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

  const handleSearchResultClick = (sectionId) => {
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
              You don't have permission to access this project. Please contact the project owner if you believe this is an error.
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#ffffff' }}>

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[9998] cursor-pointer"
            onClick={() => {
              setWelcomeWiggle(true);
              setTimeout(() => setWelcomeWiggle(false), 500);
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
            <div className={`bg-white rounded-lg shadow-xl max-w-lg w-full pt-4 md:pt-8 px-4 md:px-8 pb-2 md:pb-3 pointer-events-auto flex flex-col ${welcomeWiggle ? 'animate-wiggle' : ''}`} style={{ height: '85vh', maxHeight: '500px' }}>
              {/* Step indicators */}
              <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full ${welcomeStep === step ? 'bg-black' : 'bg-gray-300'}`}
                  />
                ))}
              </div>

              {/* Step 1: Video Tutorial */}
              {welcomeStep === 1 && (
                <div className="flex flex-col h-full">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    Welcome to Cherrytree
                  </h2>
                  <p className="text-sm text-gray-600 mb-3 md:mb-4">
                    Add your cofounders as collaborators. They must be added to be included in the Agreement.
                  </p>

                  {/* Add Collaborators Animation */}
                  <div className="relative bg-gray-50 rounded-lg p-2 md:p-5 mb-2 overflow-hidden" style={{ height: 'clamp(180px, 40vh, 240px)', minHeight: '180px', maxHeight: '240px', display: 'block' }}>
                    {/* Cursor */}
                    <div className="collaborator-cursor absolute w-4 h-4 z-30" style={{ pointerEvents: 'none' }}>
                      <svg viewBox="0 0 24 24" fill="black" className="w-4 h-4">
                        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.72a.5.5 0 0 0-.44.49Z"/>
                      </svg>
                    </div>

                    {/* Top bar with Add Collaborators button */}
                    <div className="flex justify-end mb-4">
                      <button className="add-collab-btn text-xs px-3 py-1.5 rounded border border-gray-300 bg-white flex items-center gap-1.5 text-gray-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <span className="font-medium">Add</span>
                      </button>
                    </div>

                    {/* Collaborator Form */}
                    <div className="collab-form bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-3">Add your cofounders as collaborators</p>
                      <div className="flex gap-2 mb-3">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            className="email-input w-full px-2 py-1.5 text-xs border border-gray-200 rounded"
                            readOnly
                          />
                          <span className="typed-email absolute left-2 top-1.5 text-xs text-gray-700"></span>
                          <span className="email-caret absolute left-2 top-1.5 w-px h-3.5 bg-black ml-0"></span>
                        </div>
                        <button className="invite-btn px-3 py-1.5 bg-black text-white text-xs rounded">
                          Invite
                        </button>
                      </div>

                      {/* Members List */}
                      <div className="members-list">
                        <h4 className="text-xs font-semibold text-gray-900 mb-2">Members</h4>
                        <div className="member-item bg-gray-50 rounded p-2">
                          <p className="text-xs font-medium text-gray-900">cofounder@example.com</p>
                          <p className="text-[10px] text-gray-500">
                            <span>Member</span>
                            <span className="mx-1">·</span>
                            <span className="text-black font-medium">Active</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <style>{`
                    /* Initial states */
                    .collab-form {
                      opacity: 0;
                      transform: scale(0.95);
                      animation: formAppear 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                    }

                    .members-list {
                      opacity: 0;
                      animation: membersAppear 6s steps(1) infinite;
                    }

                    .member-item {
                      opacity: 0;
                      transform: translateY(-4px);
                      animation: memberSlideIn 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                    }

                    /* Cursor animation */
                    .collaborator-cursor {
                      animation: cursorMovement 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                    }

                    /* Button click effect */
                    .add-collab-btn {
                      animation: buttonClick 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                    }

                    /* Email typing */
                    .typed-email::after {
                      content: '';
                      animation: typeEmail 6s steps(1) infinite;
                    }

                    .email-caret {
                      animation: caretBlinkEmail 6s step-end infinite;
                    }

                    /* Invite button click */
                    .invite-btn {
                      animation: inviteClick 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                    }

                    @keyframes cursorMovement {
                      0% { top: -20px; left: 50%; opacity: 0; }
                      5% { top: 20px; left: calc(100% - 45px); opacity: 1; }
                      10%, 15% { top: 20px; left: calc(100% - 45px); }
                      22% { top: 95px; left: 100px; }
                      25%, 70% { top: 95px; left: 100px; }
                      78% { top: 95px; left: calc(100% - 50px); }
                      82%, 100% { top: 95px; left: calc(100% - 50px); }
                    }

                    @keyframes buttonClick {
                      0%, 9% { transform: scale(1); background-color: white; }
                      10%, 12% { transform: scale(0.95); background-color: #f3f4f6; }
                      13%, 100% { transform: scale(1); background-color: white; }
                    }

                    @keyframes formAppear {
                      0%, 13% { opacity: 0; transform: scale(0.95); }
                      18%, 100% { opacity: 1; transform: scale(1); }
                    }

                    @keyframes typeEmail {
                      0%, 24% { content: ''; }
                      26% { content: 'c'; }
                      28% { content: 'co'; }
                      30% { content: 'cof'; }
                      32% { content: 'cofo'; }
                      34% { content: 'cofou'; }
                      36% { content: 'cofoun'; }
                      38% { content: 'cofounde'; }
                      40% { content: 'cofounder'; }
                      42% { content: 'cofounder@'; }
                      44% { content: 'cofounder@e'; }
                      46% { content: 'cofounder@ex'; }
                      48% { content: 'cofounder@exa'; }
                      50% { content: 'cofounder@exam'; }
                      52% { content: 'cofounder@examp'; }
                      54% { content: 'cofounder@exampl'; }
                      56% { content: 'cofounder@example'; }
                      58% { content: 'cofounder@example.'; }
                      60% { content: 'cofounder@example.c'; }
                      62% { content: 'cofounder@example.co'; }
                      64%, 100% { content: 'cofounder@example.com'; }
                    }

                    @keyframes caretBlinkEmail {
                      0%, 24% { opacity: 1; margin-left: 0; }
                      25%, 26% { opacity: 0; margin-left: 0; }
                      26% { opacity: 1; margin-left: 5px; }
                      28% { opacity: 1; margin-left: 11px; }
                      30% { opacity: 1; margin-left: 17px; }
                      32% { opacity: 1; margin-left: 23px; }
                      34% { opacity: 1; margin-left: 30px; }
                      36% { opacity: 1; margin-left: 37px; }
                      38% { opacity: 1; margin-left: 48px; }
                      40% { opacity: 1; margin-left: 58px; }
                      42% { opacity: 1; margin-left: 65px; }
                      44% { opacity: 1; margin-left: 70px; }
                      46% { opacity: 1; margin-left: 76px; }
                      48% { opacity: 1; margin-left: 83px; }
                      50% { opacity: 1; margin-left: 91px; }
                      52% { opacity: 1; margin-left: 99px; }
                      54% { opacity: 1; margin-left: 107px; }
                      56% { opacity: 1; margin-left: 117px; }
                      58% { opacity: 1; margin-left: 124px; }
                      60% { opacity: 1; margin-left: 129px; }
                      62%, 100% { opacity: 1; margin-left: 136px; }
                    }

                    @keyframes inviteClick {
                      0%, 81% { transform: scale(1); }
                      82%, 84% { transform: scale(0.95); }
                      85%, 100% { transform: scale(1); }
                    }

                    @keyframes membersAppear {
                      0%, 85% { opacity: 0; }
                      86%, 100% { opacity: 1; }
                    }

                    @keyframes memberSlideIn {
                      0%, 85% { opacity: 0; transform: translateY(-4px); }
                      89%, 100% { opacity: 1; transform: translateY(0); }
                    }
                  `}</style>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-end items-center gap-3">
                    <button
                      onClick={() => setWelcomeStep(2)}
                      className="button-shimmer bg-[#000000] text-white px-4 md:px-6 py-2 rounded text-sm font-medium hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 flex-shrink-0"
                    >
                      Continue
                      <svg width="16" height="14" viewBox="0 0 20 16" fill="none" className="flex-shrink-0">
                        <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Collab on the agreement */}
              {welcomeStep === 2 && (
                <div className="flex flex-col h-full">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    Collab on the Agreement
                  </h2>
                  <p className="text-sm text-gray-600 mb-3 md:mb-4">
                    You and your cofounders answer a set of guided questions together. Nobody has to play "project manager" or relay answers.
                  </p>

                  {/* Animation area */}
                  <div className="relative bg-gray-50 rounded-lg p-2 md:p-5 mb-2 overflow-hidden" style={{ height: 'clamp(180px, 40vh, 240px)', minHeight: '180px', maxHeight: '240px', display: 'block' }}>
                    {/* Black cursor */}
                    <div className="cursor-black absolute w-4 h-4 z-20" style={{ pointerEvents: 'none' }}>
                      <svg viewBox="0 0 24 24" fill="black" className="w-4 h-4">
                        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.72a.5.5 0 0 0-.44.49Z"/>
                      </svg>
                    </div>

                    {/* White cursor */}
                    <div className="cursor-white absolute w-4 h-4 z-20" style={{ pointerEvents: 'none' }}>
                      <svg viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1" className="w-4 h-4">
                        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.72a.5.5 0 0 0-.44.49Z"/>
                      </svg>
                    </div>

                    {/* Question 1: Company Name */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Company Name</p>
                      <div className="relative bg-white border border-gray-200 rounded px-3 py-2 text-sm h-9">
                        <span className="typing-text text-gray-700"></span>
                        <span className="text-caret"></span>
                      </div>
                    </div>

                    {/* Question 2: Industry dropdown */}
                    <div className="relative">
                      <p className="text-xs text-gray-500 mb-1">Industry</p>
                      <div className="relative bg-white border border-gray-200 rounded px-3 py-2 text-sm h-9 flex items-center justify-between">
                        <span className="selected-industry"></span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {/* Dropdown menu */}
                      <div className="dropdown-menu absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
                        <div className="dropdown-option-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Artificial Intelligence</div>
                        <div className="dropdown-option-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Food and Beverage</div>
                        <div className="dropdown-option-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Healthtech</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center gap-3">
                    <button
                      onClick={() => setWelcomeStep(1)}
                      className="text-xs md:text-sm text-gray-500 hover:text-gray-700"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setWelcomeStep(3)}
                      className="button-shimmer bg-[#000000] text-white px-4 md:px-6 py-2 rounded text-sm font-medium hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 flex-shrink-0"
                    >
                      Continue
                      <svg width="16" height="14" viewBox="0 0 20 16" fill="none" className="flex-shrink-0">
                        <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    </div>
                  </div>

                  <style>{`
                    /* Black cursor - clicks and types in company name */
                    .cursor-black {
                      top: 20px;
                      left: 20px;
                      animation: blackCursorMove 6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
                    }

                    /* White cursor - selects from dropdown */
                    .cursor-white {
                      top: 140px;
                      left: 320px;
                      animation: whiteCursorMove 6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
                    }

                    /* Typing text animation */
                    .typing-text::after {
                      content: '';
                      animation: typeText 6s steps(1) infinite;
                    }

                    /* Text caret blink */
                    .text-caret {
                      display: inline-block;
                      width: 1px;
                      height: 14px;
                      background: black;
                      margin-left: 1px;
                      animation: caretBlink 6s step-end infinite;
                    }

                    /* Dropdown visibility */
                    .dropdown-menu {
                      opacity: 0;
                      transform: scaleY(0);
                      transform-origin: top;
                      animation: dropdownShow 6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
                    }

                    /* Selected industry text */
                    .selected-industry::after {
                      content: 'Select industry';
                      color: #9CA3AF;
                      animation: industrySelect 6s steps(1) infinite;
                    }

                    /* Highlight selected option */
                    .dropdown-option-1 {
                      animation: optionHighlight 6s steps(1) infinite;
                    }

                    @keyframes blackCursorMove {
                      0% { top: 20px; left: 20px; }
                      8% { top: 52px; left: 120px; }
                      12%, 45% { top: 52px; left: 120px; }
                      55%, 100% { top: 52px; left: 120px; }
                    }

                    @keyframes whiteCursorMove {
                      0%, 15% { top: 140px; left: 320px; }
                      25% { top: 132px; left: 350px; }
                      30%, 34% { top: 132px; left: 350px; }
                      40%, 59% { top: 158px; left: 120px; }
                      65%, 100% { top: 158px; left: 120px; }
                    }

                    @keyframes typeText {
                      0%, 12% { content: ''; }
                      14% { content: 'C'; }
                      16% { content: 'Ch'; }
                      18% { content: 'Che'; }
                      20% { content: 'Cher'; }
                      22% { content: 'Cherr'; }
                      24% { content: 'Cherry'; }
                      26% { content: 'Cherryt'; }
                      28% { content: 'Cherrytr'; }
                      30% { content: 'Cherrytree'; }
                      32%, 100% { content: 'Cherrytree'; }
                    }

                    @keyframes caretBlink {
                      0%, 12% { opacity: 1; }
                      13%, 14% { opacity: 0; }
                      15%, 100% { opacity: 1; }
                    }

                    @keyframes dropdownShow {
                      0%, 29% { opacity: 0; transform: scaleY(0); }
                      30%, 52% { opacity: 1; transform: scaleY(1); }
                      53%, 100% { opacity: 0; transform: scaleY(0); }
                    }

                    @keyframes industrySelect {
                      0%, 49% { content: 'Select industry'; color: #9CA3AF; }
                      50%, 100% { content: 'Artificial Intelligence'; color: #374151; }
                    }

                    @keyframes optionHighlight {
                      0%, 39% { background: white; }
                      40%, 49% { background: #F3F4F6; }
                      50%, 52% { background: #E5E7EB; }
                      53%, 100% { background: white; }
                    }
                  `}</style>
                </div>
              )}

              {/* Step 3: Final Review */}
              {welcomeStep === 3 && (
                <div className="flex flex-col h-full">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    Do a Final Review
                  </h2>
                  <p className="text-sm text-gray-600 mb-3 md:mb-4">
                    Once everyone has answered all the questions, review the generated agreement together and approve it.
                  </p>

                  {/* Document preview */}
                  <div className="relative bg-gray-50 rounded-lg p-2 md:p-5 mb-2 overflow-hidden flex justify-center items-center" style={{ height: 'clamp(180px, 40vh, 240px)', minHeight: '180px', maxHeight: '240px' }}>
                    <div className="bg-white rounded border border-gray-200 p-4 h-full relative" style={{ width: '85%' }}>
                      <h3 className="text-xs text-gray-500 mb-3">Cofounder Agreement</h3>
                      <div className="space-y-2">
                        <div className="h-1 bg-gray-200 rounded w-full"></div>
                        <div className="h-1 bg-gray-200 rounded w-11/12"></div>
                        <div className="h-1 bg-gray-200 rounded w-full"></div>
                        <div className="h-1 bg-gray-200 rounded w-4/5"></div>
                        <div className="h-1 bg-gray-200 rounded w-full"></div>
                        <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-1 bg-gray-200 rounded w-full"></div>
                        <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                    {/* Scanner line */}
                    <div className="scanner-line absolute h-0.5 bg-gray-300" style={{ left: '5%', right: '5%', boxShadow: '0 0 6px 1px rgba(209, 213, 219, 0.5)' }}></div>
                  </div>

                  <style>{`
                    .scanner-line {
                      top: 20px;
                      animation: scanDocument 4s ease-in-out infinite;
                    }
                    @keyframes scanDocument {
                      0% { top: 20px; opacity: 1; }
                      25% { top: calc(100% - 24px); opacity: 1; }
                      50% { top: 20px; opacity: 1; }
                      51% { top: 20px; opacity: 0; }
                      60% { top: 20px; opacity: 0; }
                      61% { top: 20px; opacity: 1; }
                      85% { top: calc(100% - 24px); opacity: 1; }
                      100% { top: 20px; opacity: 1; }
                    }
                  `}</style>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center gap-3">
                    <button
                      onClick={() => setWelcomeStep(2)}
                      className="text-xs md:text-sm text-gray-500 hover:text-gray-700"
                    >
                      Back
                    </button>
                    <button
                      onClick={dismissWelcomePopup}
                      className="button-shimmer bg-[#000000] text-white px-4 md:px-6 py-2 rounded text-sm font-medium hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 flex-shrink-0"
                    >
                      Get Started
                      <svg width="16" height="14" viewBox="0 0 20 16" fill="none" className="flex-shrink-0">
                        <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white flex items-center gap-4" style={{ zIndex: 50, paddingLeft: '270px' }}>
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
                e.target.style.backgroundColor = '#E5E7EB';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#F3F4F6';
                setTimeout(() => setShowSearchResults(false), 200);
              }}
              className="w-full text-sm transition text-gray-500 placeholder-gray-500"
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: '0.5rem',
                border: 'none',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                outline: 'none'
              }}
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

        {/* Right side icons */}
        <div className="flex items-center gap-4 pr-6 relative">
          {/* Add Collaborators */}
          <button
            onClick={() => setShowCollaborators(true)}
            className="text-gray-700 hover:bg-gray-100 px-4 py-2 rounded transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-sm font-medium">Add Collaborators</span>
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <SurveyNavigation
        displayTitle={project?.name || 'Loading...'}
        currentPage="survey"
        projectId={projectId}
        allProjects={allProjects}
        onProjectSwitch={onProjectSwitch}
        onCreateProject={onCreateProject}
        hideUpgrade={project?.plan === 'pro'}
        planType={project?.plan}
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
      >

        {/* Progress Bar */}
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
            {saveStatus === 'saved' && lastSaved && (
              <span className="text-xs text-gray-500">
                Saved at {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-950">Error saving</span>
            )}
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex-1 overflow-y-auto pb-3 px-1 pt-4 flex flex-col">
          <div>
          <div className="px-2 mb-2">
            <span className="text-xs font-medium text-gray-600">Sections</span>
          </div>
          {SECTIONS.filter(section => section.id !== 0).map((section) => {
            const isCompleted = isSectionCompleted(section.id);
            return (
              <button
                key={section.id}
                data-section-id={section.id}
                onClick={() => {
                  setCurrentSection(section.id);
                  setIsMobileNavOpen(false);
                }}
                className={`text-left px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-200 flex items-center justify-between ${
                  currentSection === section.id
                    ? 'text-black font-semibold'
                    : 'text-gray-600'
                }`}
                style={{ width: '100%', fontSize: '15px' }}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex items-center justify-center w-6 h-6 ${
                    currentSection === section.id
                      ? 'font-medium'
                      : isCompleted
                        ? ''
                        : ''
                  } text-gray-500`} style={{ fontSize: '15px' }}>
                    {isCompleted ? (
                      <svg width="16" height="16" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                        <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shape-rendering="geometricPrecision"/>
                      </svg>
                    ) : section.id === 0 ? (
                      <svg width="16" height="16" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                        <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shape-rendering="geometricPrecision"/>
                      </svg>
                    ) : (
                      section.id
                    )}
                  </span>
                  <span className="nav-link-underline">{section.name}</span>
                </div>
              </button>
            );
          })}
          </div>
        </div>

      </SurveyNavigation>

      {/* Collaborators Modal */}
      {showCollaborators && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            style={{ zIndex: 10000 }}
            onClick={() => setShowCollaborators(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl border border-gray-200 w-[90vw] max-w-lg max-h-[90vh] overflow-hidden flex flex-col" style={{ zIndex: 10001 }}>
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Collaborators</h3>
                <button
                  onClick={() => setShowCollaborators(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <CollaboratorManager project={{ ...project, id: projectId }} />
            </div>
          </div>
        </>
      )}


      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto md:ml-[270px]" style={{ marginTop: '64px', backgroundColor: '#ffffff' }}>
        <div className="max-w-5xl mx-auto pt-6 px-4 md:px-6 md:pr-12 pb-20" key={currentSection}>
          {/* Content Container */}
          <div className="px-4 md:px-20 pt-8 pb-8">
          {/* Section Content */}
          {currentSection === 1 && (
            <div className="animate-fade-down">
              {isLoaded ? (
                <Section1Formation
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
          {currentSection === 2 && (
            <div className="animate-fade-down">
              <Section2Cofounders
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
                project={project}
              />
            </div>
          )}
          {currentSection === 3 && (
            <div className="animate-fade-down">
              <Section3EquityAllocation
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
          {currentSection === 4 && (
            <div className="animate-fade-down">
              <Section5EquityVesting
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 5 && (
            <div className="animate-fade-down">
              <Section4DecisionMaking
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 6 && (
            <div className="animate-fade-down">
              <Section6IP
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 7 && (
            <div className="animate-fade-down">
              <Section7Compensation
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
                project={project}
              />
            </div>
          )}
          {currentSection === 8 && (
            <div className="animate-fade-down">
              <Section8Performance
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 9 && (
            <div className="animate-fade-down">
              <Section9NonCompete
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                project={project}
                showValidation={showValidation}
              />
            </div>
          )}
          {currentSection === 10 && (
            <div className="animate-fade-down">
              <Section10Final
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
            <div className={`mt-16 flex justify-between`}>
              {currentSection > 1 && (
                <button
                  onClick={() => {
                    // If on section 3 in results view, go back to edit view (spreadsheet)
                    if (currentSection === 3 && section3InResultsView && section3Ref.current) {
                      section3Ref.current.backToEdit();
                    } else {
                      setCurrentSection(Math.max(1, currentSection - 1));
                    }
                  }}
                  className="pr-6 py-2 text-gray-400 hover:text-gray-600 font-normal flex items-center gap-2"
                >
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 8L2 8M2 8L8 2M2 8L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Previous
                </button>
              )}
              {currentSection === 1 && <div />}

              {currentSection < 10 ? (
                <button
                  onClick={() => {
                    // If on section 3 (Equity Allocation)
                    if (currentSection === 3) {
                      // If in results view, proceed to next section
                      if (section3InResultsView) {
                        setCurrentSection(4);
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
                    setCurrentSection(currentSection + 1);
                  }}
                  className="next-button bg-black text-white px-7 py-2 rounded font-normal hover:bg-[#1a1a1a] transition flex items-center gap-2"
                >
                  Next
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handlePreviewClick}
                  disabled={saveStatus === 'saving'}
                  className="next-button bg-black text-white px-10 py-2 rounded font-normal hover:bg-[#1a1a1a] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next: Preview & Approve
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          )}
          </div>
          {/* End White Card Container */}
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

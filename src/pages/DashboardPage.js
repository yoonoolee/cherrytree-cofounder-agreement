import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useOrganizationList, UserButton } from '@clerk/clerk-react';
import PaymentModal from '../components/PaymentModal';
import { useProjects } from '../hooks/useProjects';

// Simplified progress calculation function
const calculateProjectProgress = (project) => {
  const formData = project.surveyData || {};

  // Helper to check if "Other" field is valid
  const isOtherFieldValid = (value, otherValue) => {
    if (value === 'Other') {
      return otherValue && otherValue.trim() !== '';
    }
    return !!value;
  };

  // Helper to check if array with "Other" is valid
  const isOtherArrayFieldValid = (array, otherValue) => {
    if (!array || array.length === 0) return false;
    if (array.includes('Other')) {
      return otherValue && otherValue.trim() !== '';
    }
    return true;
  };

  let totalRequired = 0;
  let completed = 0;

  // Get all collaborators
  const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);

  // Section 1: Formation & Purpose (9 fields)
  if (formData.companyName) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData.entityType, formData.entityTypeOther)) completed++;
  totalRequired++;
  if (formData.registeredState) completed++;
  totalRequired++;
  if (formData.mailingStreet) completed++;
  totalRequired++;
  if (formData.mailingCity) completed++;
  totalRequired++;
  if (formData.mailingState) completed++;
  totalRequired++;
  if (formData.mailingZip) completed++;
  totalRequired++;
  if (formData.companyDescription) completed++;
  totalRequired++;
  if (isOtherArrayFieldValid(formData.industries, formData.industryOther)) completed++;
  totalRequired++;

  // Section 2: Cofounder Info
  if (formData.cofounderCount) completed++;
  totalRequired++;
  if (formData.cofounders && formData.cofounders.length > 0) {
    const allCofoundersFilled = formData.cofounders.every(cf =>
      cf.fullName && cf.title && cf.email && cf.roles && cf.roles.length > 0
    );
    if (allCofoundersFilled) completed++;
    totalRequired++;
  }

  // Section 3: Equity Allocation
  if (formData.finalEquityPercentages && Object.keys(formData.finalEquityPercentages).length > 0) {
    const allPercentagesFilled = allCollaborators.every(email =>
      formData.finalEquityPercentages[email] && formData.finalEquityPercentages[email] !== ''
    );
    if (allPercentagesFilled) completed++;
    totalRequired++;

    const totalEquity = allCollaborators.reduce((sum, email) =>
      sum + (parseFloat(formData.finalEquityPercentages[email]) || 0), 0
    );
    if (Math.abs(totalEquity - 100) <= 0.01) completed++;
    totalRequired++;
  }
  const allAcknowledgedEquityAllocation = allCollaborators.length > 0 &&
    allCollaborators.every(email => formData.acknowledgeEquityAllocation?.[email]);
  if (allAcknowledgedEquityAllocation) completed++;
  totalRequired++;

  // Section 4: Decision-Making (5 fields)
  if (isOtherArrayFieldValid(formData.majorDecisions, formData.majorDecisionsOther)) completed++;
  totalRequired++;
  if (formData.equityVotingPower) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData.tieResolution, formData.tieResolutionOther)) completed++;
  totalRequired++;
  const allAcknowledgedTieResolution = allCollaborators.length > 0 &&
    allCollaborators.every(email => formData.acknowledgeTieResolution?.[email]);
  if (allAcknowledgedTieResolution) completed++;
  totalRequired++;
  if (formData.includeShotgunClause) completed++;
  totalRequired++;
  if (formData.includeShotgunClause === 'Yes') {
    const allAcknowledgedShotgunClause = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeShotgunClause?.[email]);
    if (allAcknowledgedShotgunClause) completed++;
    totalRequired++;
  }

  // Section 5: Equity & Vesting (8 fields)
  if (formData.vestingStartDate) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData.vestingSchedule, formData.vestingScheduleOther)) completed++;
  totalRequired++;
  if (formData.cliffPercentage) completed++;
  totalRequired++;
  if (formData.accelerationTrigger) completed++;
  totalRequired++;
  if (formData.sharesSellNoticeDays) completed++;
  totalRequired++;
  if (formData.sharesBuybackDays) completed++;
  totalRequired++;
  const allAcknowledgedForfeiture = allCollaborators.length > 0 &&
    allCollaborators.every(email => formData.acknowledgeForfeiture?.[email]);
  if (allAcknowledgedForfeiture) completed++;
  totalRequired++;
  if (formData.vestedSharesDisposal) completed++;
  totalRequired++;

  // Section 6: IP & Ownership (2 fields)
  if (formData.hasPreExistingIP) completed++;
  totalRequired++;
  const allAcknowledgedIPOwnership = allCollaborators.length > 0 &&
    allCollaborators.every(email => formData.acknowledgeIPOwnership?.[email]);
  if (allAcknowledgedIPOwnership) completed++;
  totalRequired++;

  // Section 7: Compensation (2 fields)
  if (formData.takingCompensation) completed++;
  totalRequired++;
  if (formData.spendingLimit) completed++;
  totalRequired++;

  // Section 8: Performance (4 fields)
  if (formData.performanceConsequences && formData.performanceConsequences.length > 0) completed++;
  totalRequired++;
  if (formData.remedyPeriodDays) completed++;
  totalRequired++;
  if (isOtherArrayFieldValid(formData.terminationWithCause, formData.terminationWithCauseOther)) completed++;
  totalRequired++;
  if (formData.voluntaryNoticeDays) completed++;
  totalRequired++;

  // Section 9: Non-Competition (3 fields)
  const allAcknowledgedConfidentiality = allCollaborators.length > 0 &&
    allCollaborators.every(email => formData.acknowledgeConfidentiality?.[email]);
  if (allAcknowledgedConfidentiality) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData.nonCompeteDuration, formData.nonCompeteDurationOther)) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData.nonSolicitDuration, formData.nonSolicitDurationOther)) completed++;
  totalRequired++;

  // Section 10: Final Details (7 fields)
  if (isOtherFieldValid(formData.disputeResolution, formData.disputeResolutionOther)) completed++;
  totalRequired++;
  if (formData.governingLaw) completed++;
  totalRequired++;
  if (isOtherFieldValid(formData.amendmentProcess, formData.amendmentProcessOther)) completed++;
  totalRequired++;
  if (formData.reviewFrequencyMonths) completed++;
  totalRequired++;
  const allAcknowledgedPeriodicReview = allCollaborators.length > 0 &&
    allCollaborators.every(email => formData.acknowledgePeriodicReview?.[email]);
  if (allAcknowledgedPeriodicReview) completed++;
  totalRequired++;
  const allAcknowledgedAmendmentReviewRequest = allCollaborators.length > 0 &&
    allCollaborators.every(email => formData.acknowledgeAmendmentReviewRequest?.[email]);
  if (allAcknowledgedAmendmentReviewRequest) completed++;
  totalRequired++;
  const allAcknowledgedEntireAgreement = allCollaborators.length > 0 &&
    allCollaborators.every(email => formData.acknowledgeEntireAgreement?.[email]);
  if (allAcknowledgedEntireAgreement) completed++;
  totalRequired++;
  const allAcknowledgedSeverability = allCollaborators.length > 0 &&
    allCollaborators.every(email => formData.acknowledgeSeverability?.[email]);
  if (allAcknowledgedSeverability) completed++;
  totalRequired++;

  return totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 0;
};

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
    // Only start animation after page is fully loaded
    if (authLoading || loading) return;

    let currentIndex = 0;
    let intervalId;

    // Delay the animation start by 500ms after loading completes
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (currentIndex <= FULL_TAGLINE.length) {
          setDisplayedTagline(FULL_TAGLINE.slice(0, currentIndex));
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="cursor-pointer">
          <img src="/images/cherrytree-logo.png" alt="Cherrytree" className="h-6" />
        </button>

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
        <div className="mb-8 md:mb-14 text-center">
          <h1 className="text-2xl md:text-4xl font-light text-gray-900">
            Welcome{currentUser?.firstName ? `, ${currentUser.firstName}` : ''}!
          </h1>
          <p className="text-sm md:text-lg mt-2 text-gray-500">{displayedTagline}</p>
        </div>

        {/* Your Projects */}
        <h2 className="text-lg md:text-xl font-normal text-gray-900 mb-4 max-w-4xl mx-auto">Your Projects</h2>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3 max-w-4xl mx-auto">
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
                .map(cf => cf.fullName?.split(' ')[0])
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
                  className="w-full bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <div className="py-6 sm:py-8 px-4 sm:px-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-2 text-left">
                      {project.name || 'Untitled Project'}
                    </h2>
                    <p className="text-sm text-gray-500 text-left mb-4">
                      {agreementText}
                    </p>
                  </div>
                  {/* Progress Bar */}
                  <div className="px-4 sm:px-6 pb-6 sm:pb-8">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {/* Status and Last Edited */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                      <span>
                        {progress < 100 && (
                          <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">In progress</span>
                        )}
                      </span>
                      {timeAgo && <span>Last edited {timeAgo}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="w-full bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
              <p className="text-sm text-gray-500">No projects found</p>
            </div>
          )}

          {/* Create New Button */}
          <button
            onClick={() => setShowPaymentModal(true)}
            className="group w-full py-6 sm:py-8 px-4 sm:px-6 bg-white rounded-lg border-2 border-dotted border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex items-center justify-center"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Create a new Cofounder Agreement</h3>
              <p className="text-xs text-gray-500">One agreement per company.</p>
            </div>
          </button>
        </div>

        {/* Resources Section - Bottom */}
        <h2 className="text-lg md:text-xl font-normal text-gray-900 mb-4 mt-8 md:mt-12 max-w-4xl mx-auto">Resources</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <a
              href="https://www.cherrytree.app/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 p-3 flex flex-col items-center justify-center text-center"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors mb-1.5">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-blue-600">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Pricing</h4>
              <p className="text-xs text-gray-500">Compare plans</p>
            </a>

            <a
              href="https://cherrytree.beehiiv.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 p-3 flex flex-col items-center justify-center text-center"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors mb-1.5">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-blue-600">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd"/>
                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"/>
                </svg>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Newsletter</h4>
              <p className="text-xs text-gray-500">Weekly stories</p>
            </a>

            <button
              onClick={() => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 })}
              className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 p-3 flex flex-col items-center justify-center text-center"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors mb-1.5">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-blue-600">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Contact</h4>
              <p className="text-xs text-gray-500">Get in touch</p>
            </button>

            <div className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 p-3 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors mb-1.5">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-blue-600">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Placeholder</h4>
              <p className="text-xs text-gray-500">Coming soon</p>
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

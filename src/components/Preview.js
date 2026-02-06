import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { db, functions } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import ApprovalSection from './ApprovalSection';
import SurveyNavigation from './SurveyNavigation';
import { SECTION_IDS, SECTION_ORDER, SECTIONS as SECTION_CONFIG } from '../config/sectionConfig';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '@clerk/clerk-react';
import { formatDeadline, isAfterEditDeadline } from '../utils/dateUtils';
import { useProjectSync } from '../hooks/useProjectSync';
import { useAutoSave } from '../hooks/useAutoSave';
import { useValidation } from '../hooks/useValidation';
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

const libraries = ['places'];
const GENERATED_AGREEMENT_ID = 'generated-agreement';

function Preview({ projectId, allProjects = [], onProjectSwitch, onEdit, onCreateProject }) {
  const { currentUser } = useUser();
  const { getToken } = useAuth();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // UI state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [submitterName, setSubmitterName] = useState('<blank>');
  const [currentSection, setCurrentSection] = useState(GENERATED_AGREEMENT_ID);

  // Refs and hooks for form data
  const isSavingRef = useRef(false);
  const { project, formData, setFormData } = useProjectSync(projectId, isSavingRef);
  const { createChangeHandler } = useAutoSave(projectId, project, currentUser);
  const { isSectionCompleted } = useValidation(formData, project);
  const handleChange = createChangeHandler(setFormData);

  // Convert Google Drive URL to embeddable format
  const getEmbedUrl = (url) => {
    if (!url) return null;

    // Check if it's a Google Drive URL
    if (url.includes('drive.google.com')) {
      // Extract file ID from various Google Drive URL formats
      let fileId = null;

      // Format: https://drive.google.com/file/d/FILE_ID/view
      // Format: https://drive.google.com/file/d/FILE_ID (without /view)
      const match1 = url.match(/\/file\/d\/([^\/\?]+)/);
      if (match1) {
        fileId = match1[1];
      }

      // Format: https://drive.google.com/open?id=FILE_ID
      if (!fileId) {
        const match2 = url.match(/[?&]id=([^&]+)/);
        if (match2) {
          fileId = match2[1];
        }
      }

      if (fileId) {
        // Return embeddable URL with preview parameter
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    // If not Google Drive or already in correct format, return as-is
    return url;
  };

  // Update PDF URL when project changes
  useEffect(() => {
    if (project) {
      if (project.submitted && project.latestPdfUrl) {
        setPdfUrl(project.latestPdfUrl);
      } else if (project.previewPdfUrl) {
        setPdfUrl(project.previewPdfUrl);
      }
    }
  }, [project]);

  // Check if preview is stale (survey edited after PDF generated)
  const isPreviewStale = () => {
    if (!project || !project.previewPdfGeneratedAt || !project.lastUpdated) {
      return false;
    }

    const generatedAt = project.previewPdfGeneratedAt.toDate().getTime();
    const lastUpdated = project.lastUpdated.toDate().getTime();
    const timeDiff = lastUpdated - generatedAt;

    // Preview is stale if survey was updated MORE THAN 10 seconds after PDF generation
    // This buffer accounts for:
    // - Firestore server timestamp delays
    // - Auto-save when clicking "Next: Preview" button
    // - Network latency
    return timeDiff > 10000;
  };

  // Manual PDF generation (called on mount or by button click)
  const generatePreview = async () => {
    if (!project || project.submitted) return;

    setIsGeneratingPdf(true);
    setPdfError('');

    try {
      const sessionToken = await getToken();
      const generatePreviewPDF = httpsCallable(functions, 'generatePreviewPDF');
      const result = await generatePreviewPDF({ sessionToken, projectId });

      if (result.data && result.data.pdfUrl) {
        setPdfUrl(result.data.pdfUrl);
      } else {
        console.warn('No PDF URL returned from function');
        setPdfError('PDF was generated but no URL was returned. Please try again.');
      }
    } catch (error) {
      console.error('Error generating preview PDF:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      setPdfError(error.message || 'Failed to generate preview. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Track if we've already attempted to generate on mount
  const hasAttemptedGeneration = useRef(false);

  // Trigger PDF generation when navigating to preview (button clicked)
  useEffect(() => {
    if (project && !project.submitted && !hasAttemptedGeneration.current) {
      hasAttemptedGeneration.current = true;

      // Check if preview needs regeneration
      const needsRegeneration = !project.previewPdfUrl || isPreviewStale();

      if (needsRegeneration) {
        generatePreview();
      }
    }
  }, [project]);

  // Fetch submitter name from user profile (from latest pdfAgreement)
  useEffect(() => {
    const fetchSubmitterName = async () => {
      const latestAgreement = project?.pdfAgreements?.[project.pdfAgreements.length - 1];
      if (latestAgreement?.generatedBy) {
        try {
          const userDoc = await getDoc(doc(db, 'users', latestAgreement.generatedBy));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ');
            if (fullName) {
              setSubmitterName(fullName);
            }
          }
        } catch (error) {
          console.error('Error fetching submitter name:', error);
        }
      }
    };
    fetchSubmitterName();
  }, [project]);

  const checkAllApproved = () => {
    const collaborators = project.collaborators || {};
    const collaboratorIds = Object.keys(collaborators);
    if (collaboratorIds.length === 0) return true;

    const approvals = project.approvals || {};

    // Everyone must approve (including admin)
    return collaboratorIds.every(userId => approvals[userId] === true);
  };

  const handleSubmit = async () => {
    setSubmitError('');

    if (!window.confirm('Submit this survey? You will not be able to edit it after submission.')) {
      return;
    }

    if (!currentUser) {
      setSubmitError('You must be logged in to submit');
      return;
    }

    if (!checkAllApproved()) {
      setSubmitError('All collaborators must approve before you can submit');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionToken = await getToken();
      const submitSurvey = httpsCallable(functions, 'submitSurvey');
      await submitSurvey({ sessionToken, projectId });
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'Failed to submit survey. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isAdmin = project?.admin === currentUser?.id;
  const isReadOnly = project?.submitted;

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar Navigation */}
      <SurveyNavigation
        displayTitle={project?.name || 'Loading...'}
        currentPage="survey"
        projectId={projectId}
        allProjects={allProjects}
        onProjectSwitch={onProjectSwitch}
        onCreateProject={onCreateProject}
        hideUpgrade={project?.currentPlan === 'pro'}
        planType={project?.currentPlan}
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
      >
        {/* Section Navigation */}
        <div className="flex-1 overflow-y-auto pb-3 px-1 pt-4 flex flex-col">
          <div>
          <div className="px-2 mb-2">
            <span className="text-xs font-medium text-gray-600">Sections</span>
          </div>
          {SECTION_ORDER.map((sectionId, index) => {
            const sectionConfig = SECTION_CONFIG[sectionId];
            return (
              <button
                key={sectionId}
                data-section-id={sectionId}
                onClick={() => {
                  setCurrentSection(sectionId);
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
                  <span className="flex items-center justify-center w-6 h-6 text-gray-500" style={{ fontSize: '15px' }}>
                    {index + 1}
                  </span>
                  <span className="nav-link-underline">{sectionConfig.displayName}</span>
                </div>
              </button>
            );
          })}

          {/* Review and Approve - Section 11 */}
          <button
            onClick={() => {
              setCurrentSection(GENERATED_AGREEMENT_ID);
              setIsMobileNavOpen(false);
            }}
            className={`text-left px-2 py-1.5 rounded-lg mb-0.5 transition-all duration-200 flex items-center justify-between ${
              currentSection === GENERATED_AGREEMENT_ID
                ? 'text-black font-semibold'
                : 'text-gray-600'
            }`}
            style={{ width: '100%', fontSize: '15px' }}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="nav-link-underline">Review and Approve</span>
            </div>
          </button>
          </div>
        </div>
      </SurveyNavigation>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto ml-[270px]" style={{ marginTop: '0' }}>
        <div className="max-w-6xl mx-auto pt-6 px-6 pr-12 pb-20">
          {/* Content Container */}
          <div className="px-20 pt-8 pb-20">

          {/* Section Content - render actual sections */}
          {currentSection === SECTION_IDS.FORMATION && (
            <div className="animate-fade-down">
              {isLoaded ? (
                <SectionFormation
                  formData={formData}
                  handleChange={handleChange}
                  isReadOnly={true}
                  showValidation={false}
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
                isReadOnly={true}
                showValidation={false}
                project={project}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.EQUITY_ALLOCATION && (
            <div className="animate-fade-down">
              <SectionEquityAllocation
                formData={formData}
                handleChange={handleChange}
                isReadOnly={true}
                project={project}
                showValidation={false}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.VESTING && (
            <div className="animate-fade-down">
              <SectionEquityVesting
                formData={formData}
                handleChange={handleChange}
                isReadOnly={true}
                project={project}
                showValidation={false}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.DECISION_MAKING && (
            <div className="animate-fade-down">
              <SectionDecisionMaking
                formData={formData}
                handleChange={handleChange}
                isReadOnly={true}
                project={project}
                showValidation={false}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.IP && (
            <div className="animate-fade-down">
              <SectionIP
                formData={formData}
                handleChange={handleChange}
                isReadOnly={true}
                project={project}
                showValidation={false}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.COMPENSATION && (
            <div className="animate-fade-down">
              <SectionCompensation
                formData={formData}
                handleChange={handleChange}
                isReadOnly={true}
                showValidation={false}
                project={project}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.PERFORMANCE && (
            <div className="animate-fade-down">
              <SectionPerformance
                formData={formData}
                handleChange={handleChange}
                isReadOnly={true}
                showValidation={false}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.NON_COMPETITION && (
            <div className="animate-fade-down">
              <SectionNonCompete
                formData={formData}
                handleChange={handleChange}
                isReadOnly={true}
                project={project}
                showValidation={false}
              />
            </div>
          )}
          {currentSection === SECTION_IDS.GENERAL_PROVISIONS && (
            <div className="animate-fade-down">
              <SectionFinal
                formData={formData}
                handleChange={handleChange}
                isReadOnly={true}
                project={project}
                showValidation={false}
              />
            </div>
          )}

          {/* Generated Agreement (PDF) */}
          {currentSection === GENERATED_AGREEMENT_ID && (
            <div>
              {/* Stale Preview Warning */}
              {!isReadOnly && pdfUrl && isPreviewStale() && !isGeneratingPdf && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-900 font-medium">
                        The survey has been edited
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Please refresh to see the updated preview of the cofounder agreement.
                      </p>
                    </div>
                    <button
                      onClick={generatePreview}
                      className="ml-4 bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition whitespace-nowrap"
                    >
                      Refresh Preview
                    </button>
                  </div>
                </div>
              )}

              {/* Header with Download Button */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Generated Agreement</h2>
                  <p className="text-sm text-gray-500">
                    {project.submittedAt
                      ? `Submitted by ${submitterName} on ${project.submittedAt.toDate().toLocaleDateString()}`
                      : 'Preview - Not yet submitted'
                    }
                  </p>
                  {!project.submitted && project.editDeadline && (
                    <p className={`text-sm mt-1 ${isAfterEditDeadline(project.editDeadline) ? 'text-red-600' : 'text-gray-500'}`}>
                      {isAfterEditDeadline(project.editDeadline)
                        ? (project.previewPdfGeneratedAt
                            ? `Edit window expired on ${formatDeadline(project.editDeadline)}`
                            : 'You will not be able to edit this agreement once it has been generated.')
                        : `You can continue to edit and regenerate the agreement until ${formatDeadline(project.editDeadline)}`
                      }
                    </p>
                  )}
                </div>
                {isReadOnly && project.latestPdfUrl && (
                  <a
                    href={project.latestPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-black text-white px-6 py-2 rounded font-medium hover:bg-gray-800 transition"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </a>
                )}
              </div>

              {/* PDF Loading State */}
              {isGeneratingPdf && (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded">
                  <svg className="animate-spin h-12 w-12 text-gray-900 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-900 font-medium">Generating your cofounder agreement...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              )}

              {/* PDF Error State */}
              {pdfError && !isGeneratingPdf && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-sm text-red-950">Error generating preview: {pdfError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm text-red-950 hover:text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* PDF Viewer */}
              {pdfUrl && !isGeneratingPdf && (
                <div className="border border-gray-200 rounded overflow-hidden bg-white shadow-sm mb-8">
                  <iframe
                    src={getEmbedUrl(pdfUrl)}
                    className="w-full h-[900px]"
                    title="Cofounder Agreement Preview"
                    frameBorder="0"
                    allow="autoplay"
                  />
                </div>
              )}

              {/* Approval Section */}
              {!isReadOnly && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <ApprovalSection project={project} projectId={projectId} />
                </div>
              )}

              {/* Submit Button (Owner Only) */}
              {!isReadOnly && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  {isAdmin ? (
                    <div>
                      {submitError && (
                        <p className="text-xs text-red-950 mb-4">{submitError}</p>
                      )}
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !checkAllApproved()}
                        className="bg-black text-white px-8 py-3 rounded font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating PDF...
                          </span>
                        ) : (
                          'Submit Agreement'
                        )}
                      </button>
                      {isSubmitting && (
                        <p className="text-sm text-gray-600 mt-3 font-medium">
                          PDF is being generated... Wait for download button to appear
                        </p>
                      )}
                      {!checkAllApproved() && (
                        <p className="text-sm text-gray-600 mt-3">
                          Waiting for all collaborators to approve
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded p-4">
                      <p className="text-sm text-gray-600">
                        Only the project owner can submit the survey
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          </div>
          {/* End White Card Container */}
        </div>
      </div>
    </div>
  );
}

export default Preview;

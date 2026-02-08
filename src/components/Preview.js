import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import ApprovalSection from './ApprovalSection';
import SurveyNavigation from './SurveyNavigation';
import AgreementHeader from './AgreementHeader';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '@clerk/clerk-react';
import { isProjectReadOnly } from '../utils/dateUtils';
import { useProjectSync } from '../hooks/useProjectSync';

const GENERATED_AGREEMENT_ID = 'generated-agreement';

function Preview({ projectId, allProjects = [], onProjectSwitch, onEdit, onCreateProject }) {
  const { currentUser } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // UI state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [currentSection, setCurrentSection] = useState(GENERATED_AGREEMENT_ID);

  // Refs and hooks for form data (SurveyNavigation has its own hooks now)
  const isSavingRef = useRef(false);
  const { project } = useProjectSync(projectId, isSavingRef);

  // Convert Google Drive URL to embeddable format
  const getEmbedUrl = (url) => {
    if (!url) return null;

    // Check if it's a Google Drive URL
    if (url.includes('drive.google.com')) {
      // Extract file ID from various Google Drive URL formats
      let fileId = null;

      // Format: https://drive.google.com/file/d/FILE_ID/view
      // Format: https://drive.google.com/file/d/FILE_ID (without /view)
      const match1 = url.match(/\/file\/d\/([^/?]+)/);
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
      // Show latest submitted PDF if it exists, otherwise show preview PDF
      if (project.latestPdfUrl) {
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
    if (!project || isReadOnly) return;

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
    if (project && !isReadOnly && !hasAttemptedGeneration.current) {
      hasAttemptedGeneration.current = true;

      // Check if preview needs regeneration
      const needsRegeneration = !project.previewPdfUrl || isPreviewStale();

      if (needsRegeneration) {
        generatePreview();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Navigate to Final Agreement page after successful submit
      navigate(`/final-agreement/${projectId}`);
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'Failed to submit survey. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isAdmin = project?.admin === currentUser?.id;
  // Check if survey should be read-only (logic in dateUtils.js)
  const isReadOnly = isProjectReadOnly(project);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar Navigation - self-contained with all hooks */}
      <SurveyNavigation
        projectId={projectId}
        currentSection={currentSection}
        onSectionClick={(sectionId) => onEdit(sectionId)} // Navigate back to survey at specific section
        onReviewAndApproveClick={() => setCurrentSection(GENERATED_AGREEMENT_ID)}
        onFinalAgreementClick={() => navigate(`/final-agreement/${projectId}`)}
        allProjects={allProjects}
        onProjectSwitch={onProjectSwitch}
        onCreateProject={onCreateProject}
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto ml-[270px]" style={{ marginTop: '0' }}>
        <div className="max-w-6xl mx-auto pt-6 px-6 pr-12 pb-20">
          {/* Content Container */}
          <div className="px-20 pt-8 pb-20">

          {/* Preview page only shows the Generated Agreement (PDF/Approval) */}
          {/* Clicking sections 1-10 in nav navigates back to Survey page */}
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

              {/* Header */}
              <AgreementHeader project={project} title="Generated Agreement" />

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
          </div>
          {/* End White Card Container */}
        </div>
      </div>
    </div>
  );
}

export default Preview;

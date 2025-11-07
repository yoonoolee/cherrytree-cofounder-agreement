import React, { useState, useEffect, useRef } from 'react';
import { db, auth, functions } from '../firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { signOut } from 'firebase/auth';
import ApprovalSection from './ApprovalSection';
import { SECTIONS } from './surveyConstants';

function Preview({ projectId, allProjects = [], onProjectSwitch, onEdit, onCreateProject }) {
  const [project, setProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [submitterName, setSubmitterName] = useState('<blank>');
  const [currentSection, setCurrentSection] = useState(11); // Default to section 11 (Generated Agreement)
  const [showProjectSelector, setShowProjectSelector] = useState(false);

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

  useEffect(() => {
    const projectRef = doc(db, 'projects', projectId);

    const unsubscribe = onSnapshot(projectRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProject(data);

        // If project is submitted, use the final PDF URL
        if (data.submitted && data.pdfUrl) {
          setPdfUrl(data.pdfUrl);
        } else if (data.previewPdfUrl) {
          // Otherwise use preview PDF URL if available
          setPdfUrl(data.previewPdfUrl);
        }
      }
    });

    return unsubscribe;
  }, [projectId]);

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
      const generatePreviewPDF = httpsCallable(functions, 'generatePreviewPDF');
      const result = await generatePreviewPDF({ projectId });

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

  // Fetch submitter name from user profile
  useEffect(() => {
    const fetchSubmitterName = async () => {
      if (project?.submittedBy) {
        try {
          const userDoc = await getDoc(doc(db, 'users', project.ownerId));
          if (userDoc.exists() && userDoc.data().name) {
            setSubmitterName(userDoc.data().name);
          }
        } catch (error) {
          console.error('Error fetching submitter name:', error);
        }
      }
    };
    fetchSubmitterName();
  }, [project]);

  const checkAllApproved = () => {
    if (!project.requiresApprovals) return true;

    const allCollaborators = (project.collaborators || []).filter(
      email => email !== project.ownerEmail
    );

    if (allCollaborators.length === 0) return true;

    const approvals = project.approvals || {};

    return allCollaborators.every(email => approvals[email] === true);
  };

  const handleSubmit = async () => {
    setSubmitError('');

    if (!window.confirm('Submit this survey? You will not be able to edit it after submission.')) {
      return;
    }

    if (!auth.currentUser) {
      setSubmitError('You must be logged in to submit');
      return;
    }

    if (project.requiresApprovals && !checkAllApproved()) {
      setSubmitError('All collaborators must approve before you can submit');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitSurvey = httpsCallable(functions, 'submitSurvey');
      await submitSurvey({ projectId });
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'Failed to submit survey. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isOwner = project?.ownerEmail === auth.currentUser?.email;
  const isReadOnly = project?.submitted;

  // Create sections array with the 11th section
  const previewSections = [
    ...SECTIONS,
    { id: 11, name: 'Generated Agreement' }
  ];

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-gray-600">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-gray-200 flex flex-col fixed h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{project?.name || 'Loading...'}</h2>

          {/* Edit Survey Button (if not readonly) */}
          {!isReadOnly && (
            <button
              onClick={onEdit}
              className="w-full bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Survey
            </button>
          )}
        </div>

        {/* Section Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          {previewSections.map((section) => {
            return (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-all duration-200 flex items-center justify-between hover:scale-105 ${
                  currentSection === section.id
                    ? 'bg-gray-100 text-black font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className={`flex items-center justify-center w-6 h-6 font-semibold mr-3 ${
                    currentSection === section.id
                      ? 'text-black text-xs'
                      : 'text-gray-600 text-xs'
                  }`}>
                    {section.id === 11 ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ) : (
                      section.id
                    )}
                  </span>
                  {section.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Projects Button - Bottom of Sidebar */}
        <div className="p-4 border-t border-gray-200 relative">
          {/* Project Selector Popup */}
          {showProjectSelector && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProjectSelector(false)}
              />

              {/* Popup Menu */}
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 flex flex-col">
                {/* Create New Project Button */}
                <button
                  onClick={() => {
                    setShowProjectSelector(false);
                    onCreateProject();
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-200"
                >
                  <div className="w-8 h-8 bg-black rounded flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Create New Project</span>
                </button>

                {/* Projects List */}
                <div className="overflow-y-auto flex-1">
                  {allProjects.map(proj => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setShowProjectSelector(false);
                        onProjectSwitch(proj.id);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${
                        proj.id === projectId ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        proj.id === projectId
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {proj.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-gray-900 truncate">{proj.name}</div>
                        {proj.lastUpdated && (
                          <div className="text-xs text-gray-500">
                            {proj.lastUpdated.toDate().toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {proj.id === projectId && (
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-black flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => setShowProjectSelector(!showProjectSelector)}
            className="w-full bg-gray-100 text-gray-900 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2 mb-3"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Switch Project
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to log out?')) {
                await signOut(auth);
              }
            }}
            className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto ml-64">
        <div className="max-w-6xl mx-auto p-8 pr-24 pb-32">

          {/* Sections 1-10: Show message to edit in survey mode */}
          {currentSection >= 1 && currentSection <= 10 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {SECTIONS.find(s => s.id === currentSection)?.name}
              </h3>
              <p className="text-gray-600 mb-4">
                To view or edit this section, please {isReadOnly ? 'this survey is locked' : 'switch to edit mode'}
              </p>
              {!isReadOnly && (
                <button
                  onClick={onEdit}
                  className="bg-black text-white px-6 py-2 rounded font-medium hover:bg-gray-800 transition"
                >
                  Go to Edit Mode
                </button>
              )}
            </div>
          )}

          {/* Section 11: Generated Agreement (PDF) */}
          {currentSection === 11 && (
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
                </div>
                {isReadOnly && project.pdfUrl && (
                  <a
                    href={project.pdfUrl}
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">Error generating preview: {pdfError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
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
              {!isReadOnly && project.requiresApprovals && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <ApprovalSection project={project} projectId={projectId} />
                </div>
              )}

              {/* Submit Button (Owner Only) */}
              {!isReadOnly && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  {isOwner ? (
                    <div>
                      {submitError && (
                        <p className="text-xs text-red-600 mb-4">{submitError}</p>
                      )}
                      <button
                        onClick={handleSubmit}
                        disabled={
                          isSubmitting ||
                          (project.requiresApprovals && !checkAllApproved())
                        }
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
                      {isSubmitting ? (
                        <p className="text-sm text-gray-600 mt-3 font-medium">
                          PDF is being generated... Wait for download button to appear
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-3">
                          Once submitted, you cannot edit the survey
                        </p>
                      )}
                      {project.requiresApprovals && !checkAllApproved() && (
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
      </div>
    </div>
  );
}

export default Preview;

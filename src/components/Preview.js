import React, { useState, useEffect, useRef } from 'react';
import { db, functions } from '../firebase';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import ApprovalSection from './ApprovalSection';
import { SECTIONS } from '../config/surveySchema';
import { useUser } from '../contexts/UserContext';
import { useClerk, useAuth } from '@clerk/clerk-react';
import { formatDeadline, isAfterEditDeadline } from '../utils/dateUtils';
import { FIELDS } from '../config/surveySchema';

function Preview({ projectId, allProjects = [], onProjectSwitch, onEdit, onCreateProject }) {
  const { currentUser } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [project, setProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [submitterName, setSubmitterName] = useState('<blank>');
  const [currentSection, setCurrentSection] = useState(11); // Default to section 11 (Generated Agreement)
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState('');

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

        // If project is submitted, use the latest PDF URL
        if (data.submitted && data.latestPdfUrl) {
          setPdfUrl(data.latestPdfUrl);
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

  // Create sections array with the 11th section
  const previewSections = [
    ...SECTIONS,
    { id: 11, name: 'Generated Agreement' }
  ];

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white flex items-center justify-between px-6 gap-4" style={{ zIndex: 50 }}>
        {/* Cherrytree Logo */}
        <div className="flex items-center" style={{ width: '256px' }}>
          <svg width="24" height="24" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shapeRendering="geometricPrecision"/>
          </svg>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-4">
        {/* Help Icon */}
        <button
          onClick={() => {
            // TODO: Add help functionality
          }}
          className="text-gray-600 transition w-6 h-6 flex items-center justify-center"
        >
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <text x="10" y="14" textAnchor="middle" fontSize="12" fontWeight="600" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fill="currentColor">?</text>
          </svg>
        </button>

        {/* Settings Icon */}
        <button
          onClick={() => {
            // TODO: Add settings functionality
          }}
          className="text-gray-600 transition"
        >
          <svg width="23" height="23" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Add Collaborators Plus Button */}
        <button
          onClick={() => {
            // TODO: Add collaborators functionality
          }}
          className="button-shimmer bg-[#820e22] text-white p-1.5 rounded-full hover:bg-[#620a1a] transition"
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-gray-200 flex flex-col fixed h-screen" style={{ backgroundColor: '#FFFFFF', top: 0, height: '100vh', zIndex: 100 }}>
        {/* Header */}
        <div className="px-3 py-3 border-b border-gray-200" style={{ marginTop: '64px', paddingTop: '1.25rem' }}>
          {isEditingProjectName ? (
            <input
              type="text"
              value={editedProjectName}
              onChange={(e) => setEditedProjectName(e.target.value)}
              onBlur={async () => {
                if (editedProjectName.trim() && editedProjectName !== project?.name) {
                  try {
                    const projectRef = doc(db, 'projects', projectId);
                    await updateDoc(projectRef, { name: editedProjectName.trim() });
                  } catch (error) {
                    console.error('Error updating project name:', error);
                  }
                }
                setIsEditingProjectName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
                if (e.key === 'Escape') {
                  setIsEditingProjectName(false);
                }
              }}
              autoFocus
              className="text-lg font-semibold text-gray-900 mb-3 w-full border-b border-red-950 focus:outline-none bg-transparent"
            />
          ) : (
            <div>
              <h2
                className="text-lg font-semibold text-gray-900 mb-1 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => {
                  setEditedProjectName(project?.name || '');
                  setIsEditingProjectName(true);
                }}
                title="Click to edit project name"
              >
                {project?.name || 'Loading...'}
              </h2>
              {project?.currentPlan && (
                <p className={`text-xs font-medium mb-3 ${project.currentPlan === 'pro' ? 'text-purple-600' : 'text-gray-500'}`}>
                  {project.currentPlan === 'pro' ? 'Pro' : 'Starter'}
                </p>
              )}
            </div>
          )}

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
                className={`text-left px-2.5 py-1.5 rounded-lg mb-0.5 mx-3 transition-all duration-200 flex items-center justify-between hover:scale-105 ${
                  currentSection === section.id
                    ? 'text-[#820e22] font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ width: 'calc(100% - 1.5rem)' }}
              >
                <div className="flex items-center">
                  <span className={`flex items-center justify-center w-6 h-6 font-semibold mr-3 ${
                    currentSection === section.id
                      ? 'text-[#820e22] text-sm'
                      : 'text-gray-600 text-sm'
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
        <div className="p-3 border-t border-gray-200 relative">
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

          {project?.currentPlan !== 'pro' && (
            <button
              onClick={() => {
                // TODO: Add upgrade functionality
              }}
              className="w-full bg-white text-gray-600 px-4 py-2.5 rounded text-sm font-medium hover:bg-gray-100 transition flex items-center justify-start gap-2 mb-3"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade
            </button>
          )}

          <button
            onClick={() => setShowProjectSelector(!showProjectSelector)}
            className="w-full text-gray-700 px-4 py-2.5 rounded text-sm font-medium hover:bg-gray-200 transition flex items-center justify-start gap-2 mb-3"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Switch Project
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                // Set flag to prevent ProtectedRoute from intercepting
                sessionStorage.setItem('isLoggingOut', 'true');

                // Sign out (Clerk Dashboard handles redirect)
                signOut().catch(err => console.error('Error signing out:', err));
              }
            }}
            className="w-full text-gray-700 px-4 py-2.5 rounded text-sm font-medium hover:bg-gray-200 transition flex items-center justify-start gap-2"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto ml-64" style={{ marginTop: '64px' }}>
        <div className="max-w-6xl mx-auto pt-6 px-6 pr-12 pb-20">
          {/* Content Container */}
          <div className="px-20 pt-8 pb-20">

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
                      {isSubmitting ? (
                        <p className="text-sm text-gray-600 mt-3 font-medium">
                          PDF is being generated... Wait for download button to appear
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-3">
                          Once submitted, you cannot edit the survey
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

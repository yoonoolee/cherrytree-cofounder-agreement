import React, { useState, useRef } from 'react';
import SurveyNavigation from './SurveyNavigation';
import AgreementHeader from './AgreementHeader';
import { useProjectSync } from '../hooks/useProjectSync';

const FINAL_AGREEMENT_ID = 'final-agreement';

function FinalAgreement({ projectId, allProjects = [], onProjectSwitch, onEdit, onCreateProject }) {
  // UI state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(FINAL_AGREEMENT_ID);

  // Refs and hooks for form data
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

  // Get latest PDF URL from pdfAgreements array
  const latestPdfUrl = project?.latestPdfUrl || null;

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading final agreement...</div>
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
        onReviewAndApproveClick={() => onEdit('generated-agreement')} // Navigate to Preview page
        onFinalAgreementClick={() => setCurrentSection(FINAL_AGREEMENT_ID)}
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
            <div>
              {/* Header */}
              <AgreementHeader project={project} title="Final Agreement" />

              {/* PDF Viewer */}
              {latestPdfUrl ? (
                <div className="border border-gray-200 rounded overflow-hidden bg-white shadow-sm mb-8">
                  <iframe
                    src={getEmbedUrl(latestPdfUrl)}
                    className="w-full h-[900px]"
                    title="Final Cofounder Agreement"
                    frameBorder="0"
                    allow="autoplay"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded">
                  <p className="text-gray-900 font-medium">No final agreement available yet</p>
                  <p className="text-sm text-gray-500 mt-2">Submit your agreement from the Review and Approve page</p>
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

export default FinalAgreement;

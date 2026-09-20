import { useState, useRef } from 'react';
import type { SectionId } from '@cherrytree/shared';

import SurveyNavigation from './SurveyNavigation.tsx';
import AgreementHeader from './AgreementHeader.tsx';
import { useProjectSync } from '../hooks/useProjectSync.ts';
import { getEmbedUrl } from '../utils/getEmbedUrl.ts';
import { FINAL_AGREEMENT_ID, GENERATED_AGREEMENT_ID } from '../config/sectionConfig.ts';

interface FinalAgreementProps {
  projectId: string;
  /** Leave for a survey section, or for the Review & Approve page (`GENERATED_AGREEMENT_ID`). */
  onEdit: (sectionId: SectionId | typeof GENERATED_AGREEMENT_ID) => void;
}

function FinalAgreement({ projectId, onEdit }: FinalAgreementProps) {
  // UI state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Refs and hooks for form data
  const isSavingRef = useRef(false);
  const { project } = useProjectSync(projectId, isSavingRef);

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
        currentSection={FINAL_AGREEMENT_ID}
        onSectionClick={(sectionId) => onEdit(sectionId)} // Navigate back to survey at specific section
        onReviewAndApproveClick={() => onEdit(GENERATED_AGREEMENT_ID)} // Navigate to Preview page
        onFinalAgreementClick={() => {}} // Already here; keeps the entry in the navigation
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
                  <p className="text-sm text-gray-500 mt-2">
                    Submit your agreement from the Review and Approve page
                  </p>
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

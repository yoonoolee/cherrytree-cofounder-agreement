import React, { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentModal from './PaymentModal';
import UpgradeModal from './UpgradeModal';
import { SECTION_ORDER, SECTIONS as SECTION_CONFIG } from '../config/sectionConfig';
import { useProjectSync } from '../hooks/useProjectSync';
import { useValidation } from '../hooks/useValidation';
import { useCollaborators } from '../hooks/useCollaborators';

// Sidebar is a fixed 210px with 32px padding on each side of the name (see style below).
const NAME_MAX_FONT_SIZE = 42;
const NAME_MIN_FONT_SIZE = 20;
const NAME_AVAILABLE_WIDTH = 210 - 32 * 2;
const NAME_FONT_FAMILY = "'Instrument Serif', serif";

function getFitFontSize(text) {
  if (!text) return NAME_MAX_FONT_SIZE;
  const canvas = getFitFontSize.canvas || (getFitFontSize.canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  for (let size = NAME_MAX_FONT_SIZE; size > NAME_MIN_FONT_SIZE; size -= 1) {
    ctx.font = `400 ${size}px ${NAME_FONT_FAMILY}`;
    if (ctx.measureText(text).width <= NAME_AVAILABLE_WIDTH) return size;
  }
  return NAME_MIN_FONT_SIZE;
}

/**
 * Self-contained navigation component with all hooks and logic.
 * Used identically on both Survey and Preview pages.
 */
function SurveyNavigation({
  projectId,
  currentSection,
  onSectionClick,
  onReviewAndApproveClick,
  onFinalAgreementClick = null,
  allProjects = [],
  onProjectSwitch = null,
  onCreateProject = null,
  isMobileNavOpen = false,
  setIsMobileNavOpen = () => {},
  onManageCollaborators = null,
}) {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isSavingRef = useRef(false);
  const { project } = useProjectSync(projectId, isSavingRef);
  const { calculateProgress, isSectionCompleted } = useValidation(project?.surveyData || {}, project);
  const { collaboratorIds, getDisplayName } = useCollaborators(project);

  const [nameFontSize, setNameFontSize] = useState(NAME_MAX_FONT_SIZE);
  useLayoutEffect(() => {
    setNameFontSize(getFitFontSize(project?.name));
  }, [project?.name]);

  const progress = calculateProgress ? calculateProgress() : 0;
  const sectionsRemaining = SECTION_ORDER.filter(id => !isSectionCompleted(id)).length;

  const allSectionsComplete = isSectionCompleted
    ? SECTION_ORDER.every(id => isSectionCompleted(id))
    : false;
  const hasSubmittedAgreement = (project?.pdfAgreements?.length || 0) > 0;

  const getSectionDotClass = (sectionId) => {
    if (currentSection === sectionId) return 'nav-dot active';
    if (isSectionCompleted && isSectionCompleted(sectionId)) return 'nav-dot done';
    return 'nav-dot notstarted';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-[99]"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      {!isMobileNavOpen && (
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="md:hidden fixed top-4 left-4 z-[101] p-2 bg-white rounded-lg shadow-md border border-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <div
        className={`survey-sidebar-bg flex flex-col fixed h-screen transition-transform duration-300 md:translate-x-0 top-0 z-[100] ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '210px' }}
      >
        {/* Logo */}
        <div style={{ padding: '16px 32px 0' }}>
          <svg width="42" height="42" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
            <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="#1a1a1a" shapeRendering="geometricPrecision"/>
          </svg>
        </div>

        {/* Company name */}
        <div
          style={{
            fontFamily: NAME_FONT_FAMILY,
            fontSize: `${nameFontSize}px`,
            fontWeight: 400,
            padding: '32px 32px 10px',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
            color: '#1a1a1a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {project?.name || '—'}
        </div>

        {/* Progress */}
        <div style={{ padding: '0 32px' }}>
          <div style={{ fontSize: '12px', fontWeight: 300, color: '#555', marginBottom: '6px' }}>
            {progress}% Complete
          </div>
          <div style={{ height: '3px', background: '#d6d2c9', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#4B7263', borderRadius: '2px', transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 300, color: '#aaa', marginTop: '5px', marginBottom: '18px' }}>
            {sectionsRemaining} section{sectionsRemaining !== 1 ? 's' : ''} remaining
          </div>
        </div>

        {/* Section nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 100, color: '#aaa', padding: '0 32px 10px', letterSpacing: '0.01em' }}>
            Sections
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {SECTION_ORDER.map((sectionId) => {
              const sectionConfig = SECTION_CONFIG[sectionId];
              const isActive = currentSection === sectionId;
              const isDone = isSectionCompleted && isSectionCompleted(sectionId);
              return (
                <li key={sectionId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 32px', marginBottom: '10px' }}>
                  <span className={getSectionDotClass(sectionId)} />
                  <button
                    data-section-id={sectionId}
                    onClick={() => { onSectionClick(sectionId); setIsMobileNavOpen(false); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontSize: '13px',
                      fontWeight: isActive ? 400 : 300,
                      color: isDone ? '#4B7263' : isActive ? '#1a1a1a' : '#888',
                      textAlign: 'left',
                      fontFamily: 'Outfit, sans-serif',
                      transition: 'color 0.15s',
                    }}
                  >
                    {sectionConfig.displayName}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Final actions */}
          <div style={{ borderTop: '1px solid #d6d2c9', margin: '10px 32px 10px', paddingTop: '10px' }}>
            <button
              onClick={() => { if (allSectionsComplete) { onReviewAndApproveClick(); setIsMobileNavOpen(false); } }}
              disabled={!allSectionsComplete}
              style={{
                background: 'none', border: 'none', cursor: allSectionsComplete ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '5px 0', width: '100%',
                fontSize: '13px', fontWeight: 300,
                color: allSectionsComplete ? '#1a1a1a' : '#ccc',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              <span className={`nav-dot ${allSectionsComplete ? 'notstarted' : 'notstarted'}`} style={{ borderColor: allSectionsComplete ? '#888' : '#ddd' }} />
              Review &amp; Approve
            </button>

            {onFinalAgreementClick && (
              <button
                onClick={() => { if (hasSubmittedAgreement) { onFinalAgreementClick(); setIsMobileNavOpen(false); } }}
                disabled={!hasSubmittedAgreement}
                style={{
                  background: 'none', border: 'none', cursor: hasSubmittedAgreement ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '5px 0', width: '100%',
                  fontSize: '13px', fontWeight: 300,
                  color: hasSubmittedAgreement ? '#1a1a1a' : '#ccc',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                <span className="nav-dot notstarted" style={{ borderColor: hasSubmittedAgreement ? '#888' : '#ddd' }} />
                Final Agreement
              </button>
            )}
          </div>
        </div>

        {/* Collaborators box */}
        {collaboratorIds.length > 0 && (
          <div style={{ padding: '0 20px 12px' }}>
            <div style={{ background: '#C7CECB', borderRadius: '6px', padding: '10px 12px 8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#3a3a3a', marginBottom: '6px' }}>
                Current Cofounders
              </div>
              {collaboratorIds.map(id => (
                <div key={id} style={{ fontSize: '13px', fontWeight: 300, color: '#2a2a2a', padding: '2px 0' }}>
                  {getDisplayName(id)}
                </div>
              ))}
            </div>
            {onManageCollaborators && (
              <button
                onClick={onManageCollaborators}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '8px', fontSize: '12px', fontWeight: 300, color: '#666', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'Outfit, sans-serif', width: '100%', paddingRight: '4px' }}
              >
                Manage
              </button>
            )}
          </div>
        )}

        {/* Bottom actions */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {project?.currentPlan !== 'pro' && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: '6px 12px',
                fontSize: '12px', fontWeight: 300,
                color: '#888', fontFamily: 'Outfit, sans-serif',
                borderRadius: '4px', transition: 'color 0.15s',
              }}
            >
              ↑ Upgrade
            </button>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileNavOpen(false)}
          className="md:hidden"
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} onSuccess={(id) => { setShowPaymentModal(false); if (id) navigate(`/survey/${id}`); }} />
      )}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} currentPlan={project?.currentPlan || 'starter'} />
      )}
    </>
  );
}

export default SurveyNavigation;

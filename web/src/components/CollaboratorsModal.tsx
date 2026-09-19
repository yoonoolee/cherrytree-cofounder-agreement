import type { ProjectWithId } from '../hooks/useProjectSync.ts';
import CollaboratorManager from './CollaboratorManager.tsx';

interface CollaboratorsModalProps {
  project: Pick<ProjectWithId, 'id' | 'editDeadline'>;
  onClose: () => void;
}

/** The Collaborators dialog behind the navigation's Manage button (Survey and Preview pages). */
function CollaboratorsModal({ project, onClose }: CollaboratorsModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        style={{ zIndex: 10000 }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          background: '#F6F3EE',
          borderRadius: '8px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          width: '90vw',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        <div
          style={{
            padding: '22px 26px 18px',
            borderBottom: '1px solid #d6d2c9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: '22px',
              fontWeight: 400,
              color: '#1a1a1a',
            }}
          >
            Collaborators
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#aaa',
              lineHeight: 1,
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '22px 26px 26px' }}>
          <CollaboratorManager project={project} />
        </div>
      </div>
    </>
  );
}

export default CollaboratorsModal;

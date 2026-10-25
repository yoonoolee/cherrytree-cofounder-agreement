import { useEffect } from 'react';
import { Link } from 'react-router';
import { serverTimestamp, updateDoc } from 'firebase/firestore';

import { useProjectId } from '../hooks/useProjectId.ts';
import { projectRef } from '../lib/firebase.ts';

/** A project's workspace. Placeholder until the agent product UI is built. */
function ProjectPage() {
  const projectId = useProjectId();

  // The dashboard orders projects by when they were last opened.
  useEffect(() => {
    updateDoc(projectRef(projectId), { lastOpened: serverTimestamp() }).catch((error: unknown) => {
      console.error('Error updating lastOpened:', error);
    });
  }, [projectId]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: '#F6F3EE',
        fontFamily: "'Outfit', sans-serif",
        color: '#1a1a1a',
      }}
    >
      <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '40px', fontWeight: 200 }}>
        Coming soon
      </h1>
      <Link to="/dashboard" style={{ fontSize: '14px', fontWeight: 300, color: '#4e7068' }}>
        Back to dashboard
      </Link>
    </div>
  );
}

export default ProjectPage;

import { useEffect } from 'react';
import { serverTimestamp, updateDoc } from 'firebase/firestore';

import AdvisorView from '../components/advisor/AdvisorView.tsx';
import DraftStatusView from '../components/draft/DraftStatusView.tsx';
import ProjectLayout from '../components/ProjectLayout.tsx';
import { useProject } from '../hooks/useProject.ts';
import { useProjectId } from '../hooks/useProjectId.ts';
import { projectRef } from '../lib/firebase.ts';

/** A project's workspace: the Advisor interview until the draft starts, then the draft. */
function ProjectPage() {
  const projectId = useProjectId();
  const project = useProject(projectId);

  // The dashboard orders projects by when they were last opened.
  useEffect(() => {
    updateDoc(projectRef(projectId), { lastOpened: serverTimestamp() }).catch((error: unknown) => {
      console.error('Error updating lastOpened:', error);
    });
  }, [projectId]);

  if (project.status !== 'ready') {
    return (
      <ProjectLayout>
        <p className="text-sm font-light text-ink-muted">
          {project.status === 'loading'
            ? 'Loading your project…'
            : "We couldn't load this project."}
        </p>
      </ProjectLayout>
    );
  }

  const { draftStatus } = project.project;
  // Keyed so another project starts from a clean state.
  return draftStatus === null ? (
    <AdvisorView key={projectId} projectId={projectId} />
  ) : (
    <DraftStatusView key={projectId} projectId={projectId} status={draftStatus} />
  );
}

export default ProjectPage;

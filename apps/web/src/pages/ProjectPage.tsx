import { lazy, Suspense, useEffect } from 'react';
import { serverTimestamp, updateDoc } from 'firebase/firestore';

import AdvisorView from '../components/advisor/AdvisorView.tsx';
import DraftStatusView from '../components/draft/DraftStatusView.tsx';
import ProjectLayout from '../components/ProjectLayout.tsx';
import DraftSkeleton from '../components/status/DraftSkeleton.tsx';
import ErrorState from '../components/status/ErrorState.tsx';
import ProjectSkeleton from '../components/status/ProjectSkeleton.tsx';
import { PROJECT_LOAD_ERROR } from '../constants/project.ts';
import { useProject } from '../hooks/useProject.ts';
import { useProjectId } from '../hooks/useProjectId.ts';
import { useUser } from '../hooks/useUser.ts';
import { projectRef } from '../lib/firebase.ts';

// The editor (Plate) loads only once there is a draft to edit.
const DraftView = lazy(() => import('../components/editor/DraftView.tsx'));

/**
 * A project's workspace: the Advisor interview, then the draft being written, then the editor.
 */
function ProjectWorkspace({ projectId }: { projectId: string }) {
  const project = useProject(projectId);

  // The dashboard orders projects by when they were last opened.
  useEffect(() => {
    updateDoc(projectRef(projectId), { lastOpened: serverTimestamp() }).catch((error: unknown) => {
      console.error('Error updating lastOpened:', error);
    });
  }, [projectId]);

  if (project.status === 'loading') return <ProjectSkeleton />;
  if (project.status === 'error') {
    const copy = project.missing ? PROJECT_LOAD_ERROR.missing : PROJECT_LOAD_ERROR.failed;
    return (
      <ProjectLayout>
        <ErrorState {...copy} onRetry={project.missing ? undefined : project.retry} />
      </ProjectLayout>
    );
  }

  const { draftStatus, draftStartedAt } = project.project;
  // Keyed so another project starts from a clean state.
  if (draftStatus === null) return <AdvisorView key={projectId} projectId={projectId} />;
  if (draftStatus === 'ready') {
    return (
      <Suspense fallback={<DraftSkeleton />}>
        <DraftView key={projectId} projectId={projectId} />
      </Suspense>
    );
  }
  return (
    <DraftStatusView
      key={projectId}
      projectId={projectId}
      status={draftStatus}
      startedAt={draftStartedAt?.toDate() ?? null}
    />
  );
}

/** Waits for the Firebase session, which every project read needs, then opens the project. */
function ProjectPage() {
  const projectId = useProjectId();
  const { loading, authFailed, retryAuth } = useUser();

  if (authFailed) {
    return (
      <ProjectLayout>
        <ErrorState {...PROJECT_LOAD_ERROR.signIn} onRetry={retryAuth} />
      </ProjectLayout>
    );
  }
  if (loading) return <ProjectSkeleton />;
  return <ProjectWorkspace projectId={projectId} />;
}

export default ProjectPage;

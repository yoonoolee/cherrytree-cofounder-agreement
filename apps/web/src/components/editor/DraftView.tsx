import DraftEditor from './DraftEditor.tsx';
import ProjectLayout from '../ProjectLayout.tsx';
import ErrorState from '../status/ErrorState.tsx';
import DraftSkeleton from '../status/DraftSkeleton.tsx';
import { EDITOR_COPY } from '../../constants/editor.ts';
import { PROJECT_LOAD_ERROR } from '../../constants/project.ts';
import { useDraftEditor } from '../../hooks/useDraftEditor.ts';

/** The finished draft: loads it, then opens the editor. */
function DraftView({ projectId }: { projectId: string }) {
  const data = useDraftEditor(projectId);
  if (data.status === 'loading') return <DraftSkeleton />;
  if (data.status === 'error') {
    return (
      <ProjectLayout>
        <ErrorState
          title={EDITOR_COPY.loadError}
          body={PROJECT_LOAD_ERROR.failed.body}
          onRetry={data.retry}
        />
      </ProjectLayout>
    );
  }
  return (
    <DraftEditor
      projectId={projectId}
      initialContent={data.draft.content}
      initialVersion={data.draft.version}
      threads={data.threads}
      edits={data.edits}
    />
  );
}

export default DraftView;

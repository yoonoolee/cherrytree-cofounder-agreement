import { useNavigate } from 'react-router-dom';
import type { SectionId } from '@cherrytree/shared';

import Preview from '../components/Preview.tsx';
import { useProjectId } from '../hooks/useProjectId.ts';

function PreviewPage() {
  const projectId = useProjectId();
  const navigate = useNavigate();

  const handleEdit = (sectionId: SectionId) => {
    navigate(`/survey/${projectId}?section=${sectionId}`);
  };

  return <Preview projectId={projectId} onEdit={handleEdit} />;
}

export default PreviewPage;

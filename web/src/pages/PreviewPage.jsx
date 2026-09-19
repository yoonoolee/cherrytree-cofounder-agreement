import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Preview from '../components/Preview';

function PreviewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const handleEdit = (sectionId = null) => {
    const url = sectionId ? `/survey/${projectId}?section=${sectionId}` : `/survey/${projectId}`;
    navigate(url);
  };

  return <Preview projectId={projectId} onEdit={handleEdit} />;
}

export default PreviewPage;

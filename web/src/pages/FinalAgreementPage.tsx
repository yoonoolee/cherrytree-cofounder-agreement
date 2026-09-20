import { useNavigate } from 'react-router-dom';
import type { SectionId } from '@cherrytree/shared';

import FinalAgreement from '../components/FinalAgreement.tsx';
import { GENERATED_AGREEMENT_ID } from '../config/sectionConfig.ts';
import { useProjectId } from '../hooks/useProjectId.ts';

function FinalAgreementPage() {
  const projectId = useProjectId();
  const navigate = useNavigate();

  const handleEdit = (sectionId: SectionId | typeof GENERATED_AGREEMENT_ID) => {
    if (sectionId === GENERATED_AGREEMENT_ID) {
      // Navigate to Preview page for Review and Approve
      navigate(`/preview/${projectId}`);
    } else {
      // Navigate to Survey page for regular sections
      navigate(`/survey/${projectId}?section=${sectionId}`);
    }
  };

  return <FinalAgreement projectId={projectId} onEdit={handleEdit} />;
}

export default FinalAgreementPage;

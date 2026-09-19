import { toDate, type Project } from '@cherrytree/shared';

import { formatDeadline, isAfterEditDeadline, isProjectReadOnly } from '../utils/dateUtils.ts';

interface AgreementHeaderProps {
  project: Pick<Project, 'pdfAgreements' | 'editDeadline' | 'previewPdfGeneratedAt'>;
  title: string;
}

function AgreementHeader({ project, title }: AgreementHeaderProps) {
  const isReadOnly = isProjectReadOnly(project);
  const lastAgreement = project.pdfAgreements?.[project.pdfAgreements.length - 1];

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500">
        {lastAgreement ? (
          <>
            Last submitted on {toDate(lastAgreement.generatedAt).toLocaleDateString()}.
            {!isReadOnly && project.editDeadline && (
              <>
                {' '}
                {isAfterEditDeadline(project.editDeadline)
                  ? project.previewPdfGeneratedAt
                    ? `Edit window expired on ${formatDeadline(project.editDeadline)}.`
                    : 'You will not be able to edit this agreement once it has been generated.'
                  : `You can continue to edit and regenerate the agreement until ${formatDeadline(project.editDeadline)}.`}
              </>
            )}
          </>
        ) : (
          'Preview - Not yet submitted'
        )}
      </p>
    </div>
  );
}

export default AgreementHeader;

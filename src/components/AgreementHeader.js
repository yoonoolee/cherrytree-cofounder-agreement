import React from 'react';
import { formatDeadline, isAfterEditDeadline, isProjectReadOnly } from '../utils/dateUtils';

function AgreementHeader({ project, title }) {
  const isReadOnly = isProjectReadOnly(project);

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500">
        {project.pdfAgreements && project.pdfAgreements.length > 0 ? (
          <>
            Last submitted on {project.pdfAgreements[project.pdfAgreements.length - 1].generatedAt.toDate().toLocaleDateString()}.
            {!isReadOnly && project.editDeadline && (
              <>
                {' '}
                {isAfterEditDeadline(project.editDeadline)
                  ? (project.previewPdfGeneratedAt
                      ? `Edit window expired on ${formatDeadline(project.editDeadline)}.`
                      : 'You will not be able to edit this agreement once it has been generated.')
                  : `You can continue to edit and regenerate the agreement until ${formatDeadline(project.editDeadline)}.`
                }
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

import React from 'react';
import { auth } from '../firebase';
import Tooltip from './Tooltip';

function Section9NonCompete({ formData, handleChange, isReadOnly, project, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Confidentiality, Non-Competition & Non-Solicitation</h2>
      <p className="text-gray-600 mb-8">Protections for company interests</p>


      <div className="space-y-12">
        {/* Acknowledge Confidentiality */}
        <div className="">
          <p className="text-gray-700 mb-4">
            {(() => {
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgeConfidentiality?.[email]);
              return (
                <>
                  Each Cofounder agrees to hold all Confidential Information in strict confidence and not to disclose any Confidential Information to any third party without the Company's prior written consent.
                  {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                </>
              );
            })()}
          </p>
          <div className="space-y-2 mt-3 pl-4">

            {(() => {
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const approvals = formData.acknowledgeConfidentiality || {};
              const currentUserEmail = auth.currentUser?.email;

              return allCollaborators.map((email, index) => {
                const isApproved = approvals[email] || false;
                const isCurrentUser = email === currentUserEmail;

                return (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => {
                        const newApprovals = { ...approvals, [email]: e.target.checked };
                        handleChange('acknowledgeConfidentiality', newApprovals);
                      }}
                      disabled={isReadOnly || !isCurrentUser}
                      className="mr-3"
                    />
                    <span className="text-gray-700">
                      {email}
                      {email === project?.ownerEmail && <span className="ml-2 text-xs text-gray-500">(Owner)</span>}
                      {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                      
                    </span>
                  </label>
                );
              });
            })()}
          </div>
        </div>

        {/* Non-Competition Duration */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How long should the non-competition obligation last after a cofounder leaves?
            <Tooltip text="This includes joining or starting a competing company." />
            {showValidation && !formData.nonCompeteDuration && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <div className="space-y-2">
            {[
              '6 months',
              '1 year',
              '2 years',
              'No non-competition clause',
              'Other'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="nonCompeteDuration"
                  value={option}
                  checked={formData.nonCompeteDuration === option}
                  onChange={(e) => handleChange('nonCompeteDuration', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {formData.nonCompeteDuration === 'Other' && (
            <input
              type="text"
              value={formData.nonCompeteDurationOther || ''}
              onChange={(e) => handleChange('nonCompeteDurationOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}
        </div>

        {/* Non-Solicitation Duration */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How long should the non-solicitation obligation last after a cofounder leaves?
            {showValidation && !formData.nonSolicitDuration && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <div className="space-y-2">
            {[
              '6 months',
              '1 year',
              '2 years',
              'No non-solicitation clause',
              'Other'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="nonSolicitDuration"
                  value={option}
                  checked={formData.nonSolicitDuration === option}
                  onChange={(e) => handleChange('nonSolicitDuration', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {formData.nonSolicitDuration === 'Other' && (
            <input
              type="text"
              value={formData.nonSolicitDurationOther || ''}
              onChange={(e) => handleChange('nonSolicitDurationOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Section9NonCompete;

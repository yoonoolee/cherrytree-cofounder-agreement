import React from 'react';
import { useUser } from '../contexts/UserContext';
import { useCollaborators } from '../hooks/useCollaborators';
import { NON_COMPETE_DURATIONS, NON_SOLICIT_DURATIONS } from '../config/surveySchema';
import Tooltip from './Tooltip';
import { FIELDS } from '../config/surveySchema';

function SectionNonCompete({ formData, handleChange, isReadOnly, project, showValidation }) {
  const { currentUser } = useUser();
  const { collaboratorIds, getDisplayName, isAdmin } = useCollaborators(project);

  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Confidentiality, Non-Competition & Non-Solicitation</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        You know how when you go to a bar with your friend, you have an unspoken agreement to not hit on the same person? Confidentiality, Non-Competition and Non-Solicitation kind of work the same way. They take the unspoken worries off the table so nothing turns awkward later. Make sure everyone knows what's off limits.
      </p>

      <div className="space-y-12">
        {/* Acknowledge Confidentiality */}
        <div className="">
          <p className="text-gray-700 mb-4">
            {(() => {
              const allAcknowledged = collaboratorIds.length > 0 && collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY]?.[userId]);
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
              const approvals = formData[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY] || {};
              const currentUserId = currentUser?.id;

              return collaboratorIds.map((userId) => {
                const isApproved = approvals[userId] || false;
                const isCurrentUser = userId === currentUserId;
                const displayName = getDisplayName(userId);

                return (
                  <label key={userId} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => {
                        const newApprovals = { ...approvals, [userId]: e.target.checked };
                        handleChange('acknowledgeConfidentiality', newApprovals);
                      }}
                      disabled={isReadOnly || !isCurrentUser}
                      className="mr-3"
                    />
                    <span className="text-gray-700">
                      {displayName}
                      {isAdmin(userId) && <span className="ml-2 text-xs text-gray-500">(Admin)</span>}
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
            {showValidation && !formData[FIELDS.NON_COMPETE_DURATION] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
            <Tooltip text="This includes joining or starting a competing company. Note: Non-compete agreements may not be enforceable in certain states (e.g., California)." />
          </label>
          <div className="space-y-2">
            {NON_COMPETE_DURATIONS.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="nonCompeteDuration"
                  value={option}
                  checked={formData[FIELDS.NON_COMPETE_DURATION] === option}
                  onClick={() => {
                    if (!isReadOnly) {
                      handleChange('nonCompeteDuration', formData[FIELDS.NON_COMPETE_DURATION] === option ? '' : option);
                    }
                  }}
                  onChange={() => {}}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {formData[FIELDS.NON_COMPETE_DURATION] === 'Other' && (
            <input
              type="text"
              value={formData[FIELDS.NON_COMPETE_DURATION_OTHER] || ''}
              onChange={(e) => handleChange('nonCompeteDurationOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}
        </div>

        {/* Non-Solicitation Duration */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How long should the non-solicitation obligation last after a cofounder leaves?
            {showValidation && !formData[FIELDS.NON_SOLICIT_DURATION] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
            <Tooltip text="Non-solicitation prevents a cofounder who leaves from recruiting the Company's team or clients for a certain period." />
          </label>
          <div className="space-y-2">
            {NON_SOLICIT_DURATIONS.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="nonSolicitDuration"
                  value={option}
                  checked={formData[FIELDS.NON_SOLICIT_DURATION] === option}
                  onClick={() => {
                    if (!isReadOnly) {
                      handleChange('nonSolicitDuration', formData[FIELDS.NON_SOLICIT_DURATION] === option ? '' : option);
                    }
                  }}
                  onChange={() => {}}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {formData[FIELDS.NON_SOLICIT_DURATION] === 'Other' && (
            <input
              type="text"
              value={formData[FIELDS.NON_SOLICIT_DURATION_OTHER] || ''}
              onChange={(e) => handleChange('nonSolicitDurationOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SectionNonCompete;

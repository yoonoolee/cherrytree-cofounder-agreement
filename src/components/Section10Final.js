import React from 'react';
import { US_STATES } from './surveyConstants';
import { useUser } from '../contexts/UserContext';
import { useCollaborators } from '../hooks/useCollaborators';
import CustomSelect from './CustomSelect';

function Section10Final({ formData, handleChange, isReadOnly, project, showValidation }) {
  const { currentUser } = useUser();
  const { collaboratorIds, getDisplayName, isAdmin } = useCollaborators(project);

  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">General Provisions</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Last stretch! Knock out these last few questions, then review and green-light your agreement.
      </p>

      <div className="space-y-12">
        {/* Governing Law */}
        <div style={{ overflow: 'visible', position: 'relative', zIndex: 100, marginBottom: '3rem' }}>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Which state's laws will govern this agreement?
            {showValidation && !formData.governingLaw && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <CustomSelect
            value={formData.governingLaw || ''}
            onChange={(value) => handleChange('governingLaw', value)}
            options={US_STATES.map(state => ({
              value: state.label,
              label: `${state.label} (${state.value})`
            }))}
            placeholder="Select state"
            disabled={isReadOnly}
          />
        </div>

        {/* Amendment Process */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How can this agreement be amended or modified?
            {showValidation && !formData.amendmentProcess && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <div className="space-y-2">
            {[
              'Unanimous written consent of all cofounders',
              'Majority vote of cofounders',
              'Other'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="amendmentProcess"
                  value={option}
                  checked={formData.amendmentProcess === option}
                  onClick={() => {
                    if (!isReadOnly) {
                      handleChange('amendmentProcess', formData.amendmentProcess === option ? '' : option);
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

          {formData.amendmentProcess === 'Other' && (
            <input
              type="text"
              value={formData.amendmentProcessOther || ''}
              onChange={(e) => handleChange('amendmentProcessOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}
        </div>

        {/* Periodic Review */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How often (in months) should this agreement be reviewed by the cofounders?
            {showValidation && !formData.reviewFrequencyMonths && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="number"
            min="0"
            value={formData.reviewFrequencyMonths || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (parseInt(value) >= 0 && !value.includes('-'))) {
                handleChange('reviewFrequencyMonths', value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            disabled={isReadOnly}
            className="w-full bg-transparent border-none border-b-2 border-gray-300 py-3 text-gray-700 focus:outline-none focus:border-black disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Enter number of months"
            style={{
              paddingLeft: 0,
              borderBottom: '2px solid #D1D5DB',
            }}
          />
        </div>

        {/* Periodic Review Acknowledgment */}
        <div className="">
          <p className="text-gray-700 mb-4">
            {(() => {
              const allAcknowledged = collaboratorIds.length > 0 && collaboratorIds.every(userId => formData.acknowledgePeriodicReview?.[userId]);
              return (
                <>
                  Each Cofounder acknowledges that this Agreement shall be reviewed every {formData.reviewFrequencyMonths ? `${formData.reviewFrequencyMonths} month${formData.reviewFrequencyMonths !== '1' ? 's' : ''}` : '[frequency not specified]'} to ensure it remains current and effective.
                  {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                </>
              );
            })()}
          </p>
          <div className="space-y-2 mt-3 pl-4">

            {(() => {
              const approvals = formData.acknowledgePeriodicReview || {};
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
                        handleChange('acknowledgePeriodicReview', newApprovals);
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

        {/* Amendment Review Request Acknowledgment */}
        <div className="">
          <p className="text-gray-700 mb-4">
            {(() => {
              const allAcknowledged = collaboratorIds.length > 0 && collaboratorIds.every(userId => formData.acknowledgeAmendmentReviewRequest?.[userId]);
              return (
                <>
                  Any Cofounder may request a review of this Agreement in the event of material changes in circumstances affecting the Company or the Cofounder's role. Any amendments proposed pursuant to such review shall become effective only if approved and executed in writing according to the amendment process set forth in this Agreement.
                  {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                </>
              );
            })()}
          </p>
          <div className="space-y-2 mt-3 pl-4">

            {(() => {
              const approvals = formData.acknowledgeAmendmentReviewRequest || {};
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
                        handleChange('acknowledgeAmendmentReviewRequest', newApprovals);
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

        {/* Entire Agreement Acknowledgment */}
        <div className="">
          <p className="text-gray-700 mb-4">
            {(() => {
              const allAcknowledged = collaboratorIds.length > 0 && collaboratorIds.every(userId => formData.acknowledgeEntireAgreement?.[userId]);
              return (
                <>
                  Each Cofounder acknowledges that this Agreement constitutes the entire agreement between the Cofounders regarding the subject matter hereof and supersedes all prior agreements, understandings, negotiations, and discussions, whether oral or written.
                  {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                </>
              );
            })()}
          </p>
          <div className="space-y-2 mt-3 pl-4">

            {(() => {
              const approvals = formData.acknowledgeEntireAgreement || {};
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
                        handleChange('acknowledgeEntireAgreement', newApprovals);
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

        {/* Severability Acknowledgment */}
        <div className="">
          <p className="text-gray-700 mb-4">
            {(() => {
              const allAcknowledged = collaboratorIds.length > 0 && collaboratorIds.every(userId => formData.acknowledgeSeverability?.[userId]);
              return (
                <>
                  Each Cofounder acknowledges that if any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
                  {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                </>
              );
            })()}
          </p>
          <div className="space-y-2 mt-3 pl-4">

            {(() => {
              const approvals = formData.acknowledgeSeverability || {};
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
                        handleChange('acknowledgeSeverability', newApprovals);
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

        {/* Final Note */}
        <div>
          <p className="text-xs text-gray-900">
            <strong>Important:</strong> This document is a starting point and should be reviewed by a qualified attorney before signing. Laws vary by jurisdiction, and this agreement may not cover all scenarios relevant to your specific situation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Section10Final;

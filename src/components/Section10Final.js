import React, { useRef } from 'react';
import { US_STATES } from './surveyConstants';
import { auth } from '../firebase';

function Section10Final({ formData, handleChange, isReadOnly, project, showValidation }) {
  const inputRef = useRef(null);
  const isDeleting = useRef(false);

  const findMatch = (input) => {
    if (!input) return '';
    const match = US_STATES.find(state =>
      state.label.toLowerCase().startsWith(input.toLowerCase())
    );
    return match ? match.label : '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      isDeleting.current = true;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleGoverningLawChange = (e) => {
    const value = e.target.value;

    // Don't autocomplete if user is deleting
    if (isDeleting.current) {
      isDeleting.current = false;
      handleChange('governingLaw', value);
      return;
    }

    if (value) {
      // Check if the typed value matches any state
      const matchesAnyState = US_STATES.some(state =>
        state.label.toLowerCase().startsWith(value.toLowerCase())
      );

      // Only allow typing if it matches a state
      if (!matchesAnyState) {
        return; // Don't update if it doesn't match any state
      }

      const match = findMatch(value);
      if (match && match.toLowerCase().startsWith(value.toLowerCase())) {
        handleChange('governingLaw', match);
        // Set cursor position after the typed text
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(value.length, match.length);
          }
        }, 0);
      } else {
        handleChange('governingLaw', value);
      }
    } else {
      handleChange('governingLaw', value);
    }
  };

  const handleGoverningLawBlur = () => {
    const value = formData.governingLaw;
    if (value) {
      const isExactMatch = US_STATES.some(state =>
        state.label.toLowerCase() === value.toLowerCase()
      );
      if (!isExactMatch) {
        const match = findMatch(value);
        if (match) {
          handleChange('governingLaw', match);
        } else {
          handleChange('governingLaw', '');
        }
      }
    }
  };
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Final Details</h2>
      <p className="text-gray-600 mb-8">Dispute resolution and governing law</p>


      <div className="space-y-12">
        {/* Dispute Resolution */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How should disputes among cofounders be resolved?
            {showValidation && !formData.disputeResolution && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <div className="space-y-2">
            {[
              'Mediation first, then arbitration if mediation fails',
              'Binding arbitration',
              'Litigation in courts',
              'Other'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="disputeResolution"
                  value={option}
                  checked={formData.disputeResolution === option}
                  onChange={(e) => handleChange('disputeResolution', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {formData.disputeResolution === 'Other' && (
            <input
              type="text"
              value={formData.disputeResolutionOther || ''}
              onChange={(e) => handleChange('disputeResolutionOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}
        </div>

        {/* Governing Law */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Which state's laws will govern this agreement?
            {showValidation && !formData.governingLaw && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={formData.governingLaw || ''}
            onChange={handleGoverningLawChange}
            onKeyDown={handleKeyDown}
            onBlur={handleGoverningLawBlur}
            disabled={isReadOnly}
            className="w-full bg-transparent border-none border-b-2 border-gray-300 py-3 text-gray-700 focus:outline-none focus:border-black disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Start typing state..."
            style={{
              paddingLeft: 0,
              borderBottom: '2px solid #D1D5DB',
            }}
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
                  onChange={(e) => handleChange('amendmentProcess', e.target.value)}
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
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgePeriodicReview?.[email]);
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
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const approvals = formData.acknowledgePeriodicReview || {};
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
                        handleChange('acknowledgePeriodicReview', newApprovals);
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

        {/* Amendment Review Request Acknowledgment */}
        <div className="">
          <p className="text-gray-700 mb-4">
            {(() => {
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgeAmendmentReviewRequest?.[email]);
              return (
                <>
                  Any Cofounder may request a review of this Agreement in the event of material changes in circumstances affecting the Company or the Cofounder's role. Any amendments proposed pursuant to such review shall become effective only if approved and executed in writing by all Cofounders.
                  {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                </>
              );
            })()}
          </p>
          <div className="space-y-2 mt-3 pl-4">

            {(() => {
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const approvals = formData.acknowledgeAmendmentReviewRequest || {};
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
                        handleChange('acknowledgeAmendmentReviewRequest', newApprovals);
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

        {/* Entire Agreement Acknowledgment */}
        <div className="">
          <p className="text-gray-700 mb-4">
            {(() => {
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgeEntireAgreement?.[email]);
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
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const approvals = formData.acknowledgeEntireAgreement || {};
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
                        handleChange('acknowledgeEntireAgreement', newApprovals);
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

        {/* Severability Acknowledgment */}
        <div className="">
          <p className="text-gray-700 mb-4">
            {(() => {
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgeSeverability?.[email]);
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
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const approvals = formData.acknowledgeSeverability || {};
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
                        handleChange('acknowledgeSeverability', newApprovals);
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

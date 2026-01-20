import React from 'react';
import { MAJOR_DECISIONS, TIE_RESOLUTION_OPTIONS } from '../config/surveySchema';
import CustomSelect from './CustomSelect';
import { useUser } from '../contexts/UserContext';
import { useCollaborators } from '../hooks/useCollaborators';
import Tooltip from './Tooltip';
import { FIELDS } from '../config/surveySchema';

function SectionDecisionMaking({ formData, handleChange, isReadOnly, project, showValidation }) {
  const { currentUser } = useUser();
  const { collaboratorIds, getDisplayName, isAdmin } = useCollaborators(project);

  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Decision-Making & Voting</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Without a plan for who decides what, even choosing office chairs can start a cold war. The day-to-day questions start piling up. Should we hire this engineer? Take that investor meeting? Pivot the product? Left undefined, these decisions can quietly blow up trust.<br/><br/>This section is where you make it concrete: who signs off on what, when a decision needs a vote, and how ties get broken. Defining it now means that when disagreements inevitably come, you have a clear, agreed-upon way to move forward without derailing.
      </p>

      <div className="space-y-12" style={{ overflow: 'visible' }}>
        {/* Major Decisions */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What type of decisions require a discussion between all cofounders?
            {showValidation && (!formData[FIELDS.MAJOR_DECISIONS] || formData[FIELDS.MAJOR_DECISIONS].length === 0) && <span className="text-red-700 ml-0.5">*</span>}
            <Tooltip text="Which choices should never happen unless everyone's on board. Not office snacks." />
          </label>
          <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
          <div className="space-y-2">
            {MAJOR_DECISIONS.map((decision) => (
              <label key={decision} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(formData[FIELDS.MAJOR_DECISIONS] || []).includes(decision)}
                  onChange={(e) => {
                    const currentDecisions = formData[FIELDS.MAJOR_DECISIONS] || [];
                    const newDecisions = e.target.checked
                      ? [...currentDecisions, decision]
                      : currentDecisions.filter(d => d !== decision);
                    handleChange('majorDecisions', newDecisions);
                  }}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{decision}</span>
              </label>
            ))}
          </div>

          {(formData[FIELDS.MAJOR_DECISIONS] || []).includes('Other') && (
            <input
              type="text"
              value={formData[FIELDS.MAJOR_DECISIONS_OTHER] || ''}
              onChange={(e) => handleChange('majorDecisionsOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}
        </div>

        {/* Equity Voting Power */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Should equity ownership reflect voting power?
            {showValidation && !formData[FIELDS.EQUITY_VOTING_POWER] && <span className="text-red-700 ml-0.5">*</span>}
          </label>
          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="radio"
                name="equityVotingPower"
                value="yes"
                checked={formData[FIELDS.EQUITY_VOTING_POWER] === 'yes'}
                onClick={() => {
                  if (!isReadOnly) {
                    handleChange('equityVotingPower', formData[FIELDS.EQUITY_VOTING_POWER] === 'yes' ? '' : 'yes');
                  }
                }}
                onChange={() => {}}
                disabled={isReadOnly}
                className="mr-3 mt-1"
              />
              <div>
                <span className="text-gray-700 font-medium">Yes</span>
                <p className="text-sm text-gray-500">Voting weight tied to equity %</p>
              </div>
            </label>
            <label className="flex items-start">
              <input
                type="radio"
                name="equityVotingPower"
                value="no"
                checked={formData[FIELDS.EQUITY_VOTING_POWER] === 'no'}
                onClick={() => {
                  if (!isReadOnly) {
                    handleChange('equityVotingPower', formData[FIELDS.EQUITY_VOTING_POWER] === 'no' ? '' : 'no');
                  }
                }}
                onChange={() => {}}
                disabled={isReadOnly}
                className="mr-3 mt-1"
              />
              <div>
                <span className="text-gray-700 font-medium">No</span>
                <p className="text-sm text-gray-500">All founders have equal vote</p>
              </div>
            </label>
          </div>
        </div>

        {/* Tie Resolution */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            If cofounders are deadlocked, how should the tie be resolved?
            <Tooltip text="Decide how to break a stalemate before it becomes a staring contest nobody wins." />
            {showValidation && !formData[FIELDS.TIE_RESOLUTION] && <span className="text-red-700 ml-0.5">*</span>}
          </label>
          <div className="space-y-2">
            {TIE_RESOLUTION_OPTIONS.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="tieResolution"
                  value={option}
                  checked={formData[FIELDS.TIE_RESOLUTION] === option}
                  onClick={() => {
                    if (!isReadOnly) {
                      handleChange('tieResolution', formData[FIELDS.TIE_RESOLUTION] === option ? '' : option);
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

          {formData[FIELDS.TIE_RESOLUTION] && (
            <div className="conditional-section">
              <p className="text-gray-700 mb-4">
                {(() => {
                  const allAcknowledged = collaboratorIds.length > 0 && collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_TIE_RESOLUTION]?.[userId]);
                  return (
                    <>
                      In the event of a deadlock, the Cofounders agree to first seek resolution through informal negotiation for a period of 30 days. If unresolved, the deadlock shall be resolved by {formData[FIELDS.TIE_RESOLUTION]}.
                      {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5">*</span>}
                    </>
                  );
                })()}
              </p>
              <div className="space-y-2 mt-3 pl-4">
                {(() => {
                  const approvals = formData[FIELDS.ACKNOWLEDGE_TIE_RESOLUTION] || {};
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
                            handleChange('acknowledgeTieResolution', newApprovals);
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
          )}
        </div>

        {/* Shotgun Clause */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Do you want to include a shotgun clause if you and your cofounder(s) cannot resolve deadlocks?
            <Tooltip text="You can essentially offer to buy each other out. You're incentivized to make a reasonable offer because you might be bought out." placement="left" />
            {showValidation && !formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] && <span className="text-red-700 ml-0.5">*</span>}
          </label>
          <div className="space-y-2">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="includeShotgunClause"
                  value={option}
                  checked={formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === option}
                  onClick={() => {
                    if (!isReadOnly) {
                      handleChange('includeShotgunClause', formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === option ? '' : option);
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

          {formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === 'Yes' && (
            <div className="conditional-section">
              <p className="text-gray-700 mb-4">
                {(() => {
                  const allAcknowledged = collaboratorIds.length > 0 && collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE]?.[userId]);
                  return (
                    <>
                      I acknowledge that no partial buy/sell is allowed and payment is due in cash within 60 days of acceptance.
                      {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5">*</span>}
                    </>
                  );
                })()}
              </p>
              <div className="space-y-2 mt-3 pl-4">
                {(() => {
                  const approvals = formData[FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE] || {};
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
                            handleChange('acknowledgeShotgunClause', newApprovals);
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
          )}
        </div>
      </div>
    </div>
  );
}

export default SectionDecisionMaking;

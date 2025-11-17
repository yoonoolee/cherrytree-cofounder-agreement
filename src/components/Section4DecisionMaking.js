import React from 'react';
import { MAJOR_DECISIONS } from './surveyConstants';
import CustomSelect from './CustomSelect';
import { auth } from '../firebase';
import Tooltip from './Tooltip';

function Section4DecisionMaking({ formData, handleChange, isReadOnly, project, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Decision-Making & Voting</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Without a plan for who decides what, even choosing office chairs can start a cold war. The day-to-day questions start piling up. Should we hire this engineer? Take that investor meeting? Pivot the product? Left undefined, these decisions can quietly blow up trust. This section is where you make it concrete: who signs off on what, when a decision needs a vote, and how ties get broken. Defining it now means that when disagreements inevitably come, you have a clear, agreed-upon way to move forward without derailing.
      </p>

      <div className="space-y-12" style={{ overflow: 'visible' }}>
        {/* Major Decisions */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Which major decisions require all cofounders to agree?
            {showValidation && (!formData.majorDecisions || formData.majorDecisions.length === 0) && <span className="text-red-700 ml-0.5">*</span>}
            <Tooltip text="Which choices should never happen unless everyone's on board. Not office snacks." />
          </label>
          <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
          <div className="space-y-2">
            {MAJOR_DECISIONS.map((decision) => (
              <label key={decision} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(formData.majorDecisions || []).includes(decision)}
                  onChange={(e) => {
                    const currentDecisions = formData.majorDecisions || [];
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

          {(formData.majorDecisions || []).includes('Other') && (
            <input
              type="text"
              value={formData.majorDecisionsOther || ''}
              onChange={(e) => handleChange('majorDecisionsOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}
        </div>

        {/* Equity Voting Power */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Should equity ownership reflect voting power?
            {showValidation && !formData.equityVotingPower && <span className="text-red-700 ml-0.5">*</span>}
          </label>
          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="radio"
                name="equityVotingPower"
                value="yes"
                checked={formData.equityVotingPower === 'yes'}
                onChange={(e) => handleChange('equityVotingPower', e.target.value)}
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
                checked={formData.equityVotingPower === 'no'}
                onChange={(e) => handleChange('equityVotingPower', e.target.value)}
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

        {/* Final Say */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Who has final say, regardless of their field of expertise?
            {showValidation && !formData.finalSayPerson && <span className="text-red-700 ml-0.5">*</span>}
            <Tooltip text="This is usually the CEO. It's done to prevent deadlocks but may concentrate power." />
          </label>
          <CustomSelect
            value={formData.finalSayPerson || ''}
            onChange={(value) => handleChange('finalSayPerson', value)}
            options={(formData.cofounders || []).map((cofounder, index) => ({
              value: cofounder.fullName || `Cofounder ${String.fromCharCode(65 + index)}`,
              label: cofounder.fullName || `Cofounder ${String.fromCharCode(65 + index)}`
            }))}
            placeholder="Select a cofounder"
            disabled={isReadOnly}
          />
        </div>

        {/* Tie Resolution */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            If cofounders are deadlocked, how should the tie be resolved?
            <Tooltip text="Decide how to break a stalemate before it becomes a staring contest nobody wins." />
            {showValidation && !formData.tieResolution && <span className="text-red-700 ml-0.5">*</span>}
          </label>
          <div className="space-y-2">
            {[
              'Advisory board or mentor decides',
              'External mediator / legal counsel',
              'Rock, paper, scissors',
              'Other'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="tieResolution"
                  value={option}
                  checked={formData.tieResolution === option}
                  onChange={(e) => handleChange('tieResolution', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {formData.tieResolution === 'Other' && (
            <input
              type="text"
              value={formData.tieResolutionOther || ''}
              onChange={(e) => handleChange('tieResolutionOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}

          {formData.tieResolution && (
            <div className="conditional-section">
              <p className="text-gray-700 mb-4">
                {(() => {
                  const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
                  const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgeTieResolution?.[email]);
                  return (
                    <>
                      In the event of a deadlock, the Cofounders agree to first seek resolution through informal negotiation for a period of 30 days. If unresolved, the deadlock shall be resolved by {formData.tieResolution === 'Other' ? formData.tieResolutionOther : formData.tieResolution}.
                      {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5">*</span>}
                    </>
                  );
                })()}
              </p>
              <div className="space-y-2 mt-3 pl-4">
                {(() => {
                  const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
                  const approvals = formData.acknowledgeTieResolution || {};
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
                            handleChange('acknowledgeTieResolution', newApprovals);
                          }}
                          disabled={isReadOnly || !isCurrentUser}
                          className="mr-3"
                        />
                        <span className="text-gray-700">
                          {email}
                          {email === project?.ownerEmail && <span className="ml-2 text-xs text-gray-500">(Owner)</span>}
                          {isCurrentUser && <span className="ml-2 text-xs text-red-950">(You)</span>}
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
            <Tooltip text="You can essentially offer to buy each other out. You're incentivized to make a reasonable offer because you might be bought out." />
            {showValidation && !formData.includeShotgunClause && <span className="text-red-700 ml-0.5">*</span>}
          </label>
          <div className="space-y-2">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="includeShotgunClause"
                  value={option}
                  checked={formData.includeShotgunClause === option}
                  onChange={(e) => handleChange('includeShotgunClause', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {formData.includeShotgunClause === 'Yes' && (
            <div className="conditional-section">
              <p className="text-gray-700 mb-4">
                {(() => {
                  const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
                  const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgeShotgunClause?.[email]);
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
                  const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
                  const approvals = formData.acknowledgeShotgunClause || {};
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
                            handleChange('acknowledgeShotgunClause', newApprovals);
                          }}
                          disabled={isReadOnly || !isCurrentUser}
                          className="mr-3"
                        />
                        <span className="text-gray-700">
                          {email}
                          {email === project?.ownerEmail && <span className="ml-2 text-xs text-gray-500">(Owner)</span>}
                          {isCurrentUser && <span className="ml-2 text-xs text-red-950">(You)</span>}
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

export default Section4DecisionMaking;

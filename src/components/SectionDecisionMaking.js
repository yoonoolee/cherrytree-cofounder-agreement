import React, { useState } from 'react';
import { TIE_RESOLUTION_OPTIONS } from '../config/surveySchema';
import { useUser } from '../contexts/UserContext';
import { useCollaborators } from '../hooks/useCollaborators';
import Tooltip from './Tooltip';
import QuestionRenderer from './QuestionRenderer';
import QuestionCard from './QuestionCard';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';

function getPreview(fieldName, formData) {
  const val = formData[fieldName];
  if (!val) return '';
  if (Array.isArray(val)) return val.length <= 2 ? val.join(', ') : `${val[0]} +${val.length - 1} more`;
  if (typeof val === 'object') {
    const vals = Object.values(val);
    if (!vals.length) return '';
    if (vals.every(Boolean)) return 'Acknowledged';
    if (vals.some(Boolean)) return 'In progress';
    return '';
  }
  return String(val);
}

const FIELD_ORDER = [
  FIELDS.MAJOR_DECISIONS,
  FIELDS.EQUITY_VOTING_POWER,
  FIELDS.TIE_RESOLUTION,
  FIELDS.INCLUDE_SHOTGUN_CLAUSE,
];

function SectionDecisionMaking({ formData, handleChange, isReadOnly, project, showValidation }) {
  const { currentUser } = useUser();
  const { collaboratorIds, getDisplayName, isAdmin } = useCollaborators(project);
  const firstUnanswered = FIELD_ORDER.find(f => !formData[f]);
  const [expandedField, setExpandedField] = useState(firstUnanswered || FIELD_ORDER[0]);
  const advanceTo = (key) => {
    const idx = FIELD_ORDER.indexOf(key);
    if (idx < FIELD_ORDER.length - 1) setExpandedField(FIELD_ORDER[idx + 1]);
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '42px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.1, color: '#1a1a1a' }}>
        Decision-Making &amp; Voting
      </h2>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', maxWidth: '820px', lineHeight: 1.65, marginBottom: '32px' }}>
        Without a plan for who decides what, even choosing office chairs can start a cold war. The day-to-day questions start piling up. Should we hire this engineer? Take that investor meeting? Pivot the product? Left undefined, these decisions can quietly blow up trust.<br/><br/>This section is where you make it concrete: who signs off on what, when a decision needs a vote, and how ties get broken. Defining it now means that when disagreements inevitably come, you have a clear, agreed-upon way to move forward without derailing.
      </p>

      <div style={{ overflow: 'visible' }}>
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.MAJOR_DECISIONS].question}
          answerPreview={getPreview(FIELDS.MAJOR_DECISIONS, formData)}
          hint={QUESTION_CONFIG[FIELDS.MAJOR_DECISIONS].tooltip}
          isExpanded={expandedField === FIELDS.MAJOR_DECISIONS}
          isAnswered={!!(formData[FIELDS.MAJOR_DECISIONS]?.length)}
          onExpand={() => setExpandedField(FIELDS.MAJOR_DECISIONS)}
          onAdvance={() => advanceTo(FIELDS.MAJOR_DECISIONS)}
        >
          <QuestionRenderer fieldName={FIELDS.MAJOR_DECISIONS} config={QUESTION_CONFIG[FIELDS.MAJOR_DECISIONS]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.EQUITY_VOTING_POWER].question}
          answerPreview={getPreview(FIELDS.EQUITY_VOTING_POWER, formData)}
          hint={QUESTION_CONFIG[FIELDS.EQUITY_VOTING_POWER].tooltip}
          isExpanded={expandedField === FIELDS.EQUITY_VOTING_POWER}
          isAnswered={!!formData[FIELDS.EQUITY_VOTING_POWER]}
          onExpand={() => setExpandedField(FIELDS.EQUITY_VOTING_POWER)}
          onAdvance={() => advanceTo(FIELDS.EQUITY_VOTING_POWER)}
        >
          <QuestionRenderer fieldName={FIELDS.EQUITY_VOTING_POWER} config={QUESTION_CONFIG[FIELDS.EQUITY_VOTING_POWER]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
        </QuestionCard>

        <QuestionCard
          question="If cofounders are deadlocked, how should the tie be resolved?"
          answerPreview={getPreview(FIELDS.TIE_RESOLUTION, formData)}
          isExpanded={expandedField === FIELDS.TIE_RESOLUTION}
          isAnswered={!!formData[FIELDS.TIE_RESOLUTION]}
          onExpand={() => setExpandedField(FIELDS.TIE_RESOLUTION)}
          onAdvance={() => advanceTo(FIELDS.TIE_RESOLUTION)}
        >
          {showValidation && !formData[FIELDS.TIE_RESOLUTION] && <span className="text-red-700 text-xs">* Required</span>}
          <div className="space-y-2" style={{ marginTop: '14px' }}>
            {TIE_RESOLUTION_OPTIONS.map((option) => (
              <label key={option} className="card-radio-option">
                <input
                  type="radio" name="tieResolution" value={option}
                  checked={formData[FIELDS.TIE_RESOLUTION] === option}
                  onClick={() => {
                    if (!isReadOnly) {
                      const newValue = formData[FIELDS.TIE_RESOLUTION] === option ? '' : option;
                      handleChange(FIELDS.TIE_RESOLUTION, newValue);
                      if (newValue) {
                        const init = Object.fromEntries(collaboratorIds.map(id => [id, false]));
                        handleChange(FIELDS.ACKNOWLEDGE_TIE_RESOLUTION, init);
                      } else {
                        handleChange(FIELDS.ACKNOWLEDGE_TIE_RESOLUTION, null);
                      }
                    }
                  }}
                  onChange={() => {}} disabled={isReadOnly}
                />
                <span className="radio-circle" />
                {option}
              </label>
            ))}
          </div>
          <Tooltip text="Decide how to break a stalemate before it becomes a staring contest nobody wins." />
          {formData[FIELDS.TIE_RESOLUTION] && (
            <div className="conditional-section">
              <p className="text-gray-700 mb-4">
                {(() => {
                  const allAcknowledged = collaboratorIds.length > 0 && collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_TIE_RESOLUTION]?.[userId]);
                  return (<>I acknowledge that in the event of a deadlock, the Cofounders agree to first seek resolution through informal negotiation for a period of 30 days. If unresolved, the deadlock shall be resolved by {formData[FIELDS.TIE_RESOLUTION]}.{showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5">*</span>}</>);
                })()}
              </p>
              <div className="space-y-2 mt-3 pl-4">
                {(() => {
                  const approvals = formData[FIELDS.ACKNOWLEDGE_TIE_RESOLUTION] || {};
                  const currentUserId = currentUser?.id;
                  return collaboratorIds.map((userId) => (
                    <label key={userId} className="flex items-center">
                      <input type="checkbox" checked={approvals[userId] || false}
                        onChange={(e) => handleChange(FIELDS.ACKNOWLEDGE_TIE_RESOLUTION, { ...approvals, [userId]: e.target.checked })}
                        disabled={isReadOnly || userId !== currentUserId} className="mr-3" />
                      <span className="text-gray-700">{getDisplayName(userId)}{isAdmin(userId) && <span className="ml-2 text-xs text-gray-500">(Admin)</span>}</span>
                    </label>
                  ));
                })()}
              </div>
            </div>
          )}
        </QuestionCard>

        <QuestionCard
          question="Do you want to include a shotgun clause if you and your cofounder(s) cannot resolve deadlocks?"
          answerPreview={getPreview(FIELDS.INCLUDE_SHOTGUN_CLAUSE, formData)}
          isExpanded={expandedField === FIELDS.INCLUDE_SHOTGUN_CLAUSE}
          isAnswered={!!formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE]}
          onExpand={() => setExpandedField(FIELDS.INCLUDE_SHOTGUN_CLAUSE)}
          onAdvance={() => advanceTo(FIELDS.INCLUDE_SHOTGUN_CLAUSE)}
        >
          {showValidation && !formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] && <span className="text-red-700 text-xs">* Required</span>}
          <div className="space-y-2" style={{ marginTop: '14px' }}>
            {['Yes', 'No'].map((option) => (
              <label key={option} className="card-radio-option">
                <input type="radio" name="includeShotgunClause" value={option}
                  checked={formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === option}
                  onClick={() => {
                    if (!isReadOnly) {
                      const newValue = formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === option ? '' : option;
                      handleChange(FIELDS.INCLUDE_SHOTGUN_CLAUSE, newValue);
                      if (newValue === 'Yes') {
                        const init = Object.fromEntries(collaboratorIds.map(id => [id, false]));
                        handleChange(FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE, init);
                      } else {
                        handleChange(FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE, null);
                      }
                    }
                  }}
                  onChange={() => {}} disabled={isReadOnly} />
                <span className="radio-circle" />
                {option}
              </label>
            ))}
          </div>
          <Tooltip text="You can essentially offer to buy each other out. You're incentivized to make a reasonable offer because you might be bought out." placement="left" />
          {formData[FIELDS.INCLUDE_SHOTGUN_CLAUSE] === 'Yes' && (
            <div className="conditional-section">
              <p className="text-gray-700 mb-4">
                {(() => {
                  const allAcknowledged = collaboratorIds.length > 0 && collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE]?.[userId]);
                  return (<>I acknowledge that no partial buy/sell is allowed and payment is due in cash within 60 days of acceptance.{showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5">*</span>}</>);
                })()}
              </p>
              <div className="space-y-2 mt-3 pl-4">
                {(() => {
                  const approvals = formData[FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE] || {};
                  const currentUserId = currentUser?.id;
                  return collaboratorIds.map((userId) => (
                    <label key={userId} className="flex items-center">
                      <input type="checkbox" checked={approvals[userId] || false}
                        onChange={(e) => handleChange(FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE, { ...approvals, [userId]: e.target.checked })}
                        disabled={isReadOnly || userId !== currentUserId} className="mr-3" />
                      <span className="text-gray-700">{getDisplayName(userId)}{isAdmin(userId) && <span className="ml-2 text-xs text-gray-500">(Admin)</span>}</span>
                    </label>
                  ));
                })()}
              </div>
            </div>
          )}
        </QuestionCard>
      </div>
    </div>
  );
}

export default SectionDecisionMaking;

import React, { useState } from 'react';
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
  FIELDS.VESTING_START_DATE,
  FIELDS.VESTING_SCHEDULE,
  FIELDS.CLIFF_PERCENTAGE,
  FIELDS.ACCELERATION_TRIGGER,
  FIELDS.SHARES_SELL_NOTICE_DAYS,
  FIELDS.SHARES_BUYBACK_DAYS,
  FIELDS.ACKNOWLEDGE_FORFEITURE,
  FIELDS.VESTED_SHARES_DISPOSAL,
];

function SectionEquityVesting({ formData, handleChange, isReadOnly, project, showValidation }) {
  const firstUnanswered = FIELD_ORDER.find(f => !formData[f]);
  const [expandedField, setExpandedField] = useState(firstUnanswered || FIELD_ORDER[0]);
  const advanceTo = (key) => {
    const idx = FIELD_ORDER.indexOf(key);
    if (idx < FIELD_ORDER.length - 1) setExpandedField(FIELD_ORDER[idx + 1]);
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '42px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.1, color: '#1a1a1a' }}>
        Vesting Schedule
      </h2>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', maxWidth: '820px', lineHeight: 1.65, marginBottom: '12px' }}>
        When Robin and Antje started Zipcar, they decided to split ownership 50/50. Fair and simple. At first, it seemed like a success story: the company grew, became highly profitable, and eventually went public.
      </p>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', maxWidth: '820px', lineHeight: 1.65, marginBottom: '12px' }}>
        But within a year and a half, conflicts caused Robin to fire Antje. Except, Antje kept her 50% stake in the company. Robin was stuck working around the clock for virtually no pay.
      </p>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', maxWidth: '820px', lineHeight: 1.65, marginBottom: '32px' }}>
        This is exactly why vesting exists. Without it, a cofounder can walk away with a huge slice of the company without putting in the work, leaving the remaining cofounders carrying the burden. Vesting means you earn your equity over time by building the company.
      </p>

      <div>
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.VESTING_START_DATE].question}
          answerPreview={getPreview(FIELDS.VESTING_START_DATE, formData)}
          hint={QUESTION_CONFIG[FIELDS.VESTING_START_DATE].tooltip}
          isExpanded={expandedField === FIELDS.VESTING_START_DATE}
          isAnswered={!!formData[FIELDS.VESTING_START_DATE]}
          onExpand={() => setExpandedField(FIELDS.VESTING_START_DATE)}
          onAdvance={() => advanceTo(FIELDS.VESTING_START_DATE)}
        >
          <QuestionRenderer fieldName={FIELDS.VESTING_START_DATE} config={QUESTION_CONFIG[FIELDS.VESTING_START_DATE]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.VESTING_SCHEDULE].question}
          answerPreview={getPreview(FIELDS.VESTING_SCHEDULE, formData)}
          hint={QUESTION_CONFIG[FIELDS.VESTING_SCHEDULE].tooltip}
          isExpanded={expandedField === FIELDS.VESTING_SCHEDULE}
          isAnswered={!!formData[FIELDS.VESTING_SCHEDULE]}
          onExpand={() => setExpandedField(FIELDS.VESTING_SCHEDULE)}
          onAdvance={() => advanceTo(FIELDS.VESTING_SCHEDULE)}
        >
          <QuestionRenderer fieldName={FIELDS.VESTING_SCHEDULE} config={QUESTION_CONFIG[FIELDS.VESTING_SCHEDULE]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
        </QuestionCard>

        <QuestionCard
          question="What percent of equity will be vested once the cliff is complete?"
          answerPreview={formData[FIELDS.CLIFF_PERCENTAGE] ? `${formData[FIELDS.CLIFF_PERCENTAGE]}%` : ''}
          hint="The standard is 25% for 4 years with a 1-year cliff."
          isExpanded={expandedField === FIELDS.CLIFF_PERCENTAGE}
          isAnswered={!!formData[FIELDS.CLIFF_PERCENTAGE]}
          onExpand={() => setExpandedField(FIELDS.CLIFF_PERCENTAGE)}
          onAdvance={() => advanceTo(FIELDS.CLIFF_PERCENTAGE)}
        >
          {showValidation && !formData[FIELDS.CLIFF_PERCENTAGE] && <span className="text-red-700 text-xs">* Required</span>}
          <input
            type="text"
            value={formData[FIELDS.CLIFF_PERCENTAGE] ? `${formData[FIELDS.CLIFF_PERCENTAGE]}%` : ''}
            onChange={(e) => {
              const input = e.target;
              const cursorPos = input.selectionStart;
              const value = e.target.value.replace('%', '');
              if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                handleChange(FIELDS.CLIFF_PERCENTAGE, value);
                setTimeout(() => { const newPos = Math.min(cursorPos, value.length); input.setSelectionRange(newPos, newPos); }, 0);
              }
            }}
            onKeyDown={(e) => {
              const input = e.target;
              const value = input.value.replace('%', '');
              const cursorPos = input.selectionStart;
              if (e.key === 'ArrowRight' && cursorPos >= value.length) e.preventDefault();
              if (e.key === 'ArrowLeft' && cursorPos > value.length) { e.preventDefault(); input.setSelectionRange(value.length, value.length); }
            }}
            onClick={(e) => { const input = e.target; const value = input.value.replace('%', ''); if (input.selectionStart > value.length) setTimeout(() => input.setSelectionRange(value.length, value.length), 0); }}
            onFocus={(e) => { const input = e.target; const value = input.value.replace('%', ''); setTimeout(() => input.setSelectionRange(value.length, value.length), 0); }}
            disabled={isReadOnly}
            placeholder="25%"
          />
          <Tooltip text="If you leave before the cliff, you get nothing." />
        </QuestionCard>

        <QuestionCard
          question="If the company is acquired and a cofounder is terminated without cause, should their unvested shares accelerate?"
          answerPreview={getPreview(FIELDS.ACCELERATION_TRIGGER, formData)}
          isExpanded={expandedField === FIELDS.ACCELERATION_TRIGGER}
          isAnswered={!!formData[FIELDS.ACCELERATION_TRIGGER]}
          onExpand={() => setExpandedField(FIELDS.ACCELERATION_TRIGGER)}
          onAdvance={() => advanceTo(FIELDS.ACCELERATION_TRIGGER)}
        >
          {showValidation && !formData[FIELDS.ACCELERATION_TRIGGER] && <span className="text-red-700 text-xs">* Required</span>}
          <div className="space-y-2" style={{ marginTop: '14px' }}>
            {['Yes', 'No'].map((option) => (
              <label key={option} className="card-radio-option">
                <input
                  type="radio"
                  name="accelerationTrigger"
                  value={option}
                  checked={formData[FIELDS.ACCELERATION_TRIGGER] === option}
                  onClick={() => {
                    if (!isReadOnly) {
                      const newValue = formData[FIELDS.ACCELERATION_TRIGGER] === option ? '' : option;
                      handleChange(FIELDS.ACCELERATION_TRIGGER, newValue);
                      if (newValue !== 'Yes') handleChange('accelerationProtectionMonths', '');
                    }
                  }}
                  onChange={() => {}}
                  disabled={isReadOnly}
                />
                <span className="radio-circle" />
                {option}
              </label>
            ))}
          </div>
          <Tooltip text="Acceleration decides if unvested shares vest early. Single-trigger happens when the company is acquired. Double-trigger only kicks in if the company is acquired and you're terminated without cause." />
          {formData[FIELDS.ACCELERATION_TRIGGER] === 'Yes' && (
            <div className="conditional-section">
              <label className="block text-base font-medium text-gray-900 mb-2">
                For how long after the acquisition should this protection apply?
                {showValidation && !formData.accelerationProtectionMonths && <span className="text-red-700 ml-0.5 validation-error">*</span>}
              </label>
              <div className="space-y-2">
                {['6 months', '12 months', '18 months'].map((option) => (
                  <label key={option} className="card-radio-option">
                    <input type="radio" name="accelerationProtectionMonths" value={option} checked={formData.accelerationProtectionMonths === option}
                      onClick={() => { if (!isReadOnly) handleChange('accelerationProtectionMonths', formData.accelerationProtectionMonths === option ? '' : option); }}
                      onChange={() => {}} disabled={isReadOnly} />
                    <span className="radio-circle" />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          )}
        </QuestionCard>

        <QuestionCard
          question="If a cofounder wants to sell their shares, how many days notice do they need to provide the Board and shareholders?"
          answerPreview={formData[FIELDS.SHARES_SELL_NOTICE_DAYS] ? `${formData[FIELDS.SHARES_SELL_NOTICE_DAYS]} days` : ''}
          isExpanded={expandedField === FIELDS.SHARES_SELL_NOTICE_DAYS}
          isAnswered={!!formData[FIELDS.SHARES_SELL_NOTICE_DAYS]}
          onExpand={() => setExpandedField(FIELDS.SHARES_SELL_NOTICE_DAYS)}
          onAdvance={() => advanceTo(FIELDS.SHARES_SELL_NOTICE_DAYS)}
        >
          {showValidation && !formData[FIELDS.SHARES_SELL_NOTICE_DAYS] && <span className="text-red-700 text-xs">* Required</span>}
          <input
            type="number" step="1" min="0"
            value={formData[FIELDS.SHARES_SELL_NOTICE_DAYS] || ''}
            onChange={(e) => { const value = e.target.value; if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) handleChange(FIELDS.SHARES_SELL_NOTICE_DAYS, value); }}
            onKeyDown={(e) => { if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
            disabled={isReadOnly} placeholder="30"
          />
        </QuestionCard>

        <QuestionCard
          question="If a cofounder resigns, how many days does the company have to buy back the shares?"
          answerPreview={formData[FIELDS.SHARES_BUYBACK_DAYS] ? `${formData[FIELDS.SHARES_BUYBACK_DAYS]} days` : ''}
          isExpanded={expandedField === FIELDS.SHARES_BUYBACK_DAYS}
          isAnswered={!!formData[FIELDS.SHARES_BUYBACK_DAYS]}
          onExpand={() => setExpandedField(FIELDS.SHARES_BUYBACK_DAYS)}
          onAdvance={() => advanceTo(FIELDS.SHARES_BUYBACK_DAYS)}
        >
          {showValidation && !formData[FIELDS.SHARES_BUYBACK_DAYS] && <span className="text-red-700 text-xs">* Required</span>}
          <input
            type="number" step="1" min="0"
            value={formData[FIELDS.SHARES_BUYBACK_DAYS] || ''}
            onChange={(e) => { const value = e.target.value; if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) handleChange(FIELDS.SHARES_BUYBACK_DAYS, value); }}
            onKeyDown={(e) => { if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
            disabled={isReadOnly} placeholder="90"
          />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_FORFEITURE].question}
          answerPreview={getPreview(FIELDS.ACKNOWLEDGE_FORFEITURE, formData)}
          isExpanded={expandedField === FIELDS.ACKNOWLEDGE_FORFEITURE}
          isAnswered={(() => { const v = formData[FIELDS.ACKNOWLEDGE_FORFEITURE]; return v && typeof v === 'object' && Object.values(v).length > 0 && Object.values(v).every(Boolean); })()}
          onExpand={() => setExpandedField(FIELDS.ACKNOWLEDGE_FORFEITURE)}
          onAdvance={() => advanceTo(FIELDS.ACKNOWLEDGE_FORFEITURE)}
        >
          <QuestionRenderer fieldName={FIELDS.ACKNOWLEDGE_FORFEITURE} config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_FORFEITURE]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.VESTED_SHARES_DISPOSAL].question}
          answerPreview={getPreview(FIELDS.VESTED_SHARES_DISPOSAL, formData)}
          hint={QUESTION_CONFIG[FIELDS.VESTED_SHARES_DISPOSAL].tooltip}
          isExpanded={expandedField === FIELDS.VESTED_SHARES_DISPOSAL}
          isAnswered={!!formData[FIELDS.VESTED_SHARES_DISPOSAL]}
          onExpand={() => setExpandedField(FIELDS.VESTED_SHARES_DISPOSAL)}
          onAdvance={() => advanceTo(FIELDS.VESTED_SHARES_DISPOSAL)}
        >
          <QuestionRenderer fieldName={FIELDS.VESTED_SHARES_DISPOSAL} config={QUESTION_CONFIG[FIELDS.VESTED_SHARES_DISPOSAL]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
        </QuestionCard>

        <div style={{ background: '#E9E5DF', borderRadius: '6px', padding: '14px 18px', marginTop: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: 300, color: '#666', lineHeight: 1.65 }}>
            <strong style={{ fontWeight: 500 }}>Note:</strong> If you receive unvested shares, you can file an 83(b) election within 30 days of incorporation. This lets you pay taxes on the current (usually low) value of your shares instead of their future value as they vest. Consult a tax advisor.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SectionEquityVesting;

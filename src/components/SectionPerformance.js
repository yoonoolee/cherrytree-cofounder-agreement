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
  return String(val);
}

const FIELD_ORDER = [
  FIELDS.PERFORMANCE_CONSEQUENCES,
  FIELDS.REMEDY_PERIOD_DAYS,
  FIELDS.TERMINATION_WITH_CAUSE,
  FIELDS.VOLUNTARY_NOTICE_DAYS,
];

function SectionPerformance({ formData, handleChange, isReadOnly, showValidation, project }) {
  const firstUnanswered = FIELD_ORDER.find(f => !formData[f]);
  const [expandedField, setExpandedField] = useState(firstUnanswered || FIELD_ORDER[0]);
  const advanceTo = (key) => {
    const idx = FIELD_ORDER.indexOf(key);
    if (idx < FIELD_ORDER.length - 1) setExpandedField(FIELD_ORDER[idx + 1]);
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '42px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.1, color: '#1a1a1a' }}>
        Cofounder Performance &amp; Departure
      </h2>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', maxWidth: '820px', lineHeight: 1.65, marginBottom: '12px' }}>
        In every startup, execution is everything. You can have the best idea in the world, the perfect cofounder team, and a shiny product plan, but if the work doesn't get done, nothing happens. However, sometimes, for one reason or another, we can't perform at the level that's necessary.
      </p>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', maxWidth: '820px', lineHeight: 1.65, marginBottom: '32px' }}>
        In those cases, the best we can do is protect the company and the friendship. You do that by planning for the what-ifs ahead of time. Performance isn't just about grinding harder. It's about foresight, flexibility, and keeping the company moving even when things don't go perfectly.
      </p>

      <div>
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.PERFORMANCE_CONSEQUENCES].question}
          answerPreview={getPreview(FIELDS.PERFORMANCE_CONSEQUENCES, formData)}
          hint={QUESTION_CONFIG[FIELDS.PERFORMANCE_CONSEQUENCES].tooltip}
          isExpanded={expandedField === FIELDS.PERFORMANCE_CONSEQUENCES}
          isAnswered={!!formData[FIELDS.PERFORMANCE_CONSEQUENCES]}
          onExpand={() => setExpandedField(FIELDS.PERFORMANCE_CONSEQUENCES)}
          onAdvance={() => advanceTo(FIELDS.PERFORMANCE_CONSEQUENCES)}
        >
          <QuestionRenderer fieldName={FIELDS.PERFORMANCE_CONSEQUENCES} config={QUESTION_CONFIG[FIELDS.PERFORMANCE_CONSEQUENCES]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
        </QuestionCard>

        <QuestionCard
          question="How many days does a cofounder have to fix the issue after receiving written notice before termination can occur?"
          answerPreview={formData[FIELDS.REMEDY_PERIOD_DAYS] ? `${formData[FIELDS.REMEDY_PERIOD_DAYS]} days` : ''}
          isExpanded={expandedField === FIELDS.REMEDY_PERIOD_DAYS}
          isAnswered={!!formData[FIELDS.REMEDY_PERIOD_DAYS]}
          onExpand={() => setExpandedField(FIELDS.REMEDY_PERIOD_DAYS)}
          onAdvance={() => advanceTo(FIELDS.REMEDY_PERIOD_DAYS)}
        >
          {showValidation && !formData[FIELDS.REMEDY_PERIOD_DAYS] && <span className="text-red-700 text-xs">* Required</span>}
          <input
            type="number" step="1" min="0"
            value={formData[FIELDS.REMEDY_PERIOD_DAYS] || ''}
            onChange={(e) => { const value = e.target.value; if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) handleChange(FIELDS.REMEDY_PERIOD_DAYS, value); }}
            onKeyDown={(e) => { if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
            disabled={isReadOnly} placeholder="Enter number of days"
          />
          <Tooltip text="This period allows cofounders to address issues in good faith before more serious action is taken." />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.TERMINATION_WITH_CAUSE].question}
          answerPreview={getPreview(FIELDS.TERMINATION_WITH_CAUSE, formData)}
          hint={QUESTION_CONFIG[FIELDS.TERMINATION_WITH_CAUSE].tooltip}
          isExpanded={expandedField === FIELDS.TERMINATION_WITH_CAUSE}
          isAnswered={!!formData[FIELDS.TERMINATION_WITH_CAUSE]}
          onExpand={() => setExpandedField(FIELDS.TERMINATION_WITH_CAUSE)}
          onAdvance={() => advanceTo(FIELDS.TERMINATION_WITH_CAUSE)}
        >
          <QuestionRenderer fieldName={FIELDS.TERMINATION_WITH_CAUSE} config={QUESTION_CONFIG[FIELDS.TERMINATION_WITH_CAUSE]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
        </QuestionCard>

        <QuestionCard
          question="How many days is the notice period if a Cofounder wishes to voluntarily leave?"
          answerPreview={formData[FIELDS.VOLUNTARY_NOTICE_DAYS] ? `${formData[FIELDS.VOLUNTARY_NOTICE_DAYS]} days` : ''}
          isExpanded={expandedField === FIELDS.VOLUNTARY_NOTICE_DAYS}
          isAnswered={!!formData[FIELDS.VOLUNTARY_NOTICE_DAYS]}
          onExpand={() => setExpandedField(FIELDS.VOLUNTARY_NOTICE_DAYS)}
          onAdvance={() => advanceTo(FIELDS.VOLUNTARY_NOTICE_DAYS)}
        >
          {showValidation && !formData[FIELDS.VOLUNTARY_NOTICE_DAYS] && <span className="text-red-700 text-xs">* Required</span>}
          <input
            type="number"
            value={formData[FIELDS.VOLUNTARY_NOTICE_DAYS] || ''}
            onChange={(e) => handleChange(FIELDS.VOLUNTARY_NOTICE_DAYS, e.target.value)}
            disabled={isReadOnly} placeholder="Enter number of days"
          />
        </QuestionCard>
      </div>
    </div>
  );
}

export default SectionPerformance;

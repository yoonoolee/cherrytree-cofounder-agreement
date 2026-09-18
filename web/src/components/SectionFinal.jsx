import React, { useState } from 'react';
import QuestionRenderer from './QuestionRenderer';
import QuestionCard from './QuestionCard';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';
import { getPreview } from '../utils/getPreview';

const FIELD_ORDER = [
  FIELDS.DISPUTE_RESOLUTION,
  FIELDS.GOVERNING_LAW,
  FIELDS.AMENDMENT_PROCESS,
  FIELDS.REVIEW_FREQUENCY_MONTHS,
  FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW,
  FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST,
  FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT,
  FIELDS.ACKNOWLEDGE_SEVERABILITY,
];

function SectionFinal({ formData, handleChange, isReadOnly, project, showValidation }) {
  const isAckAnswered = (f) => { const v = formData[f]; return v && typeof v === 'object' && Object.values(v).length > 0 && Object.values(v).every(Boolean); };
  const firstUnanswered = FIELD_ORDER.find(f => {
    const v = formData[f];
    if (!v) return true;
    if (typeof v === 'object') return !Object.values(v).every(Boolean);
    return false;
  });
  const [expandedField, setExpandedField] = useState(firstUnanswered || FIELD_ORDER[0]);
  const advanceTo = (key) => {
    const idx = FIELD_ORDER.indexOf(key);
    if (idx < FIELD_ORDER.length - 1) setExpandedField(FIELD_ORDER[idx + 1]);
  };
  const collapse = () => setExpandedField(null);

  return (
    <div>
      <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '42px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.1, color: '#1a1a1a' }}>
        General Provisions
      </h2>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', lineHeight: 1.65, marginBottom: '32px' }}>
        Last stretch! Knock out these last few questions, then review and green-light your agreement.
      </p>

      <div style={{ overflow: 'visible' }}>
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.DISPUTE_RESOLUTION].question}
          answerPreview={getPreview(FIELDS.DISPUTE_RESOLUTION, formData, FIELDS.DISPUTE_RESOLUTION_OTHER)}
          tooltip={QUESTION_CONFIG[FIELDS.DISPUTE_RESOLUTION].tooltip}
          isExpanded={expandedField === FIELDS.DISPUTE_RESOLUTION}
          isAnswered={!!formData[FIELDS.DISPUTE_RESOLUTION]}
          onExpand={() => setExpandedField(FIELDS.DISPUTE_RESOLUTION)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.DISPUTE_RESOLUTION)}
        >
          <QuestionRenderer fieldName={FIELDS.DISPUTE_RESOLUTION} config={QUESTION_CONFIG[FIELDS.DISPUTE_RESOLUTION]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
        </QuestionCard>

        <div style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
          <QuestionCard
            question={QUESTION_CONFIG[FIELDS.GOVERNING_LAW].question}
            answerPreview={getPreview(FIELDS.GOVERNING_LAW, formData)}
            tooltip={QUESTION_CONFIG[FIELDS.GOVERNING_LAW].tooltip}
            isExpanded={expandedField === FIELDS.GOVERNING_LAW}
            isAnswered={!!formData[FIELDS.GOVERNING_LAW]}
            onExpand={() => setExpandedField(FIELDS.GOVERNING_LAW)}
            onCollapse={collapse}
            onAdvance={() => advanceTo(FIELDS.GOVERNING_LAW)}
          >
            <QuestionRenderer fieldName={FIELDS.GOVERNING_LAW} config={QUESTION_CONFIG[FIELDS.GOVERNING_LAW]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
          </QuestionCard>
        </div>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.AMENDMENT_PROCESS].question}
          answerPreview={getPreview(FIELDS.AMENDMENT_PROCESS, formData, FIELDS.AMENDMENT_PROCESS_OTHER)}
          tooltip={QUESTION_CONFIG[FIELDS.AMENDMENT_PROCESS].tooltip}
          isExpanded={expandedField === FIELDS.AMENDMENT_PROCESS}
          isAnswered={!!formData[FIELDS.AMENDMENT_PROCESS]}
          onExpand={() => setExpandedField(FIELDS.AMENDMENT_PROCESS)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.AMENDMENT_PROCESS)}
        >
          <QuestionRenderer fieldName={FIELDS.AMENDMENT_PROCESS} config={QUESTION_CONFIG[FIELDS.AMENDMENT_PROCESS]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />
        </QuestionCard>

        <QuestionCard
          question="How often (in months) should this agreement be reviewed by the cofounders?"
          answerPreview={formData[FIELDS.REVIEW_FREQUENCY_MONTHS] ? `Every ${formData[FIELDS.REVIEW_FREQUENCY_MONTHS]} months` : ''}
          isExpanded={expandedField === FIELDS.REVIEW_FREQUENCY_MONTHS}
          isAnswered={!!formData[FIELDS.REVIEW_FREQUENCY_MONTHS]}
          onExpand={() => setExpandedField(FIELDS.REVIEW_FREQUENCY_MONTHS)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.REVIEW_FREQUENCY_MONTHS)}
        >
          {showValidation && !formData[FIELDS.REVIEW_FREQUENCY_MONTHS] && <span className="text-red-700 text-xs">* Required</span>}
          <input
            type="number" min="0"
            value={formData[FIELDS.REVIEW_FREQUENCY_MONTHS] || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (parseInt(value) >= 0 && !value.includes('-'))) {
                handleChange(FIELDS.REVIEW_FREQUENCY_MONTHS, value);
                handleChange(FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW, {});
              }
            }}
            onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
            disabled={isReadOnly} placeholder="Enter number of months"
          />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW].question}
          answerPreview={getPreview(FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW, formData)}
          isExpanded={expandedField === FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW}
          isAnswered={isAckAnswered(FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW)}
          onExpand={() => setExpandedField(FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW)}
        >
          <QuestionRenderer fieldName={FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW} config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST].question}
          answerPreview={getPreview(FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST, formData)}
          isExpanded={expandedField === FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST}
          isAnswered={isAckAnswered(FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST)}
          onExpand={() => setExpandedField(FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST)}
        >
          <QuestionRenderer fieldName={FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST} config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT].question}
          answerPreview={getPreview(FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT, formData)}
          isExpanded={expandedField === FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT}
          isAnswered={isAckAnswered(FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT)}
          onExpand={() => setExpandedField(FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT)}
        >
          <QuestionRenderer fieldName={FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT} config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_SEVERABILITY].question}
          answerPreview={getPreview(FIELDS.ACKNOWLEDGE_SEVERABILITY, formData)}
          isExpanded={expandedField === FIELDS.ACKNOWLEDGE_SEVERABILITY}
          isAnswered={isAckAnswered(FIELDS.ACKNOWLEDGE_SEVERABILITY)}
          onExpand={() => setExpandedField(FIELDS.ACKNOWLEDGE_SEVERABILITY)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.ACKNOWLEDGE_SEVERABILITY)}
        >
          <QuestionRenderer fieldName={FIELDS.ACKNOWLEDGE_SEVERABILITY} config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_SEVERABILITY]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} />
        </QuestionCard>

        <div style={{ background: '#E9E5DF', borderRadius: '6px', padding: '14px 18px', marginTop: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: 300, color: '#666', lineHeight: 1.65 }}>
            <strong style={{ fontWeight: 500 }}>Important:</strong> This document is a starting point and should be reviewed by a qualified attorney before signing. Laws vary by jurisdiction, and this agreement may not cover all scenarios relevant to your specific situation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SectionFinal;

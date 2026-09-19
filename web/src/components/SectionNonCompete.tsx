import { useState } from 'react';
import { FIELDS, type SurveyFieldName } from '@cherrytree/shared';

import QuestionRenderer from './QuestionRenderer.tsx';
import QuestionCard from './QuestionCard.tsx';
import type { SurveySectionProps } from './sectionProps.ts';
import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { getPreview } from '../utils/getPreview.ts';

const FIELD_ORDER = [
  FIELDS.ACKNOWLEDGE_CONFIDENTIALITY,
  FIELDS.NON_COMPETE_DURATION,
  FIELDS.NON_SOLICIT_DURATION,
] as const;

type Field = (typeof FIELD_ORDER)[number];

function SectionNonCompete({
  formData,
  handleChange,
  isReadOnly,
  project,
  showValidation,
}: SurveySectionProps) {
  const isAckAnswered = (f: SurveyFieldName): boolean => {
    const v: unknown = formData[f];
    return !!(
      v &&
      typeof v === 'object' &&
      Object.values(v).length > 0 &&
      Object.values(v).every(Boolean)
    );
  };
  const firstUnanswered = FIELD_ORDER.find((f) => {
    if (f === FIELDS.ACKNOWLEDGE_CONFIDENTIALITY) return !isAckAnswered(f);
    return !formData[f];
  });
  const [expandedField, setExpandedField] = useState<Field | null>(
    firstUnanswered || FIELD_ORDER[0],
  );
  const advanceTo = (key: Field) => {
    const idx = FIELD_ORDER.indexOf(key);
    if (idx < FIELD_ORDER.length - 1) setExpandedField(FIELD_ORDER[idx + 1] ?? null);
  };
  const collapse = () => setExpandedField(null);

  return (
    <div>
      <h2
        style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: '42px',
          fontWeight: 400,
          letterSpacing: '-0.5px',
          marginBottom: '14px',
          lineHeight: 1.1,
          color: '#1a1a1a',
        }}
      >
        Confidentiality, Non-Competition &amp; Non-Solicitation
      </h2>
      <p
        style={{
          fontSize: '14px',
          fontWeight: 200,
          color: '#555',
          lineHeight: 1.65,
          marginBottom: '32px',
        }}
      >
        You know how when you go to a bar with your friend, you have an unspoken agreement to not
        hit on the same person? Confidentiality, Non-Competition and Non-Solicitation kind of work
        the same way. They take the unspoken worries off the table so nothing turns awkward later.
        Make sure everyone knows what's off limits.
      </p>

      <div>
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY].question}
          answerPreview={getPreview(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY, formData)}
          isExpanded={expandedField === FIELDS.ACKNOWLEDGE_CONFIDENTIALITY}
          isAnswered={isAckAnswered(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY)}
          onExpand={() => setExpandedField(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY)}
        >
          <QuestionRenderer
            fieldName={FIELDS.ACKNOWLEDGE_CONFIDENTIALITY}
            config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            project={project}
          />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.NON_COMPETE_DURATION].question}
          answerPreview={getPreview(
            FIELDS.NON_COMPETE_DURATION,
            formData,
            FIELDS.NON_COMPETE_DURATION_OTHER,
          )}
          tooltip={QUESTION_CONFIG[FIELDS.NON_COMPETE_DURATION].tooltip}
          isExpanded={expandedField === FIELDS.NON_COMPETE_DURATION}
          isAnswered={!!formData[FIELDS.NON_COMPETE_DURATION]}
          onExpand={() => setExpandedField(FIELDS.NON_COMPETE_DURATION)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.NON_COMPETE_DURATION)}
        >
          <QuestionRenderer
            fieldName={FIELDS.NON_COMPETE_DURATION}
            config={QUESTION_CONFIG[FIELDS.NON_COMPETE_DURATION]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            project={project}
            hideLabel
          />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.NON_SOLICIT_DURATION].question}
          answerPreview={getPreview(
            FIELDS.NON_SOLICIT_DURATION,
            formData,
            FIELDS.NON_SOLICIT_DURATION_OTHER,
          )}
          tooltip={QUESTION_CONFIG[FIELDS.NON_SOLICIT_DURATION].tooltip}
          isExpanded={expandedField === FIELDS.NON_SOLICIT_DURATION}
          isAnswered={!!formData[FIELDS.NON_SOLICIT_DURATION]}
          onExpand={() => setExpandedField(FIELDS.NON_SOLICIT_DURATION)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.NON_SOLICIT_DURATION)}
        >
          <QuestionRenderer
            fieldName={FIELDS.NON_SOLICIT_DURATION}
            config={QUESTION_CONFIG[FIELDS.NON_SOLICIT_DURATION]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            project={project}
            hideLabel
          />
        </QuestionCard>
      </div>
    </div>
  );
}

export default SectionNonCompete;

import { useState } from 'react';
import { FIELDS, type SurveyFieldName } from '@cherrytree/shared';

import QuestionRenderer from './QuestionRenderer.tsx';
import QuestionCard from './QuestionCard.tsx';
import type { SurveySectionProps } from './sectionProps.ts';
import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { getPreview } from '../utils/getPreview.ts';

const FIELD_ORDER = [
  FIELDS.HAS_PRE_EXISTING_IP,
  FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT,
  FIELDS.ACKNOWLEDGE_IP_OWNERSHIP,
] as const;

type Field = (typeof FIELD_ORDER)[number];

function SectionIP({
  formData,
  handleChange,
  isReadOnly,
  project,
  showValidation,
}: SurveySectionProps) {
  const firstUnanswered = FIELD_ORDER.find((f) => {
    const v: unknown = formData[f];
    if (!v) return true;
    if (typeof v === 'object') return !Object.values(v).every(Boolean);
    return false;
  });
  const [expandedField, setExpandedField] = useState<Field | null>(
    firstUnanswered || FIELD_ORDER[0],
  );
  const advanceTo = (key: Field) => {
    const idx = FIELD_ORDER.indexOf(key);
    if (idx < FIELD_ORDER.length - 1) setExpandedField(FIELD_ORDER[idx + 1] ?? null);
  };
  const collapse = () => setExpandedField(null);

  const isAckAnswered = (fieldName: SurveyFieldName): boolean => {
    const v: unknown = formData[fieldName];
    return !!(
      v &&
      typeof v === 'object' &&
      Object.values(v).length > 0 &&
      Object.values(v).every(Boolean)
    );
  };

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
        IP &amp; Ownership of Work
      </h2>
      <p
        style={{
          fontSize: '14px',
          fontWeight: 200,
          color: '#555',
          lineHeight: 1.65,
          marginBottom: '12px',
        }}
      >
        In 2013, Reggie Brown sued his Snapchat cofounders, Evan Spiegel and Bobby Murphy. He
        claimed they stole his idea: an app where messages vanish after being sent. Brown said he
        not only conceived the concept but also shook hands with Spiegel to serve as CMO. He claimed
        credit for the original name "Picaboo," the ghost logo, and even a draft patent for the
        disappearing-message technology.
      </p>
      <p
        style={{
          fontSize: '14px',
          fontWeight: 200,
          color: '#555',
          lineHeight: 1.65,
          marginBottom: '12px',
        }}
      >
        Not long after they started, the partnership unraveled. Brown alleged he was locked out of
        company accounts and cut off all communication. One day a cofounder, the next day erased
        entirely. After a long legal battle, Snapchat settled, paying Brown $157 million.
      </p>
      <p
        style={{
          fontSize: '14px',
          fontWeight: 200,
          color: '#555',
          lineHeight: 1.65,
          marginBottom: '32px',
        }}
      >
        Without being specific about IP, even college buddies can turn on each other.
      </p>

      <div>
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.HAS_PRE_EXISTING_IP].question}
          answerPreview={getPreview(FIELDS.HAS_PRE_EXISTING_IP, formData)}
          tooltip={QUESTION_CONFIG[FIELDS.HAS_PRE_EXISTING_IP].tooltip}
          isExpanded={expandedField === FIELDS.HAS_PRE_EXISTING_IP}
          isAnswered={!!formData[FIELDS.HAS_PRE_EXISTING_IP]}
          onExpand={() => setExpandedField(FIELDS.HAS_PRE_EXISTING_IP)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.HAS_PRE_EXISTING_IP)}
        >
          <QuestionRenderer
            fieldName={FIELDS.HAS_PRE_EXISTING_IP}
            config={QUESTION_CONFIG[FIELDS.HAS_PRE_EXISTING_IP]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            project={project}
            hideLabel
          />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT].question}
          answerPreview={getPreview(FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT, formData)}
          isExpanded={expandedField === FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT}
          isAnswered={isAckAnswered(FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT)}
          onExpand={() => setExpandedField(FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT)}
        >
          <QuestionRenderer
            fieldName={FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT}
            config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            project={project}
          />
        </QuestionCard>

        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_IP_OWNERSHIP].question}
          answerPreview={getPreview(FIELDS.ACKNOWLEDGE_IP_OWNERSHIP, formData)}
          isExpanded={expandedField === FIELDS.ACKNOWLEDGE_IP_OWNERSHIP}
          isAnswered={isAckAnswered(FIELDS.ACKNOWLEDGE_IP_OWNERSHIP)}
          onExpand={() => setExpandedField(FIELDS.ACKNOWLEDGE_IP_OWNERSHIP)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.ACKNOWLEDGE_IP_OWNERSHIP)}
        >
          <QuestionRenderer
            fieldName={FIELDS.ACKNOWLEDGE_IP_OWNERSHIP}
            config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_IP_OWNERSHIP]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            project={project}
          />
        </QuestionCard>
      </div>
    </div>
  );
}

export default SectionIP;

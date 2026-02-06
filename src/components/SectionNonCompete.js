import React from 'react';
import QuestionRenderer from './QuestionRenderer';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';

function SectionNonCompete({ formData, handleChange, isReadOnly, project, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Confidentiality, Non-Competition & Non-Solicitation</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        You know how when you go to a bar with your friend, you have an unspoken agreement to not hit on the same person? Confidentiality, Non-Competition and Non-Solicitation kind of work the same way. They take the unspoken worries off the table so nothing turns awkward later. Make sure everyone knows what's off limits.
      </p>

      <div className="space-y-12">
        <QuestionRenderer
          fieldName={FIELDS.ACKNOWLEDGE_CONFIDENTIALITY}
          config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        <QuestionRenderer
          fieldName={FIELDS.NON_COMPETE_DURATION}
          config={QUESTION_CONFIG[FIELDS.NON_COMPETE_DURATION]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        <QuestionRenderer
          fieldName={FIELDS.NON_SOLICIT_DURATION}
          config={QUESTION_CONFIG[FIELDS.NON_SOLICIT_DURATION]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />
      </div>
    </div>
  );
}

export default SectionNonCompete;

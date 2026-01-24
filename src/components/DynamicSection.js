import React from 'react';
import QuestionRenderer from './QuestionRenderer';
import { SECTION_CONFIG } from '../config/sectionConfig';
import { QUESTION_CONFIG, getQuestionsBySection } from '../config/questionConfig';

/**
 * DynamicSection - Renders an entire section dynamically from questionConfig
 *
 * @param {string} sectionId - Section identifier (e.g., 'formation', 'cofounders')
 * @param {string} customTitle - Optional custom title (overrides config)
 * @param {string} customDescription - Optional custom description (overrides config)
 * @param {object} customComponents - Optional custom components to render for specific fields
 *   Example: { companyName: <CustomAddressField /> }
 */
function DynamicSection({
  sectionId,
  formData,
  handleChange,
  isReadOnly,
  showValidation,
  project,
  customTitle,
  customDescription,
  customComponents = {}
}) {
  const sectionConfig = SECTION_CONFIG[sectionId];
  const questions = getQuestionsBySection(sectionId);

  if (!sectionConfig) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-sm text-red-800">Invalid section ID: {sectionId}</p>
      </div>
    );
  }

  const title = customTitle || sectionConfig.displayName;
  const description = customDescription || sectionConfig.description;

  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">{title}</h2>

      {description && (
        <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
          {description}
        </p>
      )}

      <div className="space-y-12" style={{ overflow: 'visible' }}>
        {questions.map((questionConfig) => {
          const fieldName = questionConfig.fieldName;

          // If custom component provided for this field, render it instead
          if (customComponents[fieldName]) {
            return (
              <div key={fieldName}>
                {customComponents[fieldName]}
              </div>
            );
          }

          // Skip nested fields (like cofounder fields) - these are handled by parent component
          if (questionConfig.nested) {
            return null;
          }

          // Skip custom type questions - they should be in customComponents
          if (questionConfig.type === 'custom') {
            return null;
          }

          return (
            <QuestionRenderer
              key={fieldName}
              fieldName={fieldName}
              config={questionConfig}
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              showValidation={showValidation}
              project={project}
            />
          );
        })}
      </div>
    </div>
  );
}

export default DynamicSection;

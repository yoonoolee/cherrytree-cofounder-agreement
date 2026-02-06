import React from 'react';
import QuestionRenderer from './QuestionRenderer';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';

function SectionIP({ formData, handleChange, isReadOnly, project, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">IP & Ownership of Work</h2>

      <p className="mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
        In 2013, Reggie Brown sued his Snapchat cofounders, Evan Spiegel and Bobby Murphy. He claimed they stole his idea: an app where messages vanish after being sent. Brown said he not only conceived the concept but also shook hands with Spiegel to serve as CMO. He claimed credit for the original name "Picaboo," the ghost logo, and even a draft patent for the disappearing-message technology.
      </p>
      <p className="mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
        Not long after they started, the partnership unraveled. Brown alleged he was locked out of company accounts and cut off all communication. One day a cofounder, the next day erased entirely. After a long legal battle, Snapchat settled, paying Brown $157 million.
      </p>
      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Without being specific about IP, even college buddies can turn on each other.
      </p>

      <div className="space-y-12">
        <QuestionRenderer
          fieldName={FIELDS.HAS_PRE_EXISTING_IP}
          config={QUESTION_CONFIG[FIELDS.HAS_PRE_EXISTING_IP]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        <QuestionRenderer
          fieldName={FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT}
          config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        <QuestionRenderer
          fieldName={FIELDS.ACKNOWLEDGE_IP_OWNERSHIP}
          config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_IP_OWNERSHIP]}
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

export default SectionIP;

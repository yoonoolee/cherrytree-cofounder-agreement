import React from 'react';
import QuestionRenderer from './QuestionRenderer';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';

function SectionFinal({ formData, handleChange, isReadOnly, project, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">General Provisions</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Last stretch! Knock out these last few questions, then review and green-light your agreement.
      </p>

      <div className="space-y-12">
        {/* Dispute Resolution */}
        <QuestionRenderer
          fieldName={FIELDS.DISPUTE_RESOLUTION}
          config={QUESTION_CONFIG[FIELDS.DISPUTE_RESOLUTION]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Governing Law */}
        <div style={{ overflow: 'visible', position: 'relative', zIndex: 100, marginBottom: '3rem' }}>
          <QuestionRenderer
            fieldName={FIELDS.GOVERNING_LAW}
            config={QUESTION_CONFIG[FIELDS.GOVERNING_LAW]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            project={project}
          />
        </div>

        {/* Amendment Process */}
        <QuestionRenderer
          fieldName={FIELDS.AMENDMENT_PROCESS}
          config={QUESTION_CONFIG[FIELDS.AMENDMENT_PROCESS]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Periodic Review - Custom (underline styling) */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How often (in months) should this agreement be reviewed by the cofounders?
            {showValidation && !formData[FIELDS.REVIEW_FREQUENCY_MONTHS] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="number"
            min="0"
            value={formData[FIELDS.REVIEW_FREQUENCY_MONTHS] || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (parseInt(value) >= 0 && !value.includes('-'))) {
                handleChange(FIELDS.REVIEW_FREQUENCY_MONTHS, value);
                // Reset acknowledgment since the terms changed
                handleChange(FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW, {});
              }
            }}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            disabled={isReadOnly}
            className="w-full bg-transparent border-none border-b-2 border-gray-300 py-3 text-gray-700 focus:outline-none focus:border-black disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Enter number of months"
            style={{
              paddingLeft: 0,
              borderBottom: '2px solid #D1D5DB',
            }}
          />
        </div>

        {/* Periodic Review Acknowledgment */}
        <QuestionRenderer
          fieldName={FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW}
          config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Amendment Review Request Acknowledgment */}
        <QuestionRenderer
          fieldName={FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST}
          config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Entire Agreement Acknowledgment */}
        <QuestionRenderer
          fieldName={FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT}
          config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Severability Acknowledgment */}
        <QuestionRenderer
          fieldName={FIELDS.ACKNOWLEDGE_SEVERABILITY}
          config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_SEVERABILITY]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Final Note */}
        <div>
          <p className="text-xs text-gray-900">
            <strong>Important:</strong> This document is a starting point and should be reviewed by a qualified attorney before signing. Laws vary by jurisdiction, and this agreement may not cover all scenarios relevant to your specific situation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SectionFinal;

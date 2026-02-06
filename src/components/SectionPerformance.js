import React from 'react';
import Tooltip from './Tooltip';
import QuestionRenderer from './QuestionRenderer';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';

function SectionPerformance({ formData, handleChange, isReadOnly, showValidation, project }) {
  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Cofounder Performance & Departure</h2>

      <p className="mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
        In every startup, execution is everything. You can have the best idea in the world, the perfect cofounder team, and a shiny product plan, but if the work doesn't get done, nothing happens. However, sometimes, for one reason or another, we can't perform at the level that's necessary.
      </p>
      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        In those cases, the best we can do is protect the company and the friendship. You do that by planning for the what-ifs ahead of time. Performance isn't just about grinding harder. It's about foresight, flexibility, and keeping the company moving even when things don't go perfectly.
      </p>

      <div className="space-y-12">
        {/* Performance Consequences */}
        <QuestionRenderer
          fieldName={FIELDS.PERFORMANCE_CONSEQUENCES}
          config={QUESTION_CONFIG[FIELDS.PERFORMANCE_CONSEQUENCES]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Remedy Period - Custom (underline styling + integer validation) */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How many days does a cofounder have to fix the issue after receiving written notice before termination can occur?
            {showValidation && !formData[FIELDS.REMEDY_PERIOD_DAYS] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
            <Tooltip text="This period allows cofounders to address issues in good faith before more serious action is taken." />
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData[FIELDS.REMEDY_PERIOD_DAYS] || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow integers (no decimals) and no negatives
              if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
                handleChange(FIELDS.REMEDY_PERIOD_DAYS, value);
              }
            }}
            onKeyDown={(e) => {
              // Prevent decimal point and minus sign
              if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            disabled={isReadOnly}
            className="w-full bg-transparent border-none border-b-2 border-gray-300 py-3 text-gray-700 focus:outline-none focus:border-black disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Enter number of days"
            style={{
              paddingLeft: 0,
              borderBottom: '2px solid #D1D5DB',
            }}
          />
        </div>

        {/* Termination with Cause */}
        <QuestionRenderer
          fieldName={FIELDS.TERMINATION_WITH_CAUSE}
          config={QUESTION_CONFIG[FIELDS.TERMINATION_WITH_CAUSE]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Voluntary Notice Period - Custom (underline styling) */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How many days is the notice period if a Cofounder wishes to voluntarily leave?
            {showValidation && !formData[FIELDS.VOLUNTARY_NOTICE_DAYS] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="number"
            value={formData[FIELDS.VOLUNTARY_NOTICE_DAYS] || ''}
            onChange={(e) => handleChange(FIELDS.VOLUNTARY_NOTICE_DAYS, e.target.value)}
            disabled={isReadOnly}
            className="w-full bg-transparent border-none border-b-2 border-gray-300 py-3 text-gray-700 focus:outline-none focus:border-black disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Enter number of days"
            style={{
              paddingLeft: 0,
              borderBottom: '2px solid #D1D5DB',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default SectionPerformance;

import React from 'react';
import Tooltip from './Tooltip';

function Section8Performance({ formData, handleChange, isReadOnly, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Cofounder Performance & Departure</h2>

      <p className="text-gray-700 mb-8 leading-relaxed">
        In every startup, execution is everything. You can have the best idea in the world, the perfect cofounder team, and a shiny product plan, but if the work doesn't get done, nothing happens. However, sometimes, for one reason or another, we can't perform at the level that's necessary.
      </p>
      <p className="text-gray-700 mb-8 leading-relaxed">
        In those cases, the best we can do is protect the company and the friendship. You do that by planning for the what-ifs ahead of time. Performance isn't just about grinding harder. It's about foresight, flexibility, and keeping the company moving even when things don't go perfectly.
      </p>

      <hr className="border-gray-300 mb-8" />

      <div className="space-y-12">
        {/* Performance Consequences */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What happens if a cofounder fails to meet their agreed-upon obligations (e.g., time commitment, role performance, or deliverables)?
            {showValidation && (!formData.performanceConsequences || formData.performanceConsequences.length === 0) && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
          <div className="space-y-2">
            {[
              'Formal warning and performance plan',
              'Temporary suspension of voting rights',
              'Reduction or dilution of unvested equity',
              'Role reassignment or demotion',
              'Termination'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(formData.performanceConsequences || []).includes(option)}
                  onChange={(e) => {
                    const current = formData.performanceConsequences || [];
                    const newList = e.target.checked
                      ? [...current, option]
                      : current.filter(item => item !== option);
                    handleChange('performanceConsequences', newList);
                  }}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Remedy Period */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How many days does a cofounder have to fix the issue after receiving written notice before termination can occur?
            {showValidation && !formData.remedyPeriodDays && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData.remedyPeriodDays || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow integers (no decimals) and no negatives
              if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
                handleChange('remedyPeriodDays', value);
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
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Which of the following constitutes termination "with cause"?
            <Tooltip text="Basically, what kind of bad behavior gets you booted." />
            {showValidation && (!formData.terminationWithCause || formData.terminationWithCause.length === 0) && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
          <div className="space-y-2">
            {[
              'Fraud, embezzlement, or theft',
              'Breach of fiduciary duty',
              'Willful misconduct or gross negligence',
              'Material breach of this agreement',
              'Criminal conviction',
              'Violation of Company policies',
              'Other'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(formData.terminationWithCause || []).includes(option)}
                  onChange={(e) => {
                    const current = formData.terminationWithCause || [];
                    const newList = e.target.checked
                      ? [...current, option]
                      : current.filter(item => item !== option);
                    handleChange('terminationWithCause', newList);
                  }}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {(formData.terminationWithCause || []).includes('Other') && (
            <div className="conditional-section">
              <input
                type="text"
                value={formData.terminationWithCauseOther || ''}
                onChange={(e) => handleChange('terminationWithCauseOther', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Please specify"
              />
            </div>
          )}
        </div>

        {/* Voluntary Notice Period */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            How many days is the notice period if a Cofounder wishes to voluntarily leave?
            {showValidation && !formData.voluntaryNoticeDays && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="number"
            value={formData.voluntaryNoticeDays || ''}
            onChange={(e) => handleChange('voluntaryNoticeDays', e.target.value)}
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

export default Section8Performance;

import React from 'react';
import Tooltip from './Tooltip';
import QuestionRenderer from './QuestionRenderer';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';

function SectionEquityVesting({ formData, handleChange, isReadOnly, project, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Vesting Schedule</h2>

      <p className="mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
        When Robin and Antje started Zipcar, they decided to split ownership 50/50. Fair and simple. At first, it seemed like a success story: the company grew, became highly profitable, and eventually went public.
      </p>
      <p className="mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
        But within a year and a half, conflicts caused Robin to fire Antje. Except, Antje kept her 50% stake in the company. Robin was stuck working around the clock for virtually no pay.
      </p>
      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        This is exactly why vesting exists. Without it, a cofounder can walk away with a huge slice of the company without putting in the work, leaving the remaining cofounders carrying the burden. Vesting means you earn your equity over time by building the company.
      </p>

      <div className="space-y-12">
        {/* Vesting Start Date */}
        <QuestionRenderer
          fieldName={FIELDS.VESTING_START_DATE}
          config={QUESTION_CONFIG[FIELDS.VESTING_START_DATE]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Vesting Schedule */}
        <QuestionRenderer
          fieldName={FIELDS.VESTING_SCHEDULE}
          config={QUESTION_CONFIG[FIELDS.VESTING_SCHEDULE]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Cliff Percentage - Custom (cursor management) */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What percent of equity will be vested once the cliff is complete?
            {showValidation && !formData[FIELDS.CLIFF_PERCENTAGE] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
            <Tooltip text="If you leave before the cliff, you get nothing." />
          </label>
          <p className="text-sm text-gray-500 mb-2">The standard is 25% for 4 years with a 1-year cliff</p>
          <input
            type="text"
            value={formData[FIELDS.CLIFF_PERCENTAGE] ? `${formData[FIELDS.CLIFF_PERCENTAGE]}%` : ''}
            onChange={(e) => {
              const input = e.target;
              const cursorPos = input.selectionStart;
              const value = e.target.value.replace('%', '');

              if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                handleChange(FIELDS.CLIFF_PERCENTAGE, value);

                // Keep cursor before the %
                setTimeout(() => {
                  const newPos = Math.min(cursorPos, value.length);
                  input.setSelectionRange(newPos, newPos);
                }, 0);
              }
            }}
            onKeyDown={(e) => {
              const input = e.target;
              const value = input.value.replace('%', '');
              const cursorPos = input.selectionStart;

              // Prevent cursor from going past the number into %
              if (e.key === 'ArrowRight' && cursorPos >= value.length) {
                e.preventDefault();
              }

              // Keep cursor before % on arrow left at the end
              if (e.key === 'ArrowLeft' && cursorPos > value.length) {
                e.preventDefault();
                input.setSelectionRange(value.length, value.length);
              }
            }}
            onClick={(e) => {
              const input = e.target;
              const value = input.value.replace('%', '');
              const cursorPos = input.selectionStart;

              // If clicked after the %, move cursor before %
              if (cursorPos > value.length) {
                setTimeout(() => {
                  input.setSelectionRange(value.length, value.length);
                }, 0);
              }
            }}
            onFocus={(e) => {
              const input = e.target;
              const value = input.value.replace('%', '');
              // Position cursor at end of number, before %
              setTimeout(() => {
                input.setSelectionRange(value.length, value.length);
              }, 0);
            }}
            disabled={isReadOnly}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
            placeholder="25%"
          />
        </div>

        {/* Acceleration Trigger - Custom (nested conditional) */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            If the company is acquired and a cofounder is terminated without cause, should their unvested shares accelerate?
            {showValidation && !formData[FIELDS.ACCELERATION_TRIGGER] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
            <Tooltip text="Acceleration decides if unvested shares vest early. Single-trigger happens when the company is acquired. Double-trigger only kicks in if the company is acquired and you're terminated without cause." />
          </label>
          <div className="space-y-2">
            {[
              'Yes',
              'No'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="accelerationTrigger"
                  value={option}
                  checked={formData[FIELDS.ACCELERATION_TRIGGER] === option}
                  onClick={() => {
                    if (!isReadOnly) {
                      const newValue = formData[FIELDS.ACCELERATION_TRIGGER] === option ? '' : option;
                      handleChange(FIELDS.ACCELERATION_TRIGGER, newValue);
                      if (newValue !== 'Yes') {
                        handleChange('accelerationProtectionMonths', '');
                      }
                    }
                  }}
                  onChange={() => {}}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {/* Conditional: Acceleration Protection Period */}
          {formData[FIELDS.ACCELERATION_TRIGGER] === 'Yes' && (
            <div className="conditional-section">
              <label className="block text-base font-medium text-gray-900 mb-2">
                For how long after the acquisition should this protection apply?
                {showValidation && !formData.accelerationProtectionMonths && <span className="text-red-700 ml-0.5 validation-error">*</span>}
              </label>
              <div className="space-y-2">
                {['6 months', '12 months', '18 months'].map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name="accelerationProtectionMonths"
                      value={option}
                      checked={formData.accelerationProtectionMonths === option}
                      onClick={() => {
                        if (!isReadOnly) {
                          handleChange('accelerationProtectionMonths', formData.accelerationProtectionMonths === option ? '' : option);
                        }
                      }}
                      onChange={() => {}}
                      disabled={isReadOnly}
                      className="mr-3"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shares Sell Notice Days - Custom (integer validation) */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            If a cofounder wants to sell their shares, how many days notice do they need to provide the Board and shareholders?
            {showValidation && !formData[FIELDS.SHARES_SELL_NOTICE_DAYS] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData[FIELDS.SHARES_SELL_NOTICE_DAYS] || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow integers (no decimals)
              if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
                handleChange(FIELDS.SHARES_SELL_NOTICE_DAYS, value);
              }
            }}
            onKeyDown={(e) => {
              // Prevent decimal point and minus sign
              if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            disabled={isReadOnly}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
            placeholder="30"
          />
        </div>

        {/* Shares Buyback Days - Custom (integer validation) */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            If a cofounder resigns, how many days does the company have to buy back the shares?
            {showValidation && !formData[FIELDS.SHARES_BUYBACK_DAYS] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData[FIELDS.SHARES_BUYBACK_DAYS] || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow integers (no decimals)
              if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
                handleChange(FIELDS.SHARES_BUYBACK_DAYS, value);
              }
            }}
            onKeyDown={(e) => {
              // Prevent decimal point and minus sign
              if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            disabled={isReadOnly}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
            placeholder="90"
          />
        </div>

        {/* Acknowledge Forfeiture */}
        <QuestionRenderer
          fieldName={FIELDS.ACKNOWLEDGE_FORFEITURE}
          config={QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_FORFEITURE]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Vested Shares Disposal */}
        <QuestionRenderer
          fieldName={FIELDS.VESTED_SHARES_DISPOSAL}
          config={QUESTION_CONFIG[FIELDS.VESTED_SHARES_DISPOSAL]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* 83(b) Note */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> If you receive unvested shares, you can file an 83(b) election within 30 days of incorporation. This lets you pay taxes on the current (usually low) value of your shares instead of their future value as they vest. Doing so can save you thousands (if not more) if the company grows, but the election is irreversible. Consult a tax advisor.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SectionEquityVesting;

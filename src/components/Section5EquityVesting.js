import React from 'react';
import { auth } from '../firebase';
import Tooltip from './Tooltip';

function Section5EquityVesting({ formData, handleChange, isReadOnly, project, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Vesting Schedule</h2>

      <p className="text-gray-700 mb-4 leading-relaxed">
        When Robin and Antje started Zipcar, they decided to split ownership 50/50. Fair and simple. At first, it seemed like a success story: the company grew, became highly profitable, and eventually went public.
      </p>
      <p className="text-gray-700 mb-4 leading-relaxed">
        But within a year and a half, cofounder conflicts caused Robin to fire Antje. Except, Antje kept her 50% stake in the company. Robin was stuck working around the clock, for virtually no pay.
      </p>
      <p className="text-gray-700 mb-8 leading-relaxed">
        This is exactly why vesting exists. Without it, a cofounder can walk away with a huge slice of the company without putting in the work, leaving the remaining founders carrying the burden. Vesting means you earn your equity over time by building the company.
      </p>

      <div className="border-b border-gray-200 mb-8"></div>

      <div className="space-y-12">
        {/* Vesting Start Date */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What date should the vesting start?
            <Tooltip text="This can start today or retroactively when the work began." />
            {showValidation && !formData.vestingStartDate && <span className="text-red-700 ml-0.5">*</span>}
          </label>
          <input
            type="date"
            value={formData.vestingStartDate || ''}
            onChange={(e) => handleChange('vestingStartDate', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Vesting Schedule */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What vesting schedule will you use?
            <Tooltip text='You earn no equity until the "cliff" is hit. Then, once the cliff is reached, you immediately vest the first portion of your equity, and the rest continues to vest gradually over the remaining period.' />
            {showValidation && !formData.vestingSchedule && <span className="text-red-700 ml-0.5">*</span>}
          </label>
          <p className="text-sm text-gray-500 mb-2">The standard is 4 years with a 1-year cliff</p>
          <div className="space-y-2">
            {[
              '4 years with 1-year cliff',
              '3 years with 1-year cliff',
              'Immediate',
              'Other'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="vestingSchedule"
                  value={option}
                  checked={formData.vestingSchedule === option}
                  onChange={(e) => handleChange('vestingSchedule', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {formData.vestingSchedule === 'Other' && (
            <input
              type="text"
              value={formData.vestingScheduleOther || ''}
              onChange={(e) => handleChange('vestingScheduleOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify"
            />
          )}
        </div>

        {/* Cliff Percentage */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What percent of equity will be vested once the cliff is complete?
            <Tooltip text="If you leave before the cliff, you get nothing." />
            {showValidation && !formData.cliffPercentage && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <p className="text-sm text-gray-500 mb-2">The standard is 25% for 4 years with a 1-year cliff</p>
          <input
            type="text"
            value={formData.cliffPercentage ? `${formData.cliffPercentage}%` : ''}
            onChange={(e) => {
              const input = e.target;
              const cursorPos = input.selectionStart;
              const value = e.target.value.replace('%', '');

              if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                handleChange('cliffPercentage', value);

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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="25%"
          />
        </div>

        {/* Acceleration Trigger */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Should unvested shares accelerate if the cofounder is terminated and the company is acquired?
            <Tooltip text="Acceleration decides if unvested shares vest early. Single-trigger happens when the company is acquired. Double-trigger only kicks in if the company is acquired and you're terminated without cause." />
            {showValidation && !formData.accelerationTrigger && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <div className="space-y-2">
            {[
              'Acceleration requires termination with cause',
              'Acceleration requires termination without cause'
            ].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="accelerationTrigger"
                  value={option}
                  checked={formData.accelerationTrigger === option}
                  onChange={(e) => handleChange('accelerationTrigger', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Shares Sell Notice Days */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            If a cofounder wants to sell their shares, how many days notice do they need to provide the Board and shareholders?
            {showValidation && !formData.sharesSellNoticeDays && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData.sharesSellNoticeDays || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow integers (no decimals)
              if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
                handleChange('sharesSellNoticeDays', value);
              }
            }}
            onKeyDown={(e) => {
              // Prevent decimal point and minus sign
              if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            disabled={isReadOnly}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="30"
          />
        </div>

        {/* Shares Buyback Days */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            If a cofounder resigns, how many days does the company have to buy back the shares?
            {showValidation && !formData.sharesBuybackDays && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData.sharesBuybackDays || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow integers (no decimals)
              if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
                handleChange('sharesBuybackDays', value);
              }
            }}
            onKeyDown={(e) => {
              // Prevent decimal point and minus sign
              if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            disabled={isReadOnly}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="90"
          />
        </div>

        {/* Acknowledge Forfeiture */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            {(() => {
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgeForfeiture?.[email]);
              return (
                <>
                  You acknowledge that if a cofounder dies, becomes permanently disabled, or is otherwise incapacitated, their unvested shares are automatically forfeited and returned to the company.
                  <Tooltip text="Knock on wood." />
                  {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                </>
              );
            })()}
          </label>
          <div className="space-y-2">
            {(() => {
              // Deduplicate collaborators list
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const approvals = formData.acknowledgeForfeiture || {};
              const currentUserEmail = auth.currentUser?.email;

              return allCollaborators.map((email, index) => {
                const isApproved = approvals[email] || false;
                const isCurrentUser = email === currentUserEmail;

                return (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => {
                        const newApprovals = { ...approvals, [email]: e.target.checked };
                        handleChange('acknowledgeForfeiture', newApprovals);
                      }}
                      disabled={isReadOnly || !isCurrentUser}
                      className="mr-3"
                    />
                    <span className="text-gray-700">
                      {email}
                      {email === project?.ownerEmail && <span className="ml-2 text-xs text-gray-500">(Owner)</span>}
                      {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                      
                    </span>
                  </label>
                );
              });
            })()}
          </div>
        </div>

        {/* Vested Shares Disposal */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            If a cofounder dies, becomes permanently disabled, or is otherwise incapacitated:
            {showValidation && !formData.vestedSharesDisposal && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <div className="space-y-2">
            {[
              'The company has the option to repurchase vested shares at Fair Market Value',
              'The company must repurchase vested shares at Fair Market Value',
              'Vested shares transfer to the cofounder\'s estate or heirs, without voting or board rights'
            ].map((option) => (
              <label key={option} className="flex items-start">
                <input
                  type="radio"
                  name="vestedSharesDisposal"
                  value={option}
                  checked={formData.vestedSharesDisposal === option}
                  onChange={(e) => handleChange('vestedSharesDisposal', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3 mt-1"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

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

export default Section5EquityVesting;

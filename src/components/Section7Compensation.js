import React from 'react';
import CustomSelect from './CustomSelect';

function Section7Compensation({ formData, handleChange, isReadOnly, showValidation }) {
  const compensations = formData.compensations || [];

  const handleAddCompensation = () => {
    const newCompensations = [...compensations, { who: '', amount: '' }];
    handleChange('compensations', newCompensations);
  };

  const handleRemoveCompensation = (index) => {
    const newCompensations = compensations.filter((_, i) => i !== index);
    handleChange('compensations', newCompensations);
  };

  const handleCompensationChange = (index, field, value) => {
    const newCompensations = [...compensations];
    newCompensations[index] = {
      ...newCompensations[index],
      [field]: value
    };
    handleChange('compensations', newCompensations);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Compensation & Expenses</h2>

      <p className="text-gray-700 mb-4 leading-relaxed">
        In the early days of Netflix, they gave their team corporate cards. In an effort to keep them frugal, they told them to spend it as if it were their own money. It came as a surprise then, when a cofounder walked past a group of juniors who were seated in business class, to get to his own seat in economy. Personal spending habits vary.
      </p>
      <p className="text-gray-700 mb-8 leading-relaxed">
        Money talks, even among cofounders. Don't wait until someone's scraping by or resenting late nights. Decide who gets what, when, and how early. Nothing kills a startup vibe faster than vague pay talk.
      </p>

      <div className="space-y-12" style={{ overflow: 'visible' }}>
        {/* Taking Compensation */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Are any cofounders currently taking compensation or salary from the company?
            {showValidation && !formData.takingCompensation && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <div className="space-y-2">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="takingCompensation"
                  value={option}
                  checked={formData.takingCompensation === option}
                  onChange={(e) => handleChange('takingCompensation', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Compensation Details */}
        {formData.takingCompensation === 'Yes' && (
          <div className="border-l-4 border-gray-300 pl-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-base font-medium text-gray-900">
                Compensation Details
              </label>
              <button
                type="button"
                onClick={handleAddCompensation}
                disabled={isReadOnly}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                + Add Compensation
              </button>
            </div>

            {compensations.length === 0 ? (
              <p className="text-gray-500 text-sm">Click "Add Compensation" to add entries</p>
            ) : (
              <div className="space-y-12" style={{ overflow: 'visible' }}>
                {compensations.map((comp, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4 py-2">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-700">Compensation {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompensation(index)}
                        disabled={isReadOnly}
                        className="text-red-500 hover:text-red-700 text-sm disabled:text-gray-400"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div style={{ overflow: 'visible', position: 'relative', zIndex: 100, marginBottom: '3rem' }}>
                        <label className="block text-base font-medium text-gray-900 mb-2">
                          Full Name
                          {showValidation && !comp.who && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                        </label>
                        <CustomSelect
                          value={comp.who || ''}
                          onChange={(value) => handleCompensationChange(index, 'who', value)}
                          options={(formData.cofounders || [])
                            .filter(cf => cf.fullName)
                            .filter(cofounder => {
                              // Show this cofounder if they're not selected in any OTHER compensation entry
                              const isSelectedElsewhere = compensations.some((c, i) =>
                                i !== index && c.who === cofounder.fullName
                              );
                              return !isSelectedElsewhere;
                            })
                            .map((cofounder) => ({
                              value: cofounder.fullName,
                              label: cofounder.fullName
                            }))}
                          placeholder="Select a cofounder"
                          disabled={isReadOnly}
                        />
                      </div>

                      <div>
                        <label className="block text-base font-medium text-gray-900 mb-2">
                          Compensation (USD/year)
                          {showValidation && !comp.amount && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                        </label>
                        <input
                          type="text"
                          value={comp.amount ? `$${(() => {
                            const val = comp.amount;
                            const parts = val.split('.');
                            const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                            return parts.length === 2 ? `${integerPart}.${parts[1]}` : integerPart;
                          })()}` : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace('$', '').replace(/,/g, '');

                            // Allow decimals for compensation (max 2 decimal places)
                            if (value === '') {
                              handleCompensationChange(index, 'amount', value);
                            } else if (!isNaN(value) && parseFloat(value) >= 0) {
                              // Check if it has more than 2 decimal places
                              const decimalParts = value.split('.');
                              if (decimalParts.length === 1 || (decimalParts.length === 2 && decimalParts[1].length <= 2)) {
                                handleCompensationChange(index, 'amount', value);
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            const input = e.target;
                            const cursorPos = input.selectionStart;

                            // Prevent cursor from going before the $
                            if ((e.key === 'ArrowLeft' || e.key === 'Home') && cursorPos <= 1) {
                              e.preventDefault();
                            }

                            // Prevent backspace at position 1 (right after $)
                            if (e.key === 'Backspace' && cursorPos <= 1) {
                              e.preventDefault();
                            }

                            // Prevent minus sign and invalid characters
                            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                          onClick={(e) => {
                            const input = e.target;
                            const cursorPos = input.selectionStart;

                            // If clicked on the $, move cursor after it
                            if (cursorPos === 0) {
                              setTimeout(() => {
                                input.setSelectionRange(1, 1);
                              }, 0);
                            }
                          }}
                          onFocus={(e) => {
                            const input = e.target;
                            // Position cursor after $ on focus
                            setTimeout(() => {
                              const value = input.value.replace('$', '');
                              input.setSelectionRange(value.length + 1, value.length + 1);
                            }, 0);
                          }}
                          disabled={isReadOnly}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="$100,000.00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spending Limit */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What's the spending limit, in USD, before a cofounder needs to check with other cofounders?
            {showValidation && !formData.spendingLimit && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="text"
            value={formData.spendingLimit ? `$${(() => {
              const val = formData.spendingLimit;
              const parts = val.split('.');
              const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              return parts.length === 2 ? `${integerPart}.${parts[1]}` : integerPart;
            })()}` : ''}
            onChange={(e) => {
              const value = e.target.value.replace('$', '').replace(/,/g, '');

              // Allow decimals for spending limit (max 2 decimal places)
              if (value === '') {
                handleChange('spendingLimit', value);
              } else if (!isNaN(value) && parseFloat(value) >= 0) {
                // Check if it has more than 2 decimal places
                const decimalParts = value.split('.');
                if (decimalParts.length === 1 || (decimalParts.length === 2 && decimalParts[1].length <= 2)) {
                  handleChange('spendingLimit', value);
                }
              }
            }}
            onKeyDown={(e) => {
              const input = e.target;
              const cursorPos = input.selectionStart;

              // Prevent cursor from going before the $
              if ((e.key === 'ArrowLeft' || e.key === 'Home') && cursorPos <= 1) {
                e.preventDefault();
              }

              // Prevent backspace at position 1 (right after $)
              if (e.key === 'Backspace' && cursorPos <= 1) {
                e.preventDefault();
              }

              // Prevent minus sign and invalid characters
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            onClick={(e) => {
              const input = e.target;
              const cursorPos = input.selectionStart;

              // If clicked on the $, move cursor after it
              if (cursorPos === 0) {
                setTimeout(() => {
                  input.setSelectionRange(1, 1);
                }, 0);
              }
            }}
            onFocus={(e) => {
              const input = e.target;
              // Position cursor after $ on focus
              setTimeout(() => {
                const value = input.value.replace('$', '');
                input.setSelectionRange(value.length + 1, value.length + 1);
              }, 0);
            }}
            disabled={isReadOnly}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="$5000.00"
          />
        </div>
      </div>
    </div>
  );
}

export default Section7Compensation;

import React from 'react';
import CustomSelect from './CustomSelect';
import QuestionRenderer from './QuestionRenderer';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';

function SectionCompensation({ formData, handleChange, isReadOnly, showValidation, project }) {
  const compensations = formData[FIELDS.COMPENSATIONS] || [];
  // Count all collaborators
  const collaboratorCount = Object.keys(project?.collaborators || {}).length;
  const canAddMore = compensations.length < collaboratorCount;

  const handleAddCompensation = () => {
    if (!canAddMore) return;
    const newCompensations = [...compensations, { who: '', amount: '' }];
    handleChange(FIELDS.COMPENSATIONS, newCompensations);
  };

  const handleRemoveCompensation = (index) => {
    const newCompensations = compensations.filter((_, i) => i !== index);
    handleChange(FIELDS.COMPENSATIONS, newCompensations);
  };

  const handleCompensationChange = (index, field, value) => {
    const newCompensations = [...compensations];
    newCompensations[index] = {
      ...newCompensations[index],
      [field]: value
    };
    handleChange(FIELDS.COMPENSATIONS, newCompensations);
  };

  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Compensation & Expenses</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Money issues cause more divorce than infidelity and incompatibility. It'd be naive to think cofounderships are immune. Don't wait until someone is frustrated over uneven pay or unclear expenses. Agree on how money flows now and keep communication transparent to avoid costly fallout.
      </p>

      <div className="space-y-12" style={{ overflow: 'visible' }}>
        {/* Taking Compensation */}
        <QuestionRenderer
          fieldName={FIELDS.TAKING_COMPENSATION}
          config={QUESTION_CONFIG[FIELDS.TAKING_COMPENSATION]}
          formData={formData}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
          project={project}
        />

        {/* Compensation Details - Custom (dynamic array + currency) */}
        {formData[FIELDS.TAKING_COMPENSATION] === 'Yes' && (
          <div className="border-l-4 border-gray-300 pl-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <label className="block text-base font-medium text-gray-900">
                  Compensation Details
                </label>
                {!canAddMore && compensations.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    All cofounders have been assigned compensation
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddCompensation}
                disabled={isReadOnly || !canAddMore}
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
                          options={(formData[FIELDS.COFOUNDERS] || [])
                            .filter(cf => cf[FIELDS.COFOUNDER_FULL_NAME])
                            .filter(cofounder => {
                              // Show this cofounder if they're not selected in any OTHER compensation entry
                              const isSelectedElsewhere = compensations.some((c, i) =>
                                i !== index && c.who === cofounder.fullName
                              );
                              return !isSelectedElsewhere;
                            })
                            .map((cofounder) => ({
                              value: cofounder[FIELDS.COFOUNDER_FULL_NAME],
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
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

        {/* Spending Limit - Custom (currency formatting) */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What's the spending limit, in USD, before a cofounder needs to check with other cofounders?
            {showValidation && !formData[FIELDS.SPENDING_LIMIT] && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <input
            type="text"
            value={formData[FIELDS.SPENDING_LIMIT] ? `$${(() => {
              const val = formData[FIELDS.SPENDING_LIMIT];
              const parts = val.split('.');
              const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              return parts.length === 2 ? `${integerPart}.${parts[1]}` : integerPart;
            })()}` : ''}
            onChange={(e) => {
              const value = e.target.value.replace('$', '').replace(/,/g, '');

              // Allow decimals for spending limit (max 2 decimal places)
              if (value === '') {
                handleChange(FIELDS.SPENDING_LIMIT, value);
              } else if (!isNaN(value) && parseFloat(value) >= 0) {
                // Check if it has more than 2 decimal places
                const decimalParts = value.split('.');
                if (decimalParts.length === 1 || (decimalParts.length === 2 && decimalParts[1].length <= 2)) {
                  handleChange(FIELDS.SPENDING_LIMIT, value);
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
            placeholder="$5000.00"
          />
        </div>
      </div>
    </div>
  );
}

export default SectionCompensation;

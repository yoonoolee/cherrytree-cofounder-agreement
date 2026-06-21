import React, { useState } from 'react';
import CustomSelect from './CustomSelect';
import QuestionRenderer from './QuestionRenderer';
import QuestionCard from './QuestionCard';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';

function getPreview(fieldName, formData) {
  const val = formData[fieldName];
  if (!val) return '';
  if (Array.isArray(val)) return val.length <= 2 ? val.join(', ') : `${val[0]} +${val.length - 1} more`;
  return String(val);
}

const FIELD_ORDER = [
  FIELDS.TAKING_COMPENSATION,
  FIELDS.SPENDING_LIMIT,
];

function SectionCompensation({ formData, handleChange, isReadOnly, showValidation, project }) {
  const compensations = formData[FIELDS.COMPENSATIONS] || [];
  const collaboratorCount = Object.keys(project?.collaborators || {}).length;
  const canAddMore = compensations.length < collaboratorCount;

  const firstUnanswered = FIELD_ORDER.find(f => !formData[f]);
  const [expandedField, setExpandedField] = useState(firstUnanswered || FIELD_ORDER[0]);
  const advanceTo = (key) => {
    const idx = FIELD_ORDER.indexOf(key);
    if (idx < FIELD_ORDER.length - 1) setExpandedField(FIELD_ORDER[idx + 1]);
  };

  const handleAddCompensation = () => {
    if (!canAddMore) return;
    handleChange(FIELDS.COMPENSATIONS, [...compensations, { who: '', amount: '' }]);
  };

  const handleRemoveCompensation = (index) => {
    handleChange(FIELDS.COMPENSATIONS, compensations.filter((_, i) => i !== index));
  };

  const handleCompensationChange = (index, field, value) => {
    const updated = [...compensations];
    updated[index] = { ...updated[index], [field]: value };
    handleChange(FIELDS.COMPENSATIONS, updated);
  };

  const spendingPreview = formData[FIELDS.SPENDING_LIMIT] ? `$${formData[FIELDS.SPENDING_LIMIT]}` : '';

  return (
    <div>
      <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '42px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.1, color: '#1a1a1a' }}>
        Compensation &amp; Expenses
      </h2>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', maxWidth: '820px', lineHeight: 1.65, marginBottom: '32px' }}>
        Money issues cause more divorce than infidelity and incompatibility. It'd be naive to think cofounderships are immune. Don't wait until someone is frustrated over uneven pay or unclear expenses. Agree on how money flows now and keep communication transparent to avoid costly fallout.
      </p>

      <div style={{ overflow: 'visible' }}>
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.TAKING_COMPENSATION].question}
          answerPreview={getPreview(FIELDS.TAKING_COMPENSATION, formData)}
          hint={QUESTION_CONFIG[FIELDS.TAKING_COMPENSATION].tooltip}
          isExpanded={expandedField === FIELDS.TAKING_COMPENSATION}
          isAnswered={!!formData[FIELDS.TAKING_COMPENSATION]}
          onExpand={() => setExpandedField(FIELDS.TAKING_COMPENSATION)}
          onAdvance={() => advanceTo(FIELDS.TAKING_COMPENSATION)}
        >
          <QuestionRenderer fieldName={FIELDS.TAKING_COMPENSATION} config={QUESTION_CONFIG[FIELDS.TAKING_COMPENSATION]} formData={formData} handleChange={handleChange} isReadOnly={isReadOnly} showValidation={showValidation} project={project} hideLabel />

          {formData[FIELDS.TAKING_COMPENSATION] === 'Yes' && (
            <div style={{ marginTop: '20px', borderLeft: '3px solid #d6d2c9', paddingLeft: '18px' }}>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-base font-medium text-gray-900">
                  Compensation Details
                  {!canAddMore && compensations.length > 0 && <span className="text-xs text-gray-500 ml-2">All cofounders assigned</span>}
                </label>
                <button type="button" onClick={handleAddCompensation} disabled={isReadOnly || !canAddMore}
                  style={{ padding: '8px 16px', background: '#4B7263', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: canAddMore ? 'pointer' : 'not-allowed', opacity: canAddMore ? 1 : 0.5 }}>
                  + Add
                </button>
              </div>
              {compensations.length === 0 ? (
                <p className="text-gray-500 text-sm">Click "Add" to add compensation entries</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {compensations.map((comp, index) => (
                    <div key={index} style={{ borderLeft: '2px solid #E9E5DF', paddingLeft: '16px', paddingTop: '8px' }}>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-700">Compensation {index + 1}</h4>
                        <button type="button" onClick={() => handleRemoveCompensation(index)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 text-sm disabled:text-gray-400">Remove</button>
                      </div>
                      <div className="space-y-3">
                        <div style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
                          <label className="block text-base font-medium text-gray-900 mb-2">
                            Full Name {showValidation && !comp.who && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                          </label>
                          <CustomSelect
                            value={comp.who || ''}
                            onChange={(value) => handleCompensationChange(index, 'who', value)}
                            options={(formData[FIELDS.COFOUNDERS] || [])
                              .filter(cf => cf[FIELDS.COFOUNDER_FULL_NAME])
                              .filter(cf => !compensations.some((c, i) => i !== index && c.who === cf.fullName))
                              .map(cf => ({ value: cf[FIELDS.COFOUNDER_FULL_NAME], label: cf.fullName }))}
                            placeholder="Select a cofounder"
                            disabled={isReadOnly}
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-2">
                            Compensation (USD/year) {showValidation && !comp.amount && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                          </label>
                          <input
                            type="text"
                            value={comp.amount ? `$${(() => { const parts = comp.amount.split('.'); const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return parts.length === 2 ? `${int}.${parts[1]}` : int; })()}` : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace('$', '').replace(/,/g, '');
                              if (value === '') { handleCompensationChange(index, 'amount', value); return; }
                              if (!isNaN(value) && parseFloat(value) >= 0) {
                                const dec = value.split('.');
                                if (dec.length === 1 || (dec.length === 2 && dec[1].length <= 2)) handleCompensationChange(index, 'amount', value);
                              }
                            }}
                            onKeyDown={(e) => { const cp = e.target.selectionStart; if ((e.key === 'ArrowLeft' || e.key === 'Home') && cp <= 1) e.preventDefault(); if (e.key === 'Backspace' && cp <= 1) e.preventDefault(); if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                            onClick={(e) => { if (e.target.selectionStart === 0) setTimeout(() => e.target.setSelectionRange(1, 1), 0); }}
                            onFocus={(e) => { const v = e.target.value.replace('$', ''); setTimeout(() => e.target.setSelectionRange(v.length + 1, v.length + 1), 0); }}
                            disabled={isReadOnly} placeholder="$100,000.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </QuestionCard>

        <QuestionCard
          question="What's the spending limit, in USD, before a cofounder needs to check with other cofounders?"
          answerPreview={spendingPreview}
          isExpanded={expandedField === FIELDS.SPENDING_LIMIT}
          isAnswered={!!formData[FIELDS.SPENDING_LIMIT]}
          onExpand={() => setExpandedField(FIELDS.SPENDING_LIMIT)}
          onAdvance={() => advanceTo(FIELDS.SPENDING_LIMIT)}
        >
          {showValidation && !formData[FIELDS.SPENDING_LIMIT] && <span className="text-red-700 text-xs">* Required</span>}
          <input
            type="text"
            value={formData[FIELDS.SPENDING_LIMIT] ? `$${(() => { const val = formData[FIELDS.SPENDING_LIMIT]; const parts = val.split('.'); const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return parts.length === 2 ? `${int}.${parts[1]}` : int; })()}` : ''}
            onChange={(e) => {
              const value = e.target.value.replace('$', '').replace(/,/g, '');
              if (value === '') { handleChange(FIELDS.SPENDING_LIMIT, value); return; }
              if (!isNaN(value) && parseFloat(value) >= 0) {
                const dec = value.split('.');
                if (dec.length === 1 || (dec.length === 2 && dec[1].length <= 2)) handleChange(FIELDS.SPENDING_LIMIT, value);
              }
            }}
            onKeyDown={(e) => { const cp = e.target.selectionStart; if ((e.key === 'ArrowLeft' || e.key === 'Home') && cp <= 1) e.preventDefault(); if (e.key === 'Backspace' && cp <= 1) e.preventDefault(); if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
            onClick={(e) => { if (e.target.selectionStart === 0) setTimeout(() => e.target.setSelectionRange(1, 1), 0); }}
            onFocus={(e) => { const v = e.target.value.replace('$', ''); setTimeout(() => e.target.setSelectionRange(v.length + 1, v.length + 1), 0); }}
            disabled={isReadOnly} placeholder="$5000.00"
          />
        </QuestionCard>
      </div>
    </div>
  );
}

export default SectionCompensation;

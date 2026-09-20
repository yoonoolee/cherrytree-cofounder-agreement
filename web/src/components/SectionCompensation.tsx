import { useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { FIELDS, type Compensation } from '@cherrytree/shared';

import CustomSelect from './CustomSelect.tsx';
import QuestionRenderer from './QuestionRenderer.tsx';
import QuestionCard from './QuestionCard.tsx';
import type { SurveySectionProps } from './sectionProps.ts';
import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { getPreview } from '../utils/getPreview.ts';

const FIELD_ORDER = [FIELDS.TAKING_COMPENSATION, FIELDS.SPENDING_LIMIT] as const;

type Field = (typeof FIELD_ORDER)[number];

const formatCurrency = (rawValue: string | undefined): string => {
  if (!rawValue) return '';
  const [whole = '', decimals] = rawValue.split('.');
  const int = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${decimals !== undefined ? `${int}.${decimals}` : int}`;
};

/** The digits the user typed, without the `$` and thousands separators the input displays. */
const rawAmount = (displayed: string): string => displayed.replace('$', '').replace(/,/g, '');

/** `''`, or a non-negative number with at most two decimals. */
const isValidAmount = (value: string): boolean => {
  if (value === '') return true;
  if (Number.isNaN(Number(value)) || parseFloat(value) < 0) return false;
  const dec = value.split('.');
  return dec.length === 1 || (dec.length === 2 && (dec[1]?.length ?? 0) <= 2);
};

// The `$` prefix is part of the input's value; these keep the caret from landing before it.
const guardCurrencyKey = (e: KeyboardEvent<HTMLInputElement>) => {
  const cp = e.currentTarget.selectionStart ?? 0;
  if ((e.key === 'ArrowLeft' || e.key === 'Home') && cp <= 1) e.preventDefault();
  if (e.key === 'Backspace' && cp <= 1) e.preventDefault();
  if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
};
const guardCurrencyClick = (e: MouseEvent<HTMLInputElement>) => {
  const input = e.currentTarget;
  if (input.selectionStart === 0) setTimeout(() => input.setSelectionRange(1, 1), 0);
};
const caretToEnd = (e: FocusEvent<HTMLInputElement>) => {
  const input = e.currentTarget;
  const v = input.value.replace('$', '');
  setTimeout(() => input.setSelectionRange(v.length + 1, v.length + 1), 0);
};

function SectionCompensation({
  formData,
  handleChange,
  isReadOnly,
  showValidation,
  project,
}: SurveySectionProps) {
  const compensations = formData[FIELDS.COMPENSATIONS] || [];
  const collaboratorCount = Object.keys(project?.collaborators || {}).length;
  const canAddMore = compensations.length < collaboratorCount;

  const firstUnanswered = FIELD_ORDER.find((f) => !formData[f]);
  const [expandedField, setExpandedField] = useState<Field | null>(
    firstUnanswered || FIELD_ORDER[0],
  );
  const advanceTo = (key: Field) => {
    const idx = FIELD_ORDER.indexOf(key);
    if (idx < FIELD_ORDER.length - 1) setExpandedField(FIELD_ORDER[idx + 1] ?? null);
  };
  const collapse = () => setExpandedField(null);

  const handleAddCompensation = () => {
    if (!canAddMore) return;
    handleChange(FIELDS.COMPENSATIONS, [...compensations, { who: '', amount: '' }]);
  };

  const handleRemoveCompensation = (index: number) => {
    handleChange(
      FIELDS.COMPENSATIONS,
      compensations.filter((_, i) => i !== index),
    );
  };

  const handleCompensationChange = <K extends keyof Compensation>(
    index: number,
    field: K,
    value: Compensation[K],
  ) => {
    const updated = [...compensations];
    updated[index] = { ...(updated[index] ?? { who: '', amount: '' }), [field]: value };
    handleChange(FIELDS.COMPENSATIONS, updated);
  };

  const spendingPreview = formatCurrency(formData[FIELDS.SPENDING_LIMIT]);

  return (
    <div>
      <h2
        style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: '42px',
          fontWeight: 400,
          letterSpacing: '-0.5px',
          marginBottom: '14px',
          lineHeight: 1.1,
          color: '#1a1a1a',
        }}
      >
        Compensation &amp; Expenses
      </h2>
      <p
        style={{
          fontSize: '14px',
          fontWeight: 200,
          color: '#555',
          lineHeight: 1.65,
          marginBottom: '32px',
        }}
      >
        Money issues cause more divorce than infidelity and incompatibility. It'd be naive to think
        cofounderships are immune. Don't wait until someone is frustrated over uneven pay or unclear
        expenses. Agree on how money flows now and keep communication transparent to avoid costly
        fallout.
      </p>

      <div style={{ overflow: 'visible' }}>
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.TAKING_COMPENSATION].question}
          answerPreview={getPreview(FIELDS.TAKING_COMPENSATION, formData)}
          subQuestion={
            formData[FIELDS.TAKING_COMPENSATION] === 'Yes' ? 'Compensation Details' : undefined
          }
          subAnswerPreview={compensations
            .map((c) => `${c.who || 'Unnamed'}: ${formatCurrency(c.amount)}`)
            .join('\n')}
          isExpanded={expandedField === FIELDS.TAKING_COMPENSATION}
          isAnswered={!!formData[FIELDS.TAKING_COMPENSATION]}
          onExpand={() => setExpandedField(FIELDS.TAKING_COMPENSATION)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.TAKING_COMPENSATION)}
        >
          <QuestionRenderer
            fieldName={FIELDS.TAKING_COMPENSATION}
            config={QUESTION_CONFIG[FIELDS.TAKING_COMPENSATION]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            project={project}
            hideLabel
          />

          {formData[FIELDS.TAKING_COMPENSATION] === 'Yes' && (
            <div className="conditional-section">
              <div className="card-row">
                <div className="card-question" style={{ fontSize: '24px', color: '#1a1a1a' }}>
                  Compensation Details
                  {!canAddMore && compensations.length > 0 && (
                    <span
                      style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '11px',
                        color: '#888',
                        marginLeft: 8,
                      }}
                    >
                      All cofounders assigned
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddCompensation}
                  disabled={isReadOnly || !canAddMore}
                  style={{
                    padding: '8px 16px',
                    background: '#4B7263',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: canAddMore ? 'pointer' : 'not-allowed',
                    opacity: canAddMore ? 1 : 0.5,
                  }}
                >
                  + Add
                </button>
              </div>
              {compensations.length === 0 ? (
                <p className="text-gray-500 text-sm" style={{ marginTop: '16px' }}>
                  Click "Add" to add compensation entries
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    marginTop: '16px',
                  }}
                >
                  {compensations.map((comp, index) => (
                    <div
                      key={index}
                      style={{
                        borderLeft: '2px solid #E9E5DF',
                        paddingLeft: '16px',
                        paddingTop: '8px',
                        position: 'relative',
                        zIndex: compensations.length - index,
                      }}
                    >
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
                        <div style={{ overflow: 'visible', position: 'relative' }}>
                          <label className="block text-base font-medium text-gray-900 mb-2">
                            Full Name{' '}
                            {showValidation && !comp.who && (
                              <span className="text-red-700 ml-0.5 validation-error">*</span>
                            )}
                          </label>
                          <CustomSelect
                            value={comp.who || ''}
                            onChange={(value) => handleCompensationChange(index, 'who', value)}
                            options={(formData[FIELDS.COFOUNDERS] || [])
                              .filter((cf) => cf[FIELDS.COFOUNDER_FULL_NAME])
                              .filter(
                                (cf) =>
                                  !compensations.some(
                                    (c, i) => i !== index && c.who === cf.fullName,
                                  ),
                              )
                              .map((cf) => ({
                                value: cf[FIELDS.COFOUNDER_FULL_NAME],
                                label: cf.fullName,
                              }))}
                            placeholder="Select a cofounder"
                            disabled={isReadOnly}
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-2">
                            Compensation (USD/year){' '}
                            {showValidation && !comp.amount && (
                              <span className="text-red-700 ml-0.5 validation-error">*</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={formatCurrency(comp.amount)}
                            onChange={(e) => {
                              const value = rawAmount(e.target.value);
                              if (isValidAmount(value))
                                handleCompensationChange(index, 'amount', value);
                            }}
                            onKeyDown={guardCurrencyKey}
                            onClick={guardCurrencyClick}
                            onFocus={caretToEnd}
                            disabled={isReadOnly}
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
        </QuestionCard>

        <QuestionCard
          question="What's the spending limit, in USD, before a cofounder needs to check with other cofounders?"
          answerPreview={spendingPreview}
          isExpanded={expandedField === FIELDS.SPENDING_LIMIT}
          isAnswered={!!formData[FIELDS.SPENDING_LIMIT]}
          onExpand={() => setExpandedField(FIELDS.SPENDING_LIMIT)}
          onCollapse={collapse}
          onAdvance={() => advanceTo(FIELDS.SPENDING_LIMIT)}
        >
          {showValidation && !formData[FIELDS.SPENDING_LIMIT] && (
            <span className="text-red-700 text-xs">* Required</span>
          )}
          <input
            type="text"
            value={formatCurrency(formData[FIELDS.SPENDING_LIMIT])}
            onChange={(e) => {
              const value = rawAmount(e.target.value);
              if (isValidAmount(value)) handleChange(FIELDS.SPENDING_LIMIT, value);
            }}
            onKeyDown={guardCurrencyKey}
            onClick={guardCurrencyClick}
            onFocus={caretToEnd}
            disabled={isReadOnly}
            placeholder="$5000.00"
          />
        </QuestionCard>
      </div>
    </div>
  );
}

export default SectionCompensation;

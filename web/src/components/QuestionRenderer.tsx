import type { AcknowledgmentMap, SurveyData, SurveyFieldName } from '@cherrytree/shared';

import CustomSelect from './CustomSelect.tsx';
import { useUser } from '../hooks/useUser.ts';
import { useCollaborators, type CollaboratorSource } from '../hooks/useCollaborators.ts';
import type { ChangeHandler } from '../hooks/useAutoSave.ts';
import type { QuestionConfig } from '../config/questionConfig.ts';

/**
 * A top-level survey question. The nested per-cofounder questions (whose `otherField` is a
 * `Cofounder` key) are rendered by SectionCofounders, never through this component.
 */
type RenderableQuestion = QuestionConfig & { otherField?: SurveyFieldName };

export interface QuestionRendererProps {
  fieldName: SurveyFieldName;
  config: RenderableQuestion | undefined;
  formData: Partial<SurveyData>;
  handleChange: ChangeHandler;
  isReadOnly: boolean;
  showValidation: boolean;
  /** Needed for acknowledgment questions (one checkbox per collaborator). */
  project?: CollaboratorSource;
  hideLabel?: boolean;
}

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');
const asList = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);
const asAckMap = (value: unknown): AcknowledgmentMap =>
  typeof value === 'object' && value !== null ? (value as AcknowledgmentMap) : {};

/**
 * QuestionRenderer - Dynamically renders any question based on config
 *
 * Supports all input types: text, textarea, number, date, radio, checkbox, dropdown, acknowledgment
 */
function QuestionRenderer({
  fieldName,
  config,
  formData,
  handleChange,
  isReadOnly,
  showValidation,
  project,
  hideLabel = false,
}: QuestionRendererProps) {
  const { currentUser } = useUser();
  const { collaboratorIds, getDisplayName, isAdmin } = useCollaborators(project);

  if (!config) return null;

  // Check if question should be displayed based on conditionalOn
  if (config.conditionalOn) {
    const { field, value: requiredValue } = config.conditionalOn;

    // If no required value specified, just check if field has any truthy value
    if (requiredValue === undefined) {
      if (!formData[field]) {
        return null;
      }
    } else {
      // Check if field matches required value
      if (formData[field] !== requiredValue) {
        return null;
      }
    }
  }

  const { question, type, required, placeholder, description, otherField, clearsFields } = config;

  // `formData[fieldName]` is the union of every field's type; the config's `type` says which
  // shape this field holds, so each branch narrows with the matching reader above.
  const value: unknown = formData[fieldName];
  const otherValue = asText(otherField ? formData[otherField] : null);
  const otherMissing = !otherValue || otherValue.trim() === '';

  // Check if field is invalid for validation display
  const isInvalid =
    showValidation &&
    required &&
    (() => {
      if (type === 'checkbox') {
        const selected = asList(value);
        if (selected.length === 0) return true;
        // Check if "Other" is selected but otherField is empty
        if (selected.includes('Other') && otherField && otherMissing) {
          return true;
        }
        return false;
      }
      if (type === 'acknowledgment') {
        // Check if all collaborators have acknowledged
        const acks = asAckMap(value);
        return !(collaboratorIds.length > 0 && collaboratorIds.every((userId) => acks[userId]));
      }
      // For fields with "Other" option
      if (value === 'Other' && otherField) {
        return otherMissing;
      }
      return !value;
    })();

  // Render label
  const renderLabel = () =>
    hideLabel ? null : (
      <label className="block text-base font-medium text-gray-900 mb-2">
        {question}
        {isInvalid && <span className="text-red-700 ml-0.5">*</span>}
      </label>
    );

  // TEXT INPUT
  if (type === 'text' || type === 'number' || type === 'date') {
    return (
      <div>
        {renderLabel()}
        <input
          type={type}
          value={asText(value)}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          disabled={isReadOnly}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
        />
        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>
    );
  }

  // TEXTAREA
  if (type === 'textarea') {
    return (
      <div>
        {renderLabel()}
        <textarea
          value={asText(value)}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          disabled={isReadOnly}
          placeholder={placeholder}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
        />
        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>
    );
  }

  // RADIO BUTTONS
  if (type === 'radio') {
    const { options } = config;
    return (
      <div>
        {renderLabel()}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {options.map((option) => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            const optionDescription = typeof option === 'object' ? option.description : null;

            return (
              <label
                key={optionValue}
                className="card-radio-option"
                style={{ alignItems: optionDescription ? 'flex-start' : 'center' }}
              >
                <input
                  type="radio"
                  name={fieldName}
                  value={optionValue}
                  checked={value === optionValue}
                  onClick={() => {
                    if (!isReadOnly) {
                      const newValue = value === optionValue ? '' : optionValue;
                      handleChange(fieldName, newValue);
                      if (otherField && newValue !== 'Other') handleChange(otherField, '');
                      if (clearsFields) {
                        if (newValue === clearsFields.value) {
                          clearsFields.fields.forEach(({ field, type }) => {
                            if (type === 'acknowledgment') {
                              const init = Object.fromEntries(
                                collaboratorIds.map((id) => [id, false]),
                              );
                              handleChange(field, init);
                            }
                          });
                        } else {
                          // Survey logic kept as-is: the cleared field is written as `null`,
                          // which its readers treat like "unset" (`|| []`).
                          clearsFields.fields.forEach(({ field }) =>
                            handleChange(field, null as unknown as SurveyData[typeof field]),
                          );
                        }
                      }
                    }
                  }}
                  onChange={() => {}}
                  disabled={isReadOnly}
                />
                <span
                  className="radio-circle"
                  style={{ marginTop: optionDescription ? '2px' : '0' }}
                />
                <div>
                  <span>{optionLabel}</span>
                  {optionDescription && (
                    <p
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 300,
                        color: '#aaa',
                        marginTop: '2px',
                      }}
                    >
                      {optionDescription}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {value === 'Other' && otherField && (
          <input
            type="text"
            value={otherValue}
            onChange={(e) => handleChange(otherField, e.target.value)}
            disabled={isReadOnly}
            placeholder="Please specify"
            style={{ marginTop: '8px' }}
          />
        )}

        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>
    );
  }

  // CHECKBOXES
  if (type === 'checkbox') {
    const { options } = config;
    const selectedValues = asList(value);

    return (
      <div>
        {renderLabel()}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {options.map((option) => (
            <label key={option} className="card-checkbox-option">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => {
                  const unsorted = e.target.checked
                    ? [...selectedValues, option]
                    : selectedValues.filter((v) => v !== option);
                  const newValues = unsorted.sort(
                    (a, b) => options.indexOf(a) - options.indexOf(b),
                  );
                  handleChange(fieldName, newValues);
                  if (otherField && option === 'Other' && !e.target.checked)
                    handleChange(otherField, '');
                }}
                disabled={isReadOnly}
              />
              <span className="checkbox-box" />
              {option}
            </label>
          ))}
        </div>

        {selectedValues.includes('Other') && otherField && (
          <input
            type="text"
            value={otherValue}
            onChange={(e) => handleChange(otherField, e.target.value)}
            disabled={isReadOnly}
            placeholder="Please specify"
            style={{ marginTop: '8px' }}
          />
        )}

        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>
    );
  }

  // DROPDOWN
  if (type === 'dropdown') {
    const { options } = config;
    return (
      <div>
        {renderLabel()}
        <CustomSelect
          value={asText(value)}
          onChange={(selectedValue) => {
            handleChange(fieldName, selectedValue);
            if (otherField && selectedValue !== 'Other') {
              handleChange(otherField, '');
            }
          }}
          options={options}
          disabled={isReadOnly}
        />

        {/* "Other" text input */}
        {value === 'Other' && otherField && (
          <input
            type="text"
            value={otherValue}
            onChange={(e) => handleChange(otherField, e.target.value)}
            disabled={isReadOnly}
            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
            placeholder="Please specify"
          />
        )}

        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>
    );
  }

  // ACKNOWLEDGMENT (checkbox for each collaborator)
  if (type === 'acknowledgment') {
    const { acknowledgmentText } = config;
    const approvals = asAckMap(value);
    const currentUserId = currentUser?.id;

    // Support dynamic acknowledgmentText as function or string. The question is
    // already shown as this card's title, so only render this paragraph when
    // acknowledgmentText adds something beyond that (e.g. a filled-in detail) -
    // otherwise it would just repeat the title verbatim.
    const displayText =
      typeof acknowledgmentText === 'function' ? acknowledgmentText(formData) : acknowledgmentText;

    return (
      <div className={config.conditionalOn ? 'conditional-section' : ''}>
        {isInvalid && <span className="text-red-700 text-xs">* Required</span>}
        {displayText && <p className="text-gray-700 mt-2 mb-2">{displayText}</p>}
        <div className="space-y-2 mt-3 pl-4">
          {collaboratorIds.map((userId) => {
            const isApproved = approvals[userId] || false;
            const isCurrentUser = userId === currentUserId;
            const displayName = getDisplayName(userId);

            return (
              <label key={userId} className="flex items-center">
                <input
                  type="checkbox"
                  checked={isApproved}
                  onChange={(e) => {
                    const newApprovals = { ...approvals, [userId]: e.target.checked };
                    handleChange(fieldName, newApprovals);
                  }}
                  disabled={isReadOnly || !isCurrentUser}
                  className="mr-3"
                />
                <span className="text-gray-700">
                  {displayName}
                  {isAdmin(userId) && <span className="ml-2 text-xs text-gray-500">(Admin)</span>}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  // CUSTOM - Skip, let section component handle
  if (type === 'custom') {
    return null;
  }

  // Unknown type
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <p className="text-sm text-yellow-800">Unknown question type: {type}</p>
    </div>
  );
}

export default QuestionRenderer;

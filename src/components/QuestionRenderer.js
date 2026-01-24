import React from 'react';
import Tooltip from './Tooltip';
import CustomSelect from './CustomSelect';
import { useUser } from '../contexts/UserContext';
import { useCollaborators } from '../hooks/useCollaborators';
import { FIELDS } from '../config/surveySchema';

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
  project
}) {
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

  const {
    question,
    type,
    required,
    options,
    placeholder,
    tooltip,
    description,
    helperText,
    otherField,
    acknowledgmentText,
    multiSelect
  } = config;

  const value = formData[fieldName];
  const otherValue = otherField ? formData[otherField] : null;

  // Check if field is invalid for validation display
  const isInvalid = showValidation && required && (() => {
    if (type === 'checkbox') {
      if (!value || value.length === 0) return true;
      // Check if "Other" is selected but otherField is empty
      if (value.includes('Other') && otherField && (!otherValue || otherValue.trim() === '')) {
        return true;
      }
      return false;
    }
    if (type === 'acknowledgment') {
      // Check if all collaborators have acknowledged
      return !(collaboratorIds.length > 0 && collaboratorIds.every(userId => value?.[userId]));
    }
    // For fields with "Other" option
    if (value === 'Other' && otherField) {
      return !otherValue || otherValue.trim() === '';
    }
    return !value;
  })();

  // Render label
  const renderLabel = () => (
    <label className="block text-base font-medium text-gray-900 mb-2">
      {question}
      {isInvalid && <span className="text-red-700 ml-0.5">*</span>}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
  );

  // TEXT INPUT
  if (type === 'text' || type === 'number' || type === 'date') {
    return (
      <div>
        {renderLabel()}
        {helperText && <p className="text-sm text-gray-500 mb-3">{helperText}</p>}
        <input
          type={type}
          value={value || ''}
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
        {helperText && <p className="text-sm text-gray-500 mb-3">{helperText}</p>}
        <textarea
          value={value || ''}
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
  if (type === 'radio' && options) {
    return (
      <div>
        {renderLabel()}
        {helperText && <p className="text-sm text-gray-500 mb-3">{helperText}</p>}
        <div className="space-y-2">
          {options.map((option) => {
            // Check if option has description (object format) or is simple string
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            const optionDescription = typeof option === 'object' ? option.description : null;

            return (
              <label key={optionValue} className="flex items-start">
                <input
                  type="radio"
                  name={fieldName}
                  value={optionValue}
                  checked={value === optionValue}
                  onClick={() => {
                    if (!isReadOnly) {
                      handleChange(fieldName, value === optionValue ? '' : optionValue);
                    }
                  }}
                  onChange={() => {}}
                  disabled={isReadOnly}
                  className={`mr-3 ${optionDescription ? 'mt-1' : ''}`}
                />
                <div>
                  <span className="text-gray-700 font-medium">{optionLabel}</span>
                  {optionDescription && <p className="text-sm text-gray-500">{optionDescription}</p>}
                </div>
              </label>
            );
          })}
        </div>

        {/* "Other" text input */}
        {value === 'Other' && otherField && (
          <input
            type="text"
            value={otherValue || ''}
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

  // CHECKBOXES
  if (type === 'checkbox' && options) {
    const selectedValues = value || [];

    return (
      <div>
        {renderLabel()}
        {helperText && <p className="text-sm text-gray-500 mb-3">{helperText}</p>}
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => {
                  const newValues = e.target.checked
                    ? [...selectedValues, option]
                    : selectedValues.filter(v => v !== option);
                  handleChange(fieldName, newValues);
                }}
                disabled={isReadOnly}
                className="mr-3"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>

        {/* "Other" text input */}
        {selectedValues.includes('Other') && otherField && (
          <input
            type="text"
            value={otherValue || ''}
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

  // DROPDOWN
  if (type === 'dropdown' && options) {
    return (
      <div>
        {renderLabel()}
        {helperText && <p className="text-sm text-gray-500 mb-3">{helperText}</p>}
        <CustomSelect
          value={value || ''}
          onChange={(selectedValue) => handleChange(fieldName, selectedValue)}
          options={options}
          disabled={isReadOnly}
        />

        {/* "Other" text input */}
        {value === 'Other' && otherField && (
          <input
            type="text"
            value={otherValue || ''}
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
    const approvals = value || {};
    const currentUserId = currentUser?.id;

    // Support dynamic acknowledgmentText as function or string
    const displayText = typeof acknowledgmentText === 'function'
      ? acknowledgmentText(formData)
      : acknowledgmentText;

    return (
      <div className="conditional-section">
        <p className="text-gray-700 mb-4">
          {displayText}
          {isInvalid && <span className="text-red-700 ml-0.5">*</span>}
        </p>
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

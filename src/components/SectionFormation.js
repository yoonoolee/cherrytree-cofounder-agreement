import React, { useState, useEffect, useRef } from 'react';
import { US_STATES } from '../config/surveySchema';
import CustomSelect from './CustomSelect';
import QuestionRenderer from './QuestionRenderer';
import QuestionCard from './QuestionCard';
import { QUESTION_CONFIG } from '../config/questionConfig';
import { FIELDS } from '../config/surveySchema';

// Constants
const ADDRESS_SEARCH_MIN_LENGTH = 3; // Minimum characters before triggering address autocomplete

// Returns a short display string for a field's current value
function getPreview(fieldName, formData) {
  const val = formData[fieldName];
  if (!val) return '';
  if (Array.isArray(val)) {
    if (val.length === 0) return '';
    return val.length <= 2 ? val.join(', ') : `${val[0]} +${val.length - 1} more`;
  }
  return String(val);
}

const FIELD_ORDER = [
  FIELDS.COMPANY_NAME,
  FIELDS.ENTITY_TYPE,
  FIELDS.REGISTERED_STATE,
  'mailing_address', // custom card key
  FIELDS.COMPANY_DESCRIPTION,
  FIELDS.INDUSTRIES,
];

function SectionFormation({ formData, handleChange, isReadOnly, showValidation }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const autocompleteSuggestion = useRef(null);
  const isInitialMount = useRef(true);

  // Start on first unanswered field
  const firstUnanswered = FIELD_ORDER.find(f => {
    if (f === 'mailing_address') return !formData[FIELDS.MAILING_STREET];
    return !formData[f];
  });
  const [expandedField, setExpandedField] = useState(firstUnanswered || FIELD_ORDER[0]);

  const advanceTo = (currentKey) => {
    const idx = FIELD_ORDER.indexOf(currentKey);
    if (idx < FIELD_ORDER.length - 1) setExpandedField(FIELD_ORDER[idx + 1]);
  };

  useEffect(() => {
    // Only sync formData to inputValue on initial mount
    if (isInitialMount.current && formData[FIELDS.MAILING_STREET]) {
      setInputValue(formData[FIELDS.MAILING_STREET]);
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData[FIELDS.MAILING_STREET]]);

  useEffect(() => {
    const initAutocomplete = async () => {
      if (!isReadOnly && window.google?.maps?.places) {
        try {
          const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places");
          autocompleteSuggestion.current = AutocompleteSuggestion;
        } catch (error) {
          console.error('Error loading AutocompleteSuggestion:', error);
        }
      }
    };
    initAutocomplete();
  }, [isReadOnly]);

  const handleInputChange = async (value) => {
    setInputValue(value);

    if (!value || value.length < ADDRESS_SEARCH_MIN_LENGTH) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(0);
      return;
    }

    if (!autocompleteSuggestion.current) return;

    try {
      const request = {
        input: value,
        includedRegionCodes: ['us'],
      };

      const { suggestions: fetchedSuggestions } = await autocompleteSuggestion.current.fetchAutocompleteSuggestions(request);

      if (fetchedSuggestions && fetchedSuggestions.length > 0) {
        setSuggestions(fetchedSuggestions);
        setShowSuggestions(true);
        setHighlightedIndex(0);
      } else {
        setSuggestions([]);
        setHighlightedIndex(0);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setHighlightedIndex(0);
    }
  };

  const handleAddressKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[highlightedIndex]) {
        const placeId = suggestions[highlightedIndex].placePrediction.placeId;
        handleSelectAddress(placeId);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(0);
    }
  };

  const handleStreetBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
    // Sync inputValue to formData on blur (handles manual input)
    if (inputValue !== formData[FIELDS.MAILING_STREET]) {
      handleChange(FIELDS.MAILING_STREET, inputValue);
    }
  };

  const handleSelectAddress = async (placeId) => {
    try {
      const { Place } = await window.google.maps.importLibrary("places");
      const place = new Place({ id: placeId });

      await place.fetchFields({
        fields: ['addressComponents']
      });

      const addressComponents = place.addressComponents;
      if (!addressComponents) {
        console.warn('No address components found');
        return;
      }

      let street = '';
      let street2 = '';
      let city = '';
      let state = '';
      let zip = '';

      addressComponents.forEach(component => {
        const types = component.types;

        if (types.includes('street_number')) {
          street = component.longText + ' ';
        }
        if (types.includes('route')) {
          street += component.longText;
        }
        if (types.includes('subpremise')) {
          street2 = component.longText;
        }
        if (types.includes('locality')) {
          city = component.longText;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.shortText;
        }
        if (types.includes('postal_code')) {
          zip = component.longText;
        }
      });

      // Convert state abbreviation to full name
      const stateFullName = US_STATES.find(s => s.value === state)?.label || state;

      // Update all address fields
      setInputValue(street.trim());
      handleChange(FIELDS.MAILING_STREET, street.trim());
      if (street2) handleChange(FIELDS.MAILING_STREET2, street2);
      handleChange(FIELDS.MAILING_CITY, city);
      handleChange(FIELDS.MAILING_STATE, stateFullName);
      handleChange(FIELDS.MAILING_ZIP, zip);

      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(0);
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };


  const addressPreview = formData[FIELDS.MAILING_STREET]
    ? [formData[FIELDS.MAILING_STREET], formData[FIELDS.MAILING_CITY]].filter(Boolean).join(', ')
    : '';
  const addressAnswered = !!(formData[FIELDS.MAILING_STREET] && formData[FIELDS.MAILING_CITY] && formData[FIELDS.MAILING_STATE] && formData[FIELDS.MAILING_ZIP]);

  return (
    <div>
      <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '42px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.1, color: '#1a1a1a' }}>
        Formation &amp; Purpose
      </h2>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', maxWidth: '820px', lineHeight: 1.65, marginBottom: '32px' }}>
        You've been talking about this idea for weeks, maybe months. Now you're sitting with your cofounder, naming the company, buying the domain, imagining what it could become. Coffee in hand, takeout on the table. Creating a cofounder agreement is what makes it real. Let's get started.
      </p>

      <div style={{ overflow: 'visible' }}>

        {/* Company Name */}
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.COMPANY_NAME].question}
          answerPreview={getPreview(FIELDS.COMPANY_NAME, formData)}
          hint={QUESTION_CONFIG[FIELDS.COMPANY_NAME].tooltip}
          isExpanded={expandedField === FIELDS.COMPANY_NAME}
          isAnswered={!!formData[FIELDS.COMPANY_NAME]}
          onExpand={() => setExpandedField(FIELDS.COMPANY_NAME)}
          onAdvance={() => advanceTo(FIELDS.COMPANY_NAME)}
        >
          <QuestionRenderer
            fieldName={FIELDS.COMPANY_NAME}
            config={QUESTION_CONFIG[FIELDS.COMPANY_NAME]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            hideLabel
          />
        </QuestionCard>

        {/* Entity Type */}
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.ENTITY_TYPE].question}
          answerPreview={getPreview(FIELDS.ENTITY_TYPE, formData)}
          hint={QUESTION_CONFIG[FIELDS.ENTITY_TYPE].tooltip}
          isExpanded={expandedField === FIELDS.ENTITY_TYPE}
          isAnswered={!!formData[FIELDS.ENTITY_TYPE]}
          onExpand={() => setExpandedField(FIELDS.ENTITY_TYPE)}
          onAdvance={() => advanceTo(FIELDS.ENTITY_TYPE)}
        >
          <QuestionRenderer
            fieldName={FIELDS.ENTITY_TYPE}
            config={QUESTION_CONFIG[FIELDS.ENTITY_TYPE]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            hideLabel
          />
        </QuestionCard>

        {/* Registered State */}
        <div style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
          <QuestionCard
            question={QUESTION_CONFIG[FIELDS.REGISTERED_STATE].question}
            answerPreview={getPreview(FIELDS.REGISTERED_STATE, formData)}
            hint={QUESTION_CONFIG[FIELDS.REGISTERED_STATE].tooltip}
            isExpanded={expandedField === FIELDS.REGISTERED_STATE}
            isAnswered={!!formData[FIELDS.REGISTERED_STATE]}
            onExpand={() => setExpandedField(FIELDS.REGISTERED_STATE)}
            onAdvance={() => advanceTo(FIELDS.REGISTERED_STATE)}
          >
            <QuestionRenderer
              fieldName={FIELDS.REGISTERED_STATE}
              config={QUESTION_CONFIG[FIELDS.REGISTERED_STATE]}
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              showValidation={showValidation}
              hideLabel
            />
          </QuestionCard>
        </div>

        {/* Mailing Address */}
        <QuestionCard
          question="What's your company mailing address?"
          answerPreview={addressPreview}
          isExpanded={expandedField === 'mailing_address'}
          isAnswered={addressAnswered}
          onExpand={() => setExpandedField('mailing_address')}
          onAdvance={() => advanceTo('mailing_address')}
        >
          {showValidation && (!formData[FIELDS.MAILING_STREET] || !formData[FIELDS.MAILING_CITY] || !formData[FIELDS.MAILING_STATE] || !formData[FIELDS.MAILING_ZIP]) && (
            <span className="text-red-700 text-xs">* Required</span>
          )}
          <div className="space-y-3" style={{ marginTop: '14px' }}>
            <div className="relative">
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '4px' }}>Street Address</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const newValue = e.target.value;
                    handleInputChange(newValue);
                    if (!newValue) handleChange(FIELDS.MAILING_STREET, '');
                  }
                }}
                onKeyDown={handleAddressKeyDown}
                disabled={isReadOnly}
                autoComplete="chrome-off"
                onFocus={() => !isReadOnly && inputValue.length >= ADDRESS_SEARCH_MIN_LENGTH && setShowSuggestions(true)}
                onBlur={handleStreetBlur}
                placeholder="Start typing address..."
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => {
                    const placePrediction = suggestion.placePrediction;
                    return (
                      <div
                        key={index}
                        className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${index === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        onMouseDown={() => handleSelectAddress(placePrediction.placeId)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className="text-sm text-gray-900">{placePrediction.structuredFormat?.mainText?.text || placePrediction.text?.text}</div>
                        <div className="text-xs text-gray-500">{placePrediction.structuredFormat?.secondaryText?.text}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '4px' }}>
                Address Line 2 <span style={{ fontWeight: 300, color: '#bbb', textTransform: 'none' }}>(Optional)</span>
              </label>
              <input type="text" value={formData[FIELDS.MAILING_STREET2] || ''} onChange={(e) => handleChange(FIELDS.MAILING_STREET2, e.target.value)} disabled={isReadOnly} autoComplete="chrome-off" placeholder="Apt, Suite, Floor, etc." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '4px' }}>City</label>
                <input type="text" value={formData[FIELDS.MAILING_CITY] || ''} onChange={(e) => handleChange(FIELDS.MAILING_CITY, e.target.value)} disabled={isReadOnly} autoComplete="chrome-off" placeholder="San Francisco" />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '4px' }}>State</label>
                <CustomSelect
                  value={formData[FIELDS.MAILING_STATE] || ''}
                  onChange={(value) => handleChange(FIELDS.MAILING_STATE, value)}
                  options={US_STATES.map(state => ({ value: state.label, label: `${state.label} (${state.value})` }))}
                  placeholder="Select state"
                  disabled={isReadOnly}
                  displayValue={formData[FIELDS.MAILING_STATE] ? US_STATES.find(s => s.label === formData[FIELDS.MAILING_STATE])?.value : ''}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '4px' }}>ZIP Code</label>
                <input
                  type="text"
                  value={formData[FIELDS.MAILING_ZIP] || ''}
                  onChange={(e) => handleChange(FIELDS.MAILING_ZIP, e.target.value.replace(/[^\d-]/g, ''))}
                  disabled={isReadOnly}
                  autoComplete="chrome-off"
                  placeholder="94102"
                  maxLength="10"
                />
              </div>
            </div>
          </div>
        </QuestionCard>

        {/* Company Description */}
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.COMPANY_DESCRIPTION].question}
          answerPreview={getPreview(FIELDS.COMPANY_DESCRIPTION, formData)}
          hint={QUESTION_CONFIG[FIELDS.COMPANY_DESCRIPTION].tooltip}
          isExpanded={expandedField === FIELDS.COMPANY_DESCRIPTION}
          isAnswered={!!formData[FIELDS.COMPANY_DESCRIPTION]}
          onExpand={() => setExpandedField(FIELDS.COMPANY_DESCRIPTION)}
          onAdvance={() => advanceTo(FIELDS.COMPANY_DESCRIPTION)}
        >
          <QuestionRenderer
            fieldName={FIELDS.COMPANY_DESCRIPTION}
            config={QUESTION_CONFIG[FIELDS.COMPANY_DESCRIPTION]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            hideLabel
          />
        </QuestionCard>

        {/* Industry */}
        <QuestionCard
          question={QUESTION_CONFIG[FIELDS.INDUSTRIES].question}
          answerPreview={getPreview(FIELDS.INDUSTRIES, formData)}
          hint={QUESTION_CONFIG[FIELDS.INDUSTRIES].tooltip}
          isExpanded={expandedField === FIELDS.INDUSTRIES}
          isAnswered={!!(formData[FIELDS.INDUSTRIES]?.length)}
          onExpand={() => setExpandedField(FIELDS.INDUSTRIES)}
          onAdvance={() => advanceTo(FIELDS.INDUSTRIES)}
        >
          <QuestionRenderer
            fieldName={FIELDS.INDUSTRIES}
            config={QUESTION_CONFIG[FIELDS.INDUSTRIES]}
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            showValidation={showValidation}
            hideLabel
          />
        </QuestionCard>

      </div>
    </div>
  );
}

export default SectionFormation;

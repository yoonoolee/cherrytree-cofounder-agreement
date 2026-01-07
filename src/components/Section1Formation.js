import React, { useState, useEffect, useRef } from 'react';
import { US_STATES, INDUSTRIES } from './surveyConstants';
import CustomSelect from './CustomSelect';
import Tooltip from './Tooltip';

// Constants
const ADDRESS_SEARCH_MIN_LENGTH = 3; // Minimum characters before triggering address autocomplete

function Section1Formation({ formData, handleChange, isReadOnly, showValidation }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const autocompleteSuggestion = useRef(null);
  const isInitialMount = useRef(true);
  const registeredStateInputRef = useRef(null);
  const mailingStateInputRef = useRef(null);
  const isDeleting = useRef(false);

  const findStateMatch = (input) => {
    if (!input) return '';
    const match = US_STATES.find(state =>
      state.label.toLowerCase().startsWith(input.toLowerCase())
    );
    return match ? match.label : '';
  };

  const handleStateKeyDown = (e, inputRef) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      isDeleting.current = true;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleRegisteredStateChange = (e) => {
    const value = e.target.value;

    if (isDeleting.current) {
      isDeleting.current = false;
      handleChange('registeredState', value);
      return;
    }

    if (value) {
      const matchesAnyState = US_STATES.some(state =>
        state.label.toLowerCase().startsWith(value.toLowerCase())
      );

      if (!matchesAnyState) {
        return;
      }

      const match = findStateMatch(value);
      if (match && match.toLowerCase().startsWith(value.toLowerCase())) {
        handleChange('registeredState', match);
        setTimeout(() => {
          if (registeredStateInputRef.current) {
            registeredStateInputRef.current.setSelectionRange(value.length, match.length);
          }
        }, 0);
      } else {
        handleChange('registeredState', value);
      }
    } else {
      handleChange('registeredState', value);
    }
  };

  const handleRegisteredStateBlur = () => {
    const value = formData.registeredState;
    if (value) {
      const isExactMatch = US_STATES.some(state =>
        state.label.toLowerCase() === value.toLowerCase()
      );
      if (!isExactMatch) {
        const match = findStateMatch(value);
        if (match) {
          handleChange('registeredState', match);
        } else {
          handleChange('registeredState', '');
        }
      }
    }
  };

  const handleMailingStateChange = (e) => {
    const value = e.target.value;

    if (isDeleting.current) {
      isDeleting.current = false;
      handleChange('mailingState', value);
      return;
    }

    if (value) {
      const matchesAnyState = US_STATES.some(state =>
        state.label.toLowerCase().startsWith(value.toLowerCase())
      );

      if (!matchesAnyState) {
        return;
      }

      const match = findStateMatch(value);
      if (match && match.toLowerCase().startsWith(value.toLowerCase())) {
        handleChange('mailingState', match);
        setTimeout(() => {
          if (mailingStateInputRef.current) {
            mailingStateInputRef.current.setSelectionRange(value.length, match.length);
          }
        }, 0);
      } else {
        handleChange('mailingState', value);
      }
    } else {
      handleChange('mailingState', value);
    }
  };

  const handleMailingStateBlur = () => {
    const value = formData.mailingState;
    if (value) {
      const isExactMatch = US_STATES.some(state =>
        state.label.toLowerCase() === value.toLowerCase()
      );
      if (!isExactMatch) {
        const match = findStateMatch(value);
        if (match) {
          handleChange('mailingState', match);
        } else {
          handleChange('mailingState', '');
        }
      }
    }
  };

  useEffect(() => {
    // Only sync formData to inputValue on initial mount
    if (isInitialMount.current && formData.mailingStreet) {
      setInputValue(formData.mailingStreet);
      isInitialMount.current = false;
    }
  }, [formData.mailingStreet]);

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
      handleChange('mailingStreet', street.trim());
      if (street2) handleChange('mailingStreet2', street2);
      handleChange('mailingCity', city);
      handleChange('mailingState', stateFullName);
      handleChange('mailingZip', zip);

      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(0);
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };


  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Formation & Purpose</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        You've been talking about this idea for weeks, maybe months. Now you're sitting with your cofounder, naming the company, buying the domain, imagining what it could become. Coffee in hand, takeout on the table. Creating a cofounder agreement is what makes it real. Let's get started.
      </p>


      <div className="space-y-12" style={{ overflow: 'visible' }}>
        {/* Company Name */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What's your company's name?
            {showValidation && !formData.companyName && <span className="text-red-700 ml-0.5">*</span>}
            <Tooltip text="Make sure it's good, your company might go big one day." />
          </label>
          <input
            type="text"
            value={formData.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
            placeholder="Enter your company name"
          />
        </div>

        {/* Entity Type */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What is your company's current or intended legal structure?
            {showValidation && !formData.entityType && <span className="text-red-700 ml-0.5">*</span>}
            <Tooltip text="This defines how your company is structured for ownership, taxes, and decision-making. If you plan to raise venture capital, a C-Corp is usually preferred." />
          </label>
          <div className="space-y-2">
            {['C-Corp', 'S-Corp', 'LLC', 'Other'].map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="entityType"
                  value={type}
                  checked={formData.entityType === type}
                  onClick={() => {
                    if (!isReadOnly) {
                      handleChange('entityType', formData.entityType === type ? '' : type);
                    }
                  }}
                  onChange={() => {}}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{type}</span>
              </label>
            ))}
          </div>

          {formData.entityType === 'Other' && (
            <input
              type="text"
              value={formData.entityTypeOther || ''}
              onChange={(e) => handleChange('entityTypeOther', e.target.value)}
              disabled={isReadOnly}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
              placeholder="Please specify entity type"
            />
          )}
        </div>

        {/* Registered State */}
        <div style={{ overflow: 'visible', position: 'relative', zIndex: 100, marginBottom: '3rem' }}>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What state will your company be registered in?
            {showValidation && !formData.registeredState && <span className="text-red-700 ml-0.5">*</span>}
            <Tooltip text="Delaware is a popular choice for many startups because its laws and courts are well established. Just be aware you may have additional fees or filings if your business is based elsewhere." />
          </label>
          <CustomSelect
            value={formData.registeredState || ''}
            onChange={(value) => handleChange('registeredState', value)}
            options={US_STATES.map(state => ({
              value: state.label,
              label: `${state.label} (${state.value})`
            }))}
            placeholder="Select state"
            disabled={isReadOnly}
          />
        </div>

        {/* Mailing Address */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-3">
            What's your company mailing address?
            {showValidation && (!formData.mailingStreet || !formData.mailingCity || !formData.mailingState || !formData.mailingZip) && <span className="text-red-700 ml-0.5">*</span>}
          </label>

          <div className="space-y-3">
            {/* Street Address */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  if (!isReadOnly) {
                    const newValue = e.target.value;
                    handleInputChange(newValue);
                    // If user clears the input, also clear the formData
                    if (!newValue) {
                      handleChange('mailingStreet', '');
                    }
                  }
                }}
                onKeyDown={handleAddressKeyDown}
                disabled={isReadOnly}
                autoComplete="chrome-off"
                onFocus={() => !isReadOnly && inputValue.length >= ADDRESS_SEARCH_MIN_LENGTH && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
                placeholder="Start typing address..."
              />

              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => {
                    const placePrediction = suggestion.placePrediction;
                    return (
                      <div
                        key={index}
                        className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          index === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                        onMouseDown={() => handleSelectAddress(placePrediction.placeId)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className="text-sm text-gray-900">
                          {placePrediction.structuredFormat?.mainText?.text || placePrediction.text?.text}
                        </div>
                        <div className="text-xs text-gray-500">
                          {placePrediction.structuredFormat?.secondaryText?.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={formData.mailingStreet2 || ''}
                onChange={(e) => handleChange('mailingStreet2', e.target.value)}
                disabled={isReadOnly}
                autoComplete="chrome-off"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
                placeholder="Apt, Suite, Floor, etc."
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.mailingCity || ''}
                  onChange={(e) => handleChange('mailingCity', e.target.value)}
                  disabled={isReadOnly}
                  autoComplete="chrome-off"
                  className="w-full bg-transparent border-none border-b-2 border-gray-300 py-3 text-gray-700 focus:outline-none focus:border-black disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="San Francisco"
                  style={{
                    paddingLeft: 0,
                    borderBottom: '2px solid #D1D5DB',
                  }}
                />
              </div>

              <div className="col-span-1 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  State
                </label>
                <CustomSelect
                  value={formData.mailingState || ''}
                  onChange={(value) => handleChange('mailingState', value)}
                  options={US_STATES.map(state => ({
                    value: state.label,
                    label: `${state.label} (${state.value})`
                  }))}
                  placeholder="Select state"
                  disabled={isReadOnly}
                  displayValue={formData.mailingState ? US_STATES.find(s => s.label === formData.mailingState)?.value : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.mailingZip || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d-]/g, '');
                    handleChange('mailingZip', value);
                  }}
                  disabled={isReadOnly}
                  autoComplete="chrome-off"
                  className="w-full bg-transparent border-none border-b-2 border-gray-300 py-3 text-gray-700 focus:outline-none focus:border-black disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="94102"
                  maxLength="10"
                  style={{
                    paddingLeft: 0,
                    borderBottom: '2px solid #D1D5DB',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Description */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Can you describe your company in 1 line?
            {showValidation && !formData.companyDescription && <span className="text-red-700 ml-0.5">*</span>}
            <Tooltip text="Describe what you do in plain language. No buzzwords needed." />
          </label>
          <input
            type="text"
            value={formData.companyDescription || ''}
            onChange={(e) => handleChange('companyDescription', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
            placeholder="Helping cofounders create Cofounder Agreements"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            What industry is it in?
            {showValidation && (!formData.industries || formData.industries.length === 0) && <span className="text-red-700 ml-0.5">*</span>}
            <Tooltip text="Pick the industry that best describes what you currently do. Aspirations to conquer all markets can wait." />
          </label>
          <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
          <div className="space-y-2">
            {INDUSTRIES.map((industry) => (
              <label key={industry} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(formData.industries || []).includes(industry)}
                  onChange={(e) => {
                    const currentIndustries = formData.industries || [];
                    const newIndustries = e.target.checked
                      ? [...currentIndustries, industry]
                      : currentIndustries.filter(i => i !== industry);
                    handleChange('industries', newIndustries);
                  }}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{industry}</span>
              </label>
            ))}
          </div>

          {(formData.industries || []).includes('Other') && (
            <div className="conditional-section">
              <input
                type="text"
                value={formData.industryOther || ''}
                onChange={(e) => handleChange('industryOther', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
                placeholder="Please specify other industry"
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Section1Formation;

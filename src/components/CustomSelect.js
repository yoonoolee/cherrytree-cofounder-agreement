import React, { useState, useRef, useEffect } from 'react';

function CustomSelect({ value, onChange, options, placeholder, disabled, className, useBoxStyle, displayValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => prev > 0 ? prev - 1 : prev);
    }
  };

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset highlighted index when search term changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className || ''}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (displayValue !== undefined ? displayValue : (selectedOption?.label || ''))}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="chrome-off"
          className={useBoxStyle
            ? "w-full text-left px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
            : "w-full text-left bg-transparent border-none border-b-2 border-gray-300 text-gray-700 focus:outline-none focus:border-black disabled:opacity-60 pr-6"
          }
          style={useBoxStyle ? {} : {
            paddingLeft: 0,
            paddingTop: '12px',
            paddingBottom: '6px',
            borderBottom: '2px solid #D1D5DB',
          }}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Clear selection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto" style={{ maxHeight: '120px', zIndex: 9999 }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-4 py-2 cursor-pointer text-gray-700 border-b border-gray-100 last:border-b-0 ${
                  index === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;

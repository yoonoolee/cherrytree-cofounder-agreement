import React, { useState, useRef, useEffect } from 'react';

function CustomSelect({ value, onChange, options, placeholder = 'Select...', disabled, className, displayValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) searchRef.current.focus();
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = displayValue !== undefined ? displayValue : (selectedOption?.label || '');

  const filteredOptions = searchTerm
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const showSearch = options.length > 8;

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }} className={className || ''}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${isOpen ? '#555' : '#bbb'}`,
          outline: 'none',
          fontSize: '14px',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 300,
          color: displayLabel ? '#555' : '#bbb',
          padding: '6px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.2s',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>{displayLabel || placeholder}</span>
        <svg
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '12px',
            height: '12px',
            flexShrink: 0,
            color: isOpen ? '#555' : '#bbb',
            transition: 'transform 0.2s ease, color 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          width: '100%',
          top: 'calc(100% + 6px)',
          left: 0,
          background: '#FDFCF9',
          borderRadius: '8px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 9999,
        }}>
          {showSearch && (
            <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #f0ede8', position: 'sticky', top: 0, background: '#FDFCF9' }}>
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 300,
                  color: '#555',
                  background: 'transparent',
                }}
              />
            </div>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: opt.value === value ? 400 : 300,
                  color: opt.value === value ? '#4B7263' : '#444',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F1EEE9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div style={{ padding: '9px 16px', fontSize: '13px', color: '#999', fontWeight: 300, fontFamily: "'Outfit', sans-serif" }}>
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;

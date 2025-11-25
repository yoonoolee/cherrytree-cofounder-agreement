import React, { useState, useRef, useEffect } from 'react';

function Tooltip({ text, placement }) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState(placement || 'right');
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // If placement is forced, don't auto-calculate
    if (placement) {
      setPosition(placement);
      return;
    }

    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Check if tooltip would overflow on the right
      if (tooltipRect.right > viewportWidth - 20) {
        setPosition('left');
      } else {
        setPosition('right');
      }
    }
  }, [isVisible, placement]);

  return (
    <div ref={containerRef} className="relative inline-block ml-2" style={{ verticalAlign: '0.15em' }}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-400 text-gray-500 cursor-default hover:border-gray-600 hover:text-gray-700 transition-colors italic"
        style={{ fontSize: '9px', lineHeight: '1', fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        i
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-max max-w-xs px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 ${
            position === 'right' ? 'left-6' : 'right-6'
          }`}
        >
          {text}
          <div className={`absolute top-3 w-2 h-2 bg-gray-900 transform rotate-45 ${
            position === 'right' ? '-left-1' : '-right-1'
          }`}></div>
        </div>
      )}
    </div>
  );
}

export default Tooltip;

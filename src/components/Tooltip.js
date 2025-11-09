import React, { useState } from 'react';

function Tooltip({ text }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-2" style={{ verticalAlign: '0.15em' }}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-gray-500 cursor-default hover:border-gray-600 hover:text-gray-700 transition-colors italic"
        style={{ fontSize: '10px', lineHeight: '1', fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        i
      </div>

      {isVisible && (
        <div className="absolute z-50 w-max max-w-xs px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6">
          {text}
          <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}

export default Tooltip;

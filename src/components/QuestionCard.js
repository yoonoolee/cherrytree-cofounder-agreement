import React, { useEffect, useRef } from 'react';

/**
 * QuestionCard - expanding card wrapper for survey questions.
 * Collapsed: shows question text + answer preview.
 * Expanded: shows children (the input).
 *
 * Props:
 *   question      {string}   - Question label text
 *   answerPreview {string}   - Short preview of current answer (shown when collapsed)
 *   hint          {string}   - Optional hint shown below question when expanded
 *   isExpanded    {boolean}
 *   isAnswered    {boolean}
 *   onExpand      {function} - Called when card is clicked to expand
 *   onAdvance     {function} - Called when Enter is pressed to move to next card
 *   children      {node}     - The actual input element(s)
 */
function QuestionCard({ question, answerPreview, hint, isExpanded, isAnswered, onExpand, onAdvance, children }) {
  const cardRef = useRef(null);

  // Scroll into view when expanded
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  }, [isExpanded]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isExpanded && onAdvance) {
      // Don't advance on Enter inside textarea
      if (e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      onAdvance();
    }
  };

  return (
    <div
      ref={cardRef}
      className={`question-card${isExpanded ? ' expanded' : ''}${isAnswered ? ' answered' : ''}`}
      onClick={() => { if (!isExpanded && onExpand) onExpand(); }}
      onKeyDown={handleKeyDown}
    >
      <div className="card-row">
        <div className="card-question">{question}</div>
        <span className="card-answer-preview">{answerPreview}</span>
      </div>

      <div className="card-bottom">
        <div className="card-bottom-inner">
          {hint && <div className="card-hint">{hint}</div>}
          <div style={{ marginTop: hint ? 0 : '14px' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionCard;

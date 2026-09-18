import React, { useEffect, useRef } from 'react';
import Tooltip from './Tooltip';
import Standard from './Standard';

/**
 * QuestionCard - expanding card wrapper for survey questions.
 * Collapsed: shows question text + answer preview, plus a sub-question row if given.
 * Expanded: shows Tooltip (optional), then Standard (optional), then children (the input).
 * Clicking the header row toggles: expands when collapsed, collapses when expanded.
 *
 * Props:
 *   question        {string}   - Question label text
 *   answerPreview   {string}   - Short preview of current answer (shown when collapsed)
 *   tooltip         {string}   - Optional explanatory text, shown first when expanded
 *   standard        {string}   - Optional "the standard is..." text, shown after tooltip
 *   isExpanded      {boolean}
 *   isAnswered      {boolean}
 *   onExpand        {function} - Called when the header is clicked while collapsed
 *   onCollapse      {function} - Called when the header is clicked while expanded
 *   onAdvance       {function} - Called when Enter is pressed to move to next card
 *   alwaysExpanded  {boolean}  - For a nested conditional question with no collapse state of
 *                                its own: permanently expanded (same large-serif format as a
 *                                main question). Header click does nothing in this mode.
 *   flat            {boolean}  - Strips the card background/padding/hover chrome, for a nested
 *                                conditional question that should sit flush below its parent
 *                                question instead of looking like its own box.
 *   subQuestion       {string} - A conditional follow-up question's title. Only ever shown when
 *                                THIS card is collapsed (never while expanded) - matches the
 *                                main question/answerPreview row, right below it.
 *   subAnswerPreview  {string} - The follow-up question's answer preview.
 *   children        {node}     - The actual input element(s)
 */
function QuestionCard({ question, answerPreview, tooltip, standard, isExpanded, isAnswered, onExpand, onCollapse, onAdvance, alwaysExpanded = false, flat = false, subQuestion, subAnswerPreview, children }) {
  const cardRef = useRef(null);
  const hasHint = !!(tooltip || standard);
  const expanded = alwaysExpanded || isExpanded;

  // Scroll into view when expanded
  useEffect(() => {
    if (expanded && cardRef.current) {
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  }, [expanded]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && expanded && onAdvance) {
      // Don't advance on Enter inside textarea
      if (e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      onAdvance();
    }
  };

  const handleHeaderClick = () => {
    if (alwaysExpanded) return;
    if (expanded) {
      if (onCollapse) onCollapse();
    } else if (onExpand) {
      onExpand();
    }
  };

  return (
    <div
      ref={cardRef}
      className={`question-card${expanded ? ' expanded' : ''}${isAnswered ? ' answered' : ''}${alwaysExpanded ? ' static' : ''}${flat ? ' flat' : ''}`}
      onKeyDown={handleKeyDown}
    >
      <div className="card-row" onClick={handleHeaderClick} style={alwaysExpanded ? undefined : { cursor: 'pointer' }}>
        <div className="card-question">{question}</div>
        <span className="card-answer-preview">{answerPreview}</span>
      </div>

      {subQuestion && (
        <div className="card-row sub-question-row">
          <div className="card-question">{subQuestion}</div>
          <span className="card-answer-preview">{subAnswerPreview}</span>
        </div>
      )}

      <div className="card-bottom">
        <div className="card-bottom-inner">
          <Tooltip text={tooltip} />
          <Standard text={standard} />
          <div style={{ marginTop: hasHint ? 0 : '14px' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionCard;

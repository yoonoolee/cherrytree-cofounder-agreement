import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

import Tooltip from './Tooltip.tsx';
import Standard from './Standard.tsx';

interface QuestionCardProps {
  /** Question label text */
  question: string;
  /** Short preview of the current answer (shown when collapsed) */
  answerPreview?: string;
  /** Optional explanatory text, shown first when expanded */
  tooltip?: string;
  /** Optional "the standard is..." text, shown after the tooltip */
  standard?: string;
  isExpanded?: boolean;
  isAnswered?: boolean;
  /** Called when the header is clicked while collapsed */
  onExpand?: () => void;
  /** Called when the header is clicked while expanded */
  onCollapse?: () => void;
  /** Called when Enter is pressed to move to the next card */
  onAdvance?: () => void;
  /**
   * For a nested conditional question with no collapse state of its own: permanently expanded
   * (same large-serif format as a main question). Header click does nothing in this mode.
   */
  alwaysExpanded?: boolean;
  /**
   * Strips the card background/padding/hover chrome, for a nested conditional question that
   * should sit flush below its parent question instead of looking like its own box.
   */
  flat?: boolean;
  /**
   * A conditional follow-up question's title. Only ever shown when THIS card is collapsed
   * (never while expanded) - matches the main question/answerPreview row, right below it.
   */
  subQuestion?: string;
  /** The follow-up question's answer preview. */
  subAnswerPreview?: string;
  /** The actual input element(s) */
  children?: ReactNode;
}

/**
 * QuestionCard - expanding card wrapper for survey questions.
 * Collapsed: shows question text + answer preview, plus a sub-question row if given.
 * Expanded: shows Tooltip (optional), then Standard (optional), then children (the input).
 * Clicking the header row toggles: expands when collapsed, collapses when expanded.
 */
function QuestionCard({
  question,
  answerPreview,
  tooltip,
  standard,
  isExpanded,
  isAnswered,
  onExpand,
  onCollapse,
  onAdvance,
  alwaysExpanded = false,
  flat = false,
  subQuestion,
  subAnswerPreview,
  children,
}: QuestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasHint = !!(tooltip || standard);
  const expanded = alwaysExpanded || isExpanded;

  // Scroll into view when expanded
  useEffect(() => {
    if (expanded && cardRef.current) {
      setTimeout(
        () => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
        50,
      );
    }
  }, [expanded]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && expanded && onAdvance) {
      // Don't advance on Enter inside textarea
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
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
      <div
        className="card-row"
        onClick={handleHeaderClick}
        style={alwaysExpanded ? undefined : { cursor: 'pointer' }}
      >
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
          <div style={{ marginTop: hasHint ? 0 : '14px' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default QuestionCard;

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ADVISOR_REPLY_MAX_LENGTH } from '@cherrytree/shared';

import SourceLinks from './SourceLinks.tsx';
import { ADVISOR_COPY, advisorErrorMessage } from '../../constants/advisor.ts';
import type { Btw } from '../../hooks/useAdvisorBtw.ts';

interface BtwPopupProps {
  btw: Btw;
  top: number;
  left: number;
  /** Another turn or btw is running, so this one can't be asked yet. */
  busy: boolean;
  onAsk: (question: string) => void;
  onClose: () => void;
}

/**
 * The btw popup on selected text: one question, then its answer, which stays until the popup
 * closes. Clicking outside or Escape closes it.
 */
function BtwPopup({ btw, top, left, busy, onAsk, onClose }: BtwPopupProps) {
  const [question, setQuestion] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const canAsk = question.trim().length > 0 && !busy;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!popupRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canAsk) onAsk(question.trim());
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canAsk) onAsk(question.trim());
    }
  };

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-label="Ask about the selected text"
      className="absolute z-20 flex w-[min(340px,100%)] flex-col rounded-[10px] bg-white px-4 pt-8 pb-3.5 shadow-[0_16px_40px_rgb(22_24_28/16%)]"
      style={{ top, left: `min(${left}px, calc(100% - min(340px, 100%)))` }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-2 right-3 text-lg text-ink-muted"
      >
        ×
      </button>
      <p className="mb-2.5 rounded-md bg-paper px-3 py-2.5 text-sm leading-snug">“{btw.quote}”</p>
      {btw.question ? (
        <div aria-live="polite" className="text-sm leading-normal">
          <p className="mb-1.5 text-ink">{btw.question}</p>
          <p className="whitespace-pre-line text-ink-muted">
            {btw.answer || ADVISOR_COPY.thinking}
          </p>
          <SourceLinks sources={btw.sources} />
        </div>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="advisor-btw" className="sr-only">
            Your question
          </label>
          <textarea
            id="advisor-btw"
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={ADVISOR_REPLY_MAX_LENGTH}
            placeholder={ADVISOR_COPY.btwPlaceholder}
            autoFocus
            className="mb-3 min-h-18 w-full resize-y rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none"
          />
          {btw.error && (
            <p role="alert" className="mb-2 text-sm text-danger">
              {advisorErrorMessage(btw.error.code, btw.error.retryAfterSeconds)}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canAsk}
              className="rounded-full bg-ink px-3.5 py-2 text-sm text-paper disabled:opacity-30"
            >
              Ask
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default BtwPopup;

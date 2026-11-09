import { useRef, type MouseEvent, type ReactNode } from 'react';
import type { AdvisorMessage, AdvisorState, Highlight } from '@cherrytree/shared';

import MarkedText, { NumberTag } from './MarkedText.tsx';
import { ADVISOR_COPY } from '../../constants/advisor.ts';
import {
  marksFor,
  questionText,
  type AdvisorScreen,
  type NumberedHighlight,
} from '../../utils/advisorScreen.ts';

export interface SelectedText {
  quote: string;
  /** Where the popup opens, relative to the thread. */
  top: number;
  left: number;
}

interface Exchange {
  index: number;
  reply: string;
  greenHighlights: readonly Highlight[];
  /** The follow-up this reply answers, asked by the turn before it. */
  answers: AdvisorMessage | null;
}

interface ScreenThreadProps {
  screen: AdvisorScreen;
  state: AdvisorState;
  /** The reply being sent from this screen, with what has streamed of it. */
  live: Omit<Exchange, 'answers'> | null;
  numbered: readonly NumberedHighlight[];
  numberOf: (followupId: string) => number | undefined;
  onSelect: (selection: SelectedText) => void;
  /** The btw popup, positioned inside the thread. */
  children?: ReactNode;
}

const ADVISOR_TEXT = 'text-[22px] leading-[1.1] tracking-[-0.015em] sm:text-[26px]';

/** What the Advisor said and asked before the reply below it, moved up from the bottom box. */
function AnsweredQuestion({
  message,
  text,
  number,
}: {
  message: AdvisorMessage;
  text: string | null;
  number: number | undefined;
}) {
  return (
    <div className="mt-7 mb-3">
      {message.answer && (
        <p className={`mb-3 whitespace-pre-line ${ADVISOR_TEXT}`}>{message.answer}</p>
      )}
      {text && (
        <p className={ADVISOR_TEXT}>
          {number !== undefined && <NumberTag number={number} large />}
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * A main question's screen after the first reply: the question small at the top, then every reply
 * with its highlights, each later reply under the follow-up it answers. Selecting text in a reply
 * opens the btw popup.
 */
function ScreenThread({
  screen,
  state,
  live,
  numbered,
  numberOf,
  onSelect,
  children,
}: ScreenThreadProps) {
  const threadRef = useRef<HTMLDivElement>(null);

  const exchanges: Exchange[] = screen.turns.map((turn, i) => ({
    index: turn.index,
    reply: turn.reply,
    greenHighlights: turn.greenHighlights,
    answers: i > 0 ? (screen.turns[i - 1]?.message ?? null) : null,
  }));
  if (live) exchanges.push({ ...live, answers: screen.turns.at(-1)?.message ?? null });

  const onMouseUp = () => {
    const selection = window.getSelection();
    const thread = threadRef.current;
    if (!selection || selection.rangeCount === 0 || !thread) return;
    const range = selection.getRangeAt(0);
    // The quote is the reply's own text, without the number tags inside its highlights.
    const selected = range.cloneContents();
    selected.querySelectorAll('[data-number-tag]').forEach((tag) => tag.remove());
    const quote = (selected.textContent ?? '').replace(/\s+/g, ' ').trim();
    const reply = (node: Node | null) =>
      (node instanceof Element ? node : node?.parentElement)?.closest('[data-reply]');
    const inReply = reply(range.startContainer);
    if (!quote || !inReply || inReply !== reply(range.endContainer)) return;
    const rect = range.getBoundingClientRect();
    const bounds = thread.getBoundingClientRect();
    onSelect({ quote, top: rect.bottom - bounds.top + 10, left: rect.left - bounds.left });
  };

  // The hint follows the pointer; CSS shows it only while the pointer is over a reply.
  const hintRef = useRef<HTMLSpanElement>(null);
  const onMouseMove = (event: MouseEvent) => {
    const hint = hintRef.current;
    const thread = threadRef.current;
    if (!hint || !thread) return;
    const bounds = thread.getBoundingClientRect();
    hint.style.transform = `translate(${event.clientX - bounds.left + 20}px, ${event.clientY - bounds.top + 28}px)`;
  };

  return (
    <div ref={threadRef} className="group relative pb-8">
      <h1
        className="mb-2 text-[26px] leading-[1.1] font-normal tracking-[-0.015em] sm:text-[32px]"
        style={{ viewTransitionName: 'advisor-question' }}
      >
        {screen.question.text}
      </h1>
      <div onMouseUp={onMouseUp} onMouseMove={onMouseMove} className="mt-12">
        {exchanges.map((exchange, i) => {
          const asked = exchange.answers?.questionId ?? null;
          const number = asked ? numberOf(asked) : undefined;
          return (
            <section key={exchange.index}>
              {exchange.answers && (
                <AnsweredQuestion
                  message={exchange.answers}
                  text={asked ? questionText(state, asked) : null}
                  number={number}
                />
              )}
              <p
                data-reply
                className="text-[19px] leading-[1.65] whitespace-pre-line"
                style={i === 0 ? { viewTransitionName: 'advisor-reply' } : undefined}
              >
                <MarkedText
                  text={exchange.reply}
                  marks={marksFor(exchange.index, exchange.greenHighlights, numbered)}
                />
              </p>
            </section>
          );
        })}
      </div>
      {children ?? (
        <span
          ref={hintRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 rounded-md bg-[#f8f7f4] px-2.5 py-1 text-[13px] whitespace-nowrap text-ink-faint opacity-0 shadow-[0_1px_4px_rgb(45_42_34/8%)] transition-opacity duration-200 group-has-[[data-reply]:hover]:opacity-100"
        >
          {ADVISOR_COPY.selectHint}
        </span>
      )}
    </div>
  );
}

export default ScreenThread;

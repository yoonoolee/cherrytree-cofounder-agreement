import { useRef, type MouseEvent, type ReactNode } from 'react';
import type { AdvisorMessage, AdvisorState, Highlight } from '@cherrytree/shared';

import AdvisorText from './AdvisorText.tsx';
import MarkedText, { NumberTag } from './MarkedText.tsx';
import { ADVISOR_COPY } from '../../constants/advisor.ts';
import {
  findFollowup,
  marksFor,
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
  /** Its highlights are sweeping in. */
  sweep: boolean;
}

interface ScreenThreadProps {
  screen: AdvisorScreen;
  state: AdvisorState;
  /** The reply being sent from this screen, until it is saved. */
  live: { index: number; reply: string } | null;
  /** The turn whose highlights are sweeping in, with the green ones shown so far. */
  sweeping: { index: number; greenHighlights: readonly Highlight[] } | null;
  numbered: readonly NumberedHighlight[];
  numberOf: (followupId: string) => number | undefined;
  onSelect: (selection: SelectedText) => void;
  /** The btw popup, positioned inside the thread. */
  children?: ReactNode;
}

const ADVISOR_TEXT = 'text-[1.375rem] leading-[1.1] tracking-[-0.006em] sm:text-[1.625rem]';

/** Every block in the thread (question, answers, follow-ups, replies) is this far apart. */
const GAP = 'flex flex-col gap-6';

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
    <>
      {message.answer && <AdvisorText text={message.answer} className={ADVISOR_TEXT} />}
      {text && (
        <div className={`flex items-start ${ADVISOR_TEXT}`}>
          {number !== undefined && <NumberTag number={number} large />}
          <AdvisorText text={text} />
        </div>
      )}
    </>
  );
}

/**
 * A screen after the first reply: the question small at the top, then every reply
 * with its highlights, each later reply under the follow-up it answers. Selecting text in a reply
 * opens the btw popup.
 */
function ScreenThread({
  screen,
  state,
  live,
  sweeping,
  numbered,
  numberOf,
  onSelect,
  children,
}: ScreenThreadProps) {
  const threadRef = useRef<HTMLDivElement>(null);

  // The turn sweeping in shows only the green highlights let through so far.
  const exchangeOf = (index: number, text: string, greenHighlights: readonly Highlight[]) => {
    const sweep = index === sweeping?.index;
    return {
      index,
      reply: text,
      sweep,
      greenHighlights: sweep ? sweeping.greenHighlights : greenHighlights,
    };
  };
  const exchanges: Exchange[] = screen.turns.map((turn, i) => ({
    ...exchangeOf(turn.index, turn.reply, turn.greenHighlights),
    answers: i > 0 ? (screen.turns[i - 1]?.message ?? null) : null,
  }));
  if (live) {
    exchanges.push({
      ...exchangeOf(live.index, live.reply, []),
      answers: screen.turns.at(-1)?.message ?? null,
    });
  }

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
    <div ref={threadRef} className={`group relative pb-8 ${GAP}`}>
      <AdvisorText
        text={screen.question}
        heading="h1"
        className="text-[1.5rem] leading-[1.1] tracking-[-0.006em] sm:text-[1.875rem]"
        style={{ viewTransitionName: 'advisor-question' }}
      />
      <div onMouseUp={onMouseUp} onMouseMove={onMouseMove} className={GAP}>
        {exchanges.map((exchange, i) => {
          const asked = exchange.answers?.followupId ?? null;
          const number = asked ? numberOf(asked) : undefined;
          return (
            <section key={exchange.index} className={GAP}>
              {exchange.answers && (
                <AnsweredQuestion
                  message={exchange.answers}
                  text={asked ? (findFollowup(state, asked)?.text ?? null) : null}
                  number={number}
                />
              )}
              <p
                data-reply
                className="text-[1.1875rem] leading-[1.65] whitespace-pre-line"
                style={i === 0 ? { viewTransitionName: 'advisor-reply' } : undefined}
              >
                <MarkedText
                  text={exchange.reply}
                  marks={marksFor(
                    exchange.index,
                    exchange.greenHighlights,
                    numbered,
                    exchange.sweep,
                  )}
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
          className="pointer-events-none absolute top-0 left-0 rounded-md bg-[#f8f7f4] px-2.5 py-1 text-[0.8125rem] whitespace-nowrap text-ink-faint opacity-0 shadow-[0_1px_4px_rgb(45_42_34/8%)] transition-opacity duration-200 group-has-[[data-reply]:hover]:opacity-100"
        >
          {ADVISOR_COPY.selectHint}
        </span>
      )}
    </div>
  );
}

export default ScreenThread;

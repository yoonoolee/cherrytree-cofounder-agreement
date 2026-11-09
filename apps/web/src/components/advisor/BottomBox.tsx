import type { FormEvent, ReactNode } from 'react';
import { ADVISOR_REPLY_MAX_LENGTH, type AdvisorMessage } from '@cherrytree/shared';

import { NumberTag } from './MarkedText.tsx';
import SourceLinks from './SourceLinks.tsx';
import { ADVISOR_COPY, ADVISOR_LEGEND, ADVISOR_MOVE_ON } from '../../constants/advisor.ts';

/**
 * - `thinking`: the Advisor is writing; its answer shows as it streams.
 * - `followup`: the follow-up to answer, under the Advisor's answer, with the reply input.
 * - `moving`: the main question is covered; Next opens the next one's screen.
 */
export type BottomBoxContent =
  | { kind: 'thinking'; answer: string }
  | {
      kind: 'followup';
      message: AdvisorMessage;
      question: string | null;
      number: number | undefined;
      value: string;
      onChange: (value: string) => void;
      onSubmit: () => void;
    }
  | { kind: 'moving'; message: AdvisorMessage; onNext: () => void };

function Legend() {
  return (
    <div className="mb-4 flex items-center gap-5 text-xs text-ink-muted">
      <span className="flex items-center gap-1.75">
        <span className="inline-block h-1.25 w-3.5 rounded-[2px] bg-kept" /> {ADVISOR_LEGEND.kept}
      </span>
      <span className="flex items-center gap-1.75">
        <span className="inline-block h-1.25 w-3.5 rounded-[2px] bg-needs" /> {ADVISOR_LEGEND.needs}
      </span>
    </div>
  );
}

function Answer({ text }: { text: string | null }) {
  return text ? <p className="mb-2 whitespace-pre-line">{text}</p> : null;
}

/** Collapsed under the question: the web pages the answer used. */
function Sources({ message }: { message: AdvisorMessage }) {
  if (message.sources.length === 0) return null;
  return (
    <details className="mt-2 text-sm text-ink-muted">
      <summary className="cursor-pointer list-none select-none">› Sources</summary>
      <SourceLinks sources={message.sources} />
    </details>
  );
}

function FollowupForm(content: Extract<BottomBoxContent, { kind: 'followup' }>) {
  const canSend = content.value.trim().length > 0;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSend) content.onSubmit();
  };
  return (
    <form onSubmit={submit}>
      <div className="mb-4 text-[22px] leading-[1.35]" aria-live="polite">
        <Answer text={content.message.answer} />
        {content.question && (
          <h2 className="font-normal">
            {content.number !== undefined && <NumberTag number={content.number} large />}
            {content.question}
          </h2>
        )}
        <Sources message={content.message} />
      </div>
      <div className="flex items-center gap-4 border-b border-line pb-2.5 transition-colors focus-within:border-ink">
        <label htmlFor="advisor-followup-reply" className="sr-only">
          Your answer
        </label>
        <input
          id="advisor-followup-reply"
          type="text"
          value={content.value}
          onChange={(event) => content.onChange(event.target.value)}
          maxLength={ADVISOR_REPLY_MAX_LENGTH}
          placeholder={ADVISOR_COPY.followupPlaceholder}
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-lg leading-normal outline-none placeholder:font-light placeholder:text-ink-faint"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className="flex size-7.5 shrink-0 items-center justify-center rounded-md bg-ink text-[15px] text-paper transition-opacity disabled:opacity-25"
        >
          ↑
        </button>
      </div>
    </form>
  );
}

/** The panel pinned at the bottom of a screen: what the Advisor says or asks next. */
function BottomBox({ content, children }: { content: BottomBoxContent; children?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-paper px-5 py-5.5 shadow-[0_12px_40px_rgb(45_42_34/12%)] sm:px-7">
      <Legend />
      {content.kind === 'thinking' && (
        <div className="text-[22px] leading-[1.35]" aria-live="polite" aria-busy>
          {content.answer ? (
            <p className="whitespace-pre-line">{content.answer}</p>
          ) : (
            <p className="text-base text-ink-muted">{ADVISOR_COPY.thinking}</p>
          )}
        </div>
      )}
      {content.kind === 'followup' && <FollowupForm {...content} />}
      {content.kind === 'moving' && (
        <div className="flex flex-col gap-4 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 text-[22px] leading-[1.3]" aria-live="polite">
            <Answer text={content.message.answer} />
            <SourceLinks sources={content.message.sources} />
            <p>{ADVISOR_MOVE_ON.text}</p>
          </div>
          <button
            type="button"
            onClick={content.onNext}
            className="shrink-0 self-start rounded-lg bg-accent px-6 py-2.5 sm:self-auto text-[13.5px] font-medium text-paper transition hover:-translate-y-px hover:opacity-90"
          >
            {content.message.type === 'next_section'
              ? ADVISOR_MOVE_ON.next_section
              : ADVISOR_MOVE_ON.next_question}
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

export default BottomBox;

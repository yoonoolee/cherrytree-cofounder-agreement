import type { FormEvent, ReactNode } from 'react';
import { ADVISOR_REPLY_MAX_LENGTH, type AdvisorMessage } from '@cherrytree/shared';

import AdvisorText from './AdvisorText.tsx';
import { NumberTag } from './MarkedText.tsx';
import SourceLinks from './SourceLinks.tsx';
import Working from '../status/Working.tsx';
import { ADVISOR_COPY, ADVISOR_MOVE_ON } from '../../constants/advisor.ts';
import { submitOnEnter } from '../../utils/submitOnEnter.ts';

/**
 * - `thinking`: the Advisor is working: `status` until its answer starts, then the answer as it
 *   streams.
 * - `followup`: the follow-up to answer, under the Advisor's answer, with the reply input.
 * - `moving`: the screen is covered; Next opens the next one.
 */
export type BottomBoxContent =
  | { kind: 'thinking'; answer: string; status: string }
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

function Answer({ text }: { text: string | null }) {
  return text ? <AdvisorText text={text} className="mb-2" /> : null;
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
      <div className="mb-4 text-[1.375rem] leading-[1.35]" aria-live="polite">
        <Answer text={content.message.answer} />
        {content.question && (
          <div className="flex animate-rise items-start [animation-delay:60ms]">
            {content.number !== undefined && <NumberTag number={content.number} large />}
            <AdvisorText text={content.question} heading="h2" />
          </div>
        )}
        <Sources message={content.message} />
      </div>
      <div className="flex animate-rise items-end gap-4 border-b border-line pb-2.5 transition-colors [animation-delay:120ms] focus-within:border-ink">
        <label htmlFor="advisor-followup-reply" className="sr-only">
          Your answer
        </label>
        <textarea
          id="advisor-followup-reply"
          rows={1}
          value={content.value}
          onChange={(event) => content.onChange(event.target.value)}
          onKeyDown={submitOnEnter}
          maxLength={ADVISOR_REPLY_MAX_LENGTH}
          placeholder={ADVISOR_COPY.followupPlaceholder}
          autoFocus
          autoComplete="off"
          className="field-sizing-content max-h-60 min-w-0 flex-1 resize-none border-0 bg-transparent p-0 text-lg leading-normal outline-none placeholder:text-ink-faint"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className="flex size-7.5 shrink-0 items-center justify-center rounded-md bg-ink text-[0.9375rem] text-paper transition-opacity disabled:opacity-25"
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
    <div className="animate-rise rounded-2xl bg-paper px-5 py-5.5 shadow-[0_12px_40px_rgb(45_42_34/12%)] sm:px-7">
      {content.kind === 'thinking' && (
        <div className="text-[1.375rem] leading-[1.35]" aria-live="polite" aria-busy>
          {content.answer ? (
            <AdvisorText text={content.answer} className="animate-fade" />
          ) : (
            <Working status={content.status} />
          )}
        </div>
      )}
      {content.kind === 'followup' && <FollowupForm {...content} />}
      {content.kind === 'moving' && (
        <div className="flex flex-col gap-4 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 text-[1.375rem] leading-[1.3]" aria-live="polite">
            <Answer text={content.message.answer} />
            <SourceLinks sources={content.message.sources} />
            <p className="animate-rise [animation-delay:60ms]">{ADVISOR_MOVE_ON.text}</p>
          </div>
          <button
            type="button"
            onClick={content.onNext}
            className="shrink-0 animate-rise self-start rounded-lg bg-ink px-6 py-2.5 text-[0.84375rem] text-white transition hover:-translate-y-px hover:opacity-90 [animation-delay:160ms] sm:self-auto"
          >
            {ADVISOR_MOVE_ON.button}
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

export default BottomBox;

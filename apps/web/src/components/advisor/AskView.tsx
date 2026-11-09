import type { FormEvent, KeyboardEvent } from 'react';
import { ADVISOR_REPLY_MAX_LENGTH } from '@cherrytree/shared';

import { ADVISOR_COPY } from '../../constants/advisor.ts';

interface AskViewProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/** A new main question's blank screen: the question centered, and the first reply under it. */
function AskView({ question, value, onChange, onSubmit }: AskViewProps) {
  const canSend = value.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSend) onSubmit();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-[55vh] flex-1 flex-col justify-center">
      <h1
        className="mb-9 text-4xl leading-[1.1] font-normal tracking-[-0.015em] sm:text-[64px]"
        style={{ viewTransitionName: 'advisor-question' }}
      >
        {question}
      </h1>
      <label htmlFor="advisor-reply" className="sr-only">
        Your answer
      </label>
      <textarea
        id="advisor-reply"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        maxLength={ADVISOR_REPLY_MAX_LENGTH}
        placeholder={ADVISOR_COPY.replyPlaceholder}
        autoFocus
        className="field-sizing-content min-h-9.5 w-full resize-none border-b border-line bg-transparent pb-4 text-[19px] leading-[1.65] transition-colors outline-none placeholder:font-light placeholder:text-ink-faint focus:border-ink"
        style={{ viewTransitionName: 'advisor-reply' }}
      />
      <div className="mt-5 flex items-center justify-between">
        <p className="flex items-center gap-2 text-[12.5px] text-ink-muted">
          <kbd className="rounded bg-[#eceae3] px-2 py-0.75 font-ui text-[11px] font-medium text-[#555]">
            Enter
          </kbd>{' '}
          to send
        </p>
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-[10px] bg-ink px-6 py-2.5 text-sm font-medium text-paper shadow-[0_2px_8px_rgb(0_0_0/8%)] transition-opacity disabled:invisible"
        >
          Send
        </button>
      </div>
    </form>
  );
}

export default AskView;

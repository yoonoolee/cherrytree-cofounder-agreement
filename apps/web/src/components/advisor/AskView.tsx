import type { FormEvent, KeyboardEvent } from 'react';
import { ADVISOR_REPLY_MAX_LENGTH } from '@cherrytree/shared';

import { ADVISOR_COPY } from '../../constants/advisor.ts';

interface AskViewProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/** A new screen before its first reply: the question centered, and the reply box under it. */
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
        className="mb-9 animate-rise text-[2.125rem] leading-[1.1] tracking-[-0.006em] sm:text-[3.875rem]"
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
        className="field-sizing-content min-h-9.5 w-full animate-rise resize-none border-b border-line bg-transparent pb-4 text-[1.1875rem] leading-[1.65] transition-colors outline-none [animation-delay:90ms] placeholder:text-ink-faint focus:border-ink"
        style={{ viewTransitionName: 'advisor-reply' }}
      />
      <div className="mt-5 flex animate-rise justify-end [animation-delay:150ms]">
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-[10px] bg-ink px-6 py-2.5 text-sm text-paper shadow-[0_2px_8px_rgb(0_0_0/8%)] transition-opacity disabled:invisible"
        >
          Send
        </button>
      </div>
    </form>
  );
}

export default AskView;

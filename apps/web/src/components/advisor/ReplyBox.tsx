import type { FormEvent, KeyboardEvent } from 'react';
import { ADVISOR_REPLY_MAX_LENGTH } from '@cherrytree/shared';

interface ReplyBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * The user's reply to the current question. Enter adds a line; Cmd/Ctrl+Enter sends. It is not
 * rendered while a turn runs, so a reply cannot be sent twice.
 */
function ReplyBox({ value, onChange, onSubmit }: ReplyBoxProps) {
  const canSend = value.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSend) onSubmit();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSend) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form onSubmit={submit} className="mt-10">
      <label htmlFor="advisor-reply" className="sr-only">
        Your answer
      </label>
      <textarea
        id="advisor-reply"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        maxLength={ADVISOR_REPLY_MAX_LENGTH}
        placeholder="Type your answer…"
        className="field-sizing-content min-h-24 resize-none font-serif text-2xl leading-relaxed text-ink placeholder:font-serif sm:text-3xl"
      />
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-full bg-ink px-6 py-2.5 text-sm text-paper transition-opacity disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </form>
  );
}

export default ReplyBox;

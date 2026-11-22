import { useState, type FormEvent } from 'react';
import type { Thread, ThreadMessage } from '@cherrytree/shared';

import Working from '../status/Working.tsx';
import { EDITOR_COPY } from '../../constants/editor.ts';

const time = (message: ThreadMessage) =>
  message.createdAt.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const DIVIDED = 'mt-3.5 border-t border-[#e1e4ea] pt-3.5';

function Message({ message, first }: { message: ThreadMessage; first: boolean }) {
  const agent = message.author === 'agent';
  return (
    <div className={first ? 'pr-[18px]' : `animate-fade ${DIVIDED}`}>
      <div className="flex items-center gap-2.5">
        {agent ? (
          <span className="flex size-7 flex-none items-center justify-center rounded-full bg-white">
            <img src="/images/cherries.png" alt="" className="size-[22px] object-contain" />
          </span>
        ) : (
          <span className="flex size-7 flex-none items-center justify-center rounded-full bg-sheet-edge text-[0.75rem]">
            Y
          </span>
        )}
        <span className="flex min-w-0 flex-col gap-px leading-[1.2]">
          <span className="text-[0.8125rem]">
            {agent ? EDITOR_COPY.comments.agent : EDITOR_COPY.comments.you}
          </span>
          <span className="text-[0.75rem] text-ink-faint">{time(message)}</span>
        </span>
      </div>
      <p className="mt-2 text-[0.875rem] leading-[1.45] whitespace-pre-line">{message.text}</p>
    </div>
  );
}

interface ThreadCardProps {
  id: string;
  thread: Thread;
  /** Where the card sits in the margin; null until it is placed beside its text. */
  top: number | null;
  active: boolean;
  onFocus: () => void;
  onApprove: (suggestion: string) => void;
  onDismiss: () => void;
  onReply: (text: string) => Promise<void>;
}

/** One comment thread in the margin, beside the text it is about. */
function ThreadCard({
  id,
  thread,
  top,
  active,
  onFocus,
  onApprove,
  onDismiss,
  onReply,
}: ThreadCardProps) {
  const [reply, setReply] = useState('');
  const last = thread.messages.at(-1);
  const waiting = last?.author === 'user';
  const suggestion = last?.author === 'agent' ? last.suggestion : null;

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = reply.trim();
    if (!text || waiting) return;
    setReply('');
    void onReply(text);
  };

  return (
    <article
      data-thread={id}
      onClick={onFocus}
      style={top === null ? { visibility: 'hidden' } : { top }}
      className={`absolute right-0 left-0 animate-rise rounded-2xl bg-thread px-4 pt-3.5 pb-3 transition-[top,box-shadow,transform] duration-300 ease-soft ${
        active
          ? '-translate-x-1.5 shadow-[0_12px_32px_rgb(45_42_34/14%)]'
          : 'shadow-[0_8px_24px_rgb(45_42_34/8%)]'
      }`}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDismiss();
        }}
        aria-label={EDITOR_COPY.comments.dismiss}
        title={EDITOR_COPY.comments.dismiss}
        className="absolute top-2 right-2 flex size-[22px] items-center justify-center rounded-md text-base leading-none text-ink-faint hover:bg-[#e4e7ee] hover:text-ink"
      >
        ×
      </button>
      {thread.messages.map((message, i) => (
        <Message key={i} message={message} first={i === 0} />
      ))}
      {waiting && (
        <div className={DIVIDED}>
          <Working status={EDITOR_COPY.comments.replying} className="text-[0.8125rem]" />
        </div>
      )}
      {suggestion && (
        <div className="animate-rise">
          <p className="mt-2 rounded-lg bg-white px-2.5 py-2 text-[0.84375rem] leading-[1.45]">
            {suggestion}
          </p>
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onApprove(suggestion);
              }}
              className="rounded-full bg-ink px-3 py-1.5 text-[0.78125rem] text-paper transition-opacity hover:opacity-85"
            >
              {EDITOR_COPY.comments.approve}
            </button>
          </div>
        </div>
      )}
      {active && (
        <form onSubmit={send} className={`animate-fade ${DIVIDED}`}>
          <label htmlFor={`reply-${id}`} className="sr-only">
            Reply
          </label>
          <input
            id={`reply-${id}`}
            type="text"
            autoComplete="off"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder={EDITOR_COPY.comments.reply}
            className="w-full border-0 bg-transparent p-0 text-[0.875rem] outline-none placeholder:text-ink-faint"
          />
        </form>
      )}
    </article>
  );
}

export default ThreadCard;

import { useEffect, useRef, useState } from 'react';

import { EDITOR_COPY } from '../../constants/editor.ts';

interface SelectionPopoverProps {
  quote: string;
  /** The selection's box on screen. */
  rect: DOMRect;
  onComment: (text: string) => void;
  onApply: (text: string) => void;
  onClose: () => void;
}

const WIDTH = 340;

/** Under selected text in Comments mode: comment on it, or type a rewrite and apply it. */
function SelectionPopover({ quote, rect, onComment, onApply, onClose }: SelectionPopoverProps) {
  const [text, setText] = useState('');
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const value = text.trim();

  useEffect(() => fieldRef.current?.focus(), []);

  const left = Math.min(Math.max(12, rect.left), window.innerWidth - WIDTH - 12);
  return (
    <div
      role="dialog"
      aria-label="Comment or rewrite"
      style={{ top: rect.bottom + 10, left, width: WIDTH }}
      onMouseDown={(event) => {
        if (!(event.target instanceof HTMLTextAreaElement)) event.preventDefault();
      }}
      className="fixed z-40 animate-rise rounded-2xl bg-white px-4 pt-8 pb-3.5 shadow-[0_16px_40px_rgb(45_42_34/16%)]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-2 right-2.5 px-1.5 py-0.5 text-base text-ink-faint hover:text-ink"
      >
        ×
      </button>
      <p className="mb-2.5 line-clamp-3 rounded-[10px] bg-mark px-3 py-2.5 text-[0.875rem] leading-[1.45]">
        {quote}
      </p>
      <textarea
        ref={fieldRef}
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
        placeholder={EDITOR_COPY.comments.placeholder}
        className="mb-3 block min-h-[72px] w-full resize-y rounded-xl border border-[#d8d3ca] bg-white px-3 py-2.5 text-[0.875rem] leading-[1.45] outline-none placeholder:text-ink-faint focus:border-ink"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={!value}
          onClick={() => onComment(value)}
          className="rounded-full border border-[#d4cfc6] bg-white px-3.5 py-2 text-[0.8125rem] transition-opacity disabled:opacity-40"
        >
          {EDITOR_COPY.comments.comment}
        </button>
        <button
          type="button"
          disabled={!value}
          onClick={() => onApply(value)}
          className="rounded-full bg-ink px-3.5 py-2 text-[0.8125rem] text-paper transition-opacity disabled:opacity-30"
        >
          {EDITOR_COPY.comments.apply}
        </button>
      </div>
    </div>
  );
}

export default SelectionPopover;

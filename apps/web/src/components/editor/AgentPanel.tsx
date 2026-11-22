import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { AgentEdit } from '@cherrytree/shared';

import Working from '../status/Working.tsx';
import { EDITOR_COPY } from '../../constants/editor.ts';
import type { WithId } from '../../hooks/useDraftEditor.ts';
import { wordDiff } from '../../utils/wordDiff.ts';

/** A rewrite the agent is still working on, or that failed. */
export interface PendingEdit {
  key: string;
  quote: string;
  instruction: string;
  failed: boolean;
}

const ICON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
} as const;

function QuoteIcon() {
  return (
    <svg {...ICON} className="size-3.5 flex-none">
      <path d="M17 6H3M21 12H8M21 18H8M3 12v6" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg {...ICON} className="size-4">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

/** What was asked: the selected text, then the instruction. */
function Ask({ quote, instruction }: { quote: string; instruction: string }) {
  return (
    <div className="flex flex-col items-end gap-1.5 text-[13px] leading-[1.35]">
      <p className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-wash px-2.5 py-1.5 text-ink-muted">
        <QuoteIcon />
        <span className="truncate">{quote}</span>
      </p>
      <p className="max-w-full rounded-[14px] rounded-br-md bg-ink px-2.5 py-1.5 text-paper">
        {instruction}
      </p>
    </div>
  );
}

function Diff({ before, after }: { before: string; after: string }) {
  return (
    <p className="text-[13.5px] leading-[1.5]">
      {wordDiff(before, after).map((part, i) =>
        part.kind === 'same' ? (
          <span key={i}>{part.text}</span>
        ) : part.kind === 'removed' ? (
          <del key={i} className="decoration-kept-ink decoration-[1.5px]">
            {part.text}
          </del>
        ) : (
          <ins key={i} className="mx-px rounded-[2px] bg-mark px-0.5 no-underline">
            {part.text}
          </ins>
        ),
      )}
    </p>
  );
}

function EditEntry({ edit, onUndo }: { edit: WithId<AgentEdit>; onUndo: () => boolean }) {
  const [showChanges, setShowChanges] = useState(false);
  const [cantUndo, setCantUndo] = useState(false);
  const undone = edit.data.status === 'undone';
  return (
    <article className="animate-rise">
      <Ask quote={edit.data.quote} instruction={edit.data.instruction} />
      <p className="mt-[18px] text-[12.5px] text-ink-faint">
        {EDITOR_COPY.agent.worked(Math.max(1, Math.round(edit.data.durationMs / 1000)))}
      </p>
      <p className="mt-2 text-[14px] leading-[1.45]">
        {undone ? EDITOR_COPY.agent.undone : edit.data.message}
      </p>
      <div className="mt-2.5 flex flex-col items-start gap-2.5 rounded-xl border border-line px-3 py-2.5">
        <p className={`text-[13.5px] leading-[1.35] ${undone ? 'text-ink-faint' : ''}`}>
          {undone ? EDITOR_COPY.agent.undone : edit.data.title}
        </p>
        {showChanges && !undone && <Diff before={edit.data.quote} after={edit.data.replacement} />}
        {!undone && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowChanges((v) => !v)}
              className="rounded-lg bg-mark px-2 py-[5px] text-[12.5px] text-kept-ink"
            >
              {showChanges ? EDITOR_COPY.agent.hideChanges : EDITOR_COPY.agent.showChanges}
            </button>
            <button
              type="button"
              onClick={() => setCantUndo(!onUndo())}
              aria-label={EDITOR_COPY.agent.undo}
              title={EDITOR_COPY.agent.undo}
              className="grid size-7 place-items-center rounded-lg text-ink-muted hover:bg-wash hover:text-ink"
            >
              <UndoIcon />
            </button>
          </div>
        )}
        {cantUndo && <p className="text-[12.5px] text-ink-muted">{EDITOR_COPY.agent.cantUndo}</p>}
      </div>
    </article>
  );
}

function PendingEntry({ pending }: { pending: PendingEdit }) {
  return (
    <article className="animate-rise">
      <Ask quote={pending.quote} instruction={pending.instruction} />
      <div className="mt-[18px]">
        {pending.failed ? (
          <p role="alert" className="text-[14px] text-danger">
            {EDITOR_COPY.agent.failed}
          </p>
        ) : (
          <Working status={EDITOR_COPY.agent.working} className="text-[12.5px]" />
        )}
      </div>
    </article>
  );
}

interface AgentPanelProps {
  edits: WithId<AgentEdit>[];
  pending: PendingEdit[];
  /** The selected text the next instruction applies to. */
  quote: string | null;
  onClearQuote: () => void;
  onSubmit: (instruction: string) => void;
  onUndo: (edit: WithId<AgentEdit>) => boolean;
  onClose: () => void;
}

/** The Cherrytree Agent rail: what was asked and changed, and the box to ask for more. */
function AgentPanel({
  edits,
  pending,
  quote,
  onClearQuote,
  onSubmit,
  onUndo,
  onClose,
}: AgentPanelProps) {
  const [instruction, setInstruction] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(quote) && instruction.trim().length > 0;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [edits.length, pending.length]);
  useEffect(() => {
    if (quote) inputRef.current?.focus();
  }, [quote]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSend) return;
    onSubmit(instruction.trim());
    setInstruction('');
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <aside
      aria-label={EDITOR_COPY.agent.title}
      className="flex w-[360px] max-w-full flex-none animate-fade flex-col border-l border-line bg-white"
    >
      <div className="flex items-center gap-2 px-5 pt-[18px]">
        <h2 className="text-[14px] font-medium">{EDITOR_COPY.agent.title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide Cherrytree Agent"
          className="ml-auto grid size-[22px] place-items-center rounded-md text-base leading-none text-ink-faint hover:bg-wash hover:text-ink"
        >
          ›
        </button>
      </div>
      <div ref={logRef} className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-4">
        {edits.length === 0 && pending.length === 0 && (
          <p className="text-[13.5px] leading-[1.45] text-ink-faint">{EDITOR_COPY.agent.empty}</p>
        )}
        {edits.map((edit) => (
          <EditEntry key={edit.id} edit={edit} onUndo={() => onUndo(edit)} />
        ))}
        {pending.map((item) => (
          <PendingEntry key={item.key} pending={item} />
        ))}
      </div>
      <form onSubmit={submit} className="flex-none p-3">
        <div className="flex flex-col rounded-2xl border border-line bg-white px-3 pt-3 pb-2 transition-colors focus-within:border-ink/40">
          {quote && (
            <p className="mb-2 inline-flex max-w-full animate-fade items-center gap-1.5 self-start rounded-full bg-wash py-1 pr-1 pl-2.5 text-[13px] leading-[1.35] text-ink-muted">
              <QuoteIcon />
              <span className="truncate">{quote}</span>
              <button
                type="button"
                onClick={onClearQuote}
                aria-label="Clear the selection"
                className="grid size-[18px] flex-none place-items-center rounded-full leading-none text-ink-faint hover:text-ink"
              >
                ×
              </button>
            </p>
          )}
          <label htmlFor="agent-instruction" className="sr-only">
            Instruction
          </label>
          <textarea
            id="agent-instruction"
            ref={inputRef}
            rows={2}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={quote ? EDITOR_COPY.agent.placeholder : EDITOR_COPY.agent.needsSelection}
            className="field-sizing-content max-h-[120px] min-h-10 w-full resize-none border-0 bg-transparent px-0.5 pt-0.5 pb-2 text-[14px] leading-[1.4] outline-none placeholder:text-[#b7b2a8]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send"
              className="grid size-7 place-items-center rounded-full bg-ink text-[14px] leading-none text-paper disabled:bg-[#eceae6] disabled:text-[#b7b2a8]"
            >
              ↑
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}

export default AgentPanel;

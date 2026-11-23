import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { AgentEdit, DraftBlock, Thread } from '@cherrytree/shared';
import { RangeApi, type TRange, type Value } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import AgentPanel, { type PendingEdit } from './AgentPanel.tsx';
import DraftDocument from './DraftDocument.tsx';
import { useDraftPlate } from './draftPlugins.ts';
import {
  addCommentMark,
  commentRange,
  findText,
  removeCommentMark,
  replaceRange,
} from './draftOps.ts';
import SelectionPopover from './SelectionPopover.tsx';
import ThreadCard from './ThreadCard.tsx';
import BackToDashboard from '../BackToDashboard.tsx';
import BrandMark from '../BrandMark.tsx';
import { EDITOR_COPY } from '../../constants/editor.ts';
import { DISCLAIMER } from '../../constants/project.ts';
import type { WithId } from '../../hooks/useDraftEditor.ts';
import { useDraftSave, type SaveStatus } from '../../hooks/useDraftSave.ts';
import {
  createThread,
  replyInThread,
  requestAgentEdit,
  setThreadStatus,
  undoAgentEdit,
} from '../../lib/agent.ts';

type Mode = 'agent' | 'comments';
const MODE_KEY = 'cherrytree.editorMode';

interface Selected {
  range: TRange;
  quote: string;
  rect: DOMRect;
}

/** The selected text stays highlighted while focus is in the agent box (CSS Custom Highlights). */
function highlightSelection(range: Range | null) {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return;
  if (range) CSS.highlights.set('draft-selection', new Highlight(range));
  else CSS.highlights.delete('draft-selection');
}

function readMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === 'comments' ? 'comments' : 'agent';
  } catch {
    return 'agent';
  }
}

function SaveState({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === 'failed') {
    return (
      <button type="button" onClick={onRetry} className="text-[0.78125rem] text-danger underline">
        {EDITOR_COPY.save.failed}
      </button>
    );
  }
  return (
    <span
      key={status}
      className={`animate-fade text-[0.78125rem] ${status === 'stale' ? 'text-danger' : 'text-ink-faint'}`}
    >
      {EDITOR_COPY.save[status]}
    </span>
  );
}

/** Positions each open thread's card beside its text, pushing cards down so none overlap. */
function useThreadPositions(
  threads: WithId<Thread>[],
  marginRef: React.RefObject<HTMLElement | null>,
  tick: number,
) {
  const [tops, setTops] = useState<Record<string, number>>({});
  useLayoutEffect(() => {
    const margin = marginRef.current;
    if (!margin) return;
    const place = () => {
      const origin = margin.getBoundingClientRect().top;
      const next: Record<string, number> = {};
      let floor = 0;
      const anchored = threads
        .map((thread) => ({
          id: thread.id,
          anchor: document.querySelector(`[data-comment-ids~="${thread.id}"]`),
          card: margin.querySelector<HTMLElement>(`[data-thread="${thread.id}"]`),
        }))
        .filter((t) => t.anchor && t.card)
        .map((t) => ({ ...t, top: t.anchor!.getBoundingClientRect().top - origin }))
        .sort((a, b) => a.top - b.top);
      for (const { id, top, card } of anchored) {
        next[id] = Math.max(top, floor);
        floor = next[id] + card!.offsetHeight + 12;
      }
      // Only a real move re-renders, so placing the cards doesn't place them again.
      setTops((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    };
    place();
    window.addEventListener('resize', place);
    // A card that grows (a new reply, the reply box opening) pushes the ones below it.
    const resized = new ResizeObserver(place);
    margin.querySelectorAll('[data-thread]').forEach((card) => resized.observe(card));
    return () => {
      window.removeEventListener('resize', place);
      resized.disconnect();
    };
  }, [threads, marginRef, tick]);
  return tops;
}

interface DraftEditorProps {
  projectId: string;
  initialContent: DraftBlock[];
  initialVersion: number;
  threads: WithId<Thread>[];
  edits: WithId<AgentEdit>[];
}

/**
 * The draft as an editable page. Cherrytree Agent mode: select text and tell the agent what to
 * change; the change applies at once and can be undone. Comments mode: comment on selected text
 * (Cherrytree replies, often with wording to approve) or type a rewrite. Every change is saved
 * automatically.
 */
function DraftEditor({
  projectId,
  initialContent,
  initialVersion,
  threads,
  edits,
}: DraftEditorProps) {
  const editor: PlateEditor = useDraftPlate(initialContent);
  const save = useDraftSave(projectId, initialVersion);
  const [mode, setMode] = useState<Mode>(readMode);
  const [railOpen, setRailOpen] = useState(true);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [pending, setPending] = useState<PendingEdit[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const appliedRanges = useRef(new Map<string, ReturnType<PlateEditor['api']['rangeRef']>>());
  const marginRef = useRef<HTMLDivElement>(null);

  const openThreads = useMemo(() => threads.filter((t) => t.data.status === 'open'), [threads]);
  const tops = useThreadPositions(openThreads, marginRef, tick);

  const changeMode = (next: Mode) => {
    setMode(next);
    setSelected(null);
    highlightSelection(null);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // A per-viewer convenience only.
    }
  };

  const onChange = useCallback(
    (value: Value) => {
      save.schedule(value as DraftBlock[]);
      setTick((n) => n + 1);
    },
    [save],
  );

  const captureSelection = () => {
    const range = editor.selection;
    if (!range || RangeApi.isCollapsed(range)) {
      if (mode === 'comments') setSelected(null);
      return;
    }
    const quote = editor.api.string(range);
    if (!quote.trim()) return;
    const dom = window.getSelection();
    const domRange = dom && dom.rangeCount > 0 ? dom.getRangeAt(0).cloneRange() : null;
    setSelected({ range, quote, rect: domRange?.getBoundingClientRect() ?? new DOMRect() });
    if (mode === 'agent') {
      highlightSelection(domRange);
      setRailOpen(true);
    }
  };

  const clearSelection = () => {
    setSelected(null);
    highlightSelection(null);
  };

  // -- Cherrytree Agent ------------------------------------------------------------------------

  const askAgent = async (instruction: string) => {
    if (!selected) return;
    const { range, quote } = selected;
    const key = crypto.randomUUID();
    const target = editor.api.rangeRef(range, { affinity: 'inward' });
    clearSelection();
    setPending((items) => [...items, { key, quote, instruction, failed: false }]);
    try {
      const edit = await requestAgentEdit(projectId, { quote, instruction });
      const at = target.unref();
      const current = at && editor.api.string(at) === quote ? at : findText(editor, quote);
      if (!current) throw new Error('The selected text changed while the agent worked');
      const applied = replaceRange(editor, current, edit.replacement);
      appliedRanges.current.set(edit.id, editor.api.rangeRef(applied, { affinity: 'inward' }));
      setPending((items) => items.filter((item) => item.key !== key));
    } catch (error) {
      console.error('Agent edit failed:', error);
      target.unref();
      setPending((items) =>
        items.map((item) => (item.key === key ? { ...item, failed: true } : item)),
      );
    }
  };

  /** Puts the original text back; false if the new text can no longer be found. */
  const undo = (edit: WithId<AgentEdit>): boolean => {
    const tracked = appliedRanges.current.get(edit.id)?.current;
    const range =
      tracked && editor.api.string(tracked) === edit.data.replacement
        ? tracked
        : findText(editor, edit.data.replacement);
    if (!range) return false;
    replaceRange(editor, range, edit.data.quote);
    appliedRanges.current.get(edit.id)?.unref();
    appliedRanges.current.delete(edit.id);
    void undoAgentEdit(projectId, edit.id).catch((error: unknown) =>
      console.error('Logging the undo failed:', error),
    );
    return true;
  };

  // -- Comments ----------------------------------------------------------------------------------

  const comment = (text: string) => {
    if (!selected) return;
    const threadId = crypto.randomUUID();
    addCommentMark(editor, selected.range, threadId);
    const { quote } = selected;
    clearSelection();
    setActiveThread(threadId);
    void createThread(projectId, { threadId, quote, text }).catch((error: unknown) => {
      console.error('Starting the thread failed:', error);
      removeCommentMark(editor, threadId);
    });
  };

  const applyRewrite = (text: string) => {
    if (!selected) return;
    replaceRange(editor, selected.range, text);
    clearSelection();
  };

  const approve = (threadId: string, suggestion: string) => {
    const range = commentRange(editor, threadId);
    if (range) replaceRange(editor, range, suggestion);
    removeCommentMark(editor, threadId);
    void setThreadStatus(projectId, threadId, 'resolved');
  };

  const dismiss = (threadId: string) => {
    removeCommentMark(editor, threadId);
    void setThreadStatus(projectId, threadId, 'deleted');
  };

  return (
    <div className="flex h-screen flex-col bg-paper font-ui text-ink">
      <header className="flex flex-none items-center gap-3.5 border-b border-line bg-white px-5 py-3 sm:px-7">
        <BackToDashboard />
        <Link to="/dashboard" aria-label="Cherrytree dashboard" className="mr-2.5 hover:opacity-75">
          <BrandMark />
        </Link>
        <p key={mode} className="hidden animate-fade text-[0.84375rem] text-ink-muted md:block">
          {EDITOR_COPY.hints[mode]}
        </p>
        <span className="hidden text-[0.8125rem] text-ink-muted sm:inline">
          {EDITOR_COPY.title}
        </span>
        <SaveState status={save.status} onRetry={() => void save.retry()} />
        <div
          role="group"
          aria-label="Editing mode"
          className="ml-auto flex gap-0.5 rounded-full bg-wash p-[3px] text-[0.78125rem]"
        >
          {(['agent', 'comments'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => changeMode(value)}
              className={`rounded-full px-2.5 py-[5px] transition-colors duration-200 ${
                mode === value ? 'bg-white text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {EDITOR_COPY.modes[value]}
            </button>
          ))}
        </div>
      </header>

      {save.status === 'stale' && (
        <p role="alert" className="flex-none bg-needs/30 px-8 py-2 text-center text-[0.8125rem]">
          {EDITOR_COPY.staleBody}
        </p>
      )}

      <div className="relative flex min-h-0 flex-1">
        <main
          data-mode={mode}
          className="min-w-0 flex-1 overflow-y-auto bg-desk px-4 pt-7 pb-10 sm:px-9 data-[mode=agent]:[&_[data-comment-ids]]:bg-transparent data-[mode=agent]:[&_[data-comment-ids]]:px-0"
        >
          <DraftDocument
            editor={editor}
            onChange={onChange}
            onSelectEnd={captureSelection}
            margin={
              mode === 'comments' && (
                <div ref={marginRef} aria-label="Comments" className="relative hidden xl:block">
                  {openThreads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      id={thread.id}
                      thread={thread.data}
                      top={tops[thread.id] ?? null}
                      active={activeThread === thread.id}
                      onFocus={() => setActiveThread(thread.id)}
                      onApprove={(suggestion) => approve(thread.id, suggestion)}
                      onDismiss={() => dismiss(thread.id)}
                      onReply={(text) => replyInThread(projectId, thread.id, text)}
                    />
                  ))}
                </div>
              )
            }
          />
          <p className="mx-auto mt-8 max-w-[720px] text-center text-[0.6875rem] text-ink-faint">
            {DISCLAIMER}
          </p>
        </main>

        {mode === 'agent' &&
          (railOpen ? (
            <AgentPanel
              edits={edits}
              pending={pending}
              quote={selected?.quote ?? null}
              onClearQuote={clearSelection}
              onSubmit={(instruction) => void askAgent(instruction)}
              onUndo={undo}
              onClose={() => setRailOpen(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setRailOpen(true)}
              className="absolute top-4 right-4 z-20 animate-fade rounded-lg border border-line bg-white px-3 py-2 text-[0.8125rem] leading-none shadow-[0_2px_10px_rgb(45_42_34/6%)]"
            >
              {EDITOR_COPY.agent.title}
            </button>
          ))}
      </div>

      {mode === 'comments' && selected && (
        <SelectionPopover
          key={selected.quote}
          quote={selected.quote}
          rect={selected.rect}
          onComment={comment}
          onApply={applyRewrite}
          onClose={clearSelection}
        />
      )}
    </div>
  );
}

export default DraftEditor;

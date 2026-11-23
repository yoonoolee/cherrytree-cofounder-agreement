import type {
  AdvisorMessage,
  AdvisorReplyTurn,
  AdvisorState,
  AdvisorTurn,
  ChecklistItem,
  Followup,
  Screen,
  TurnHighlight,
} from '@cherrytree/shared';

import type { Mark } from './highlights.ts';

/** One screen: the Advisor's question, then every reply sent on it, stacked. */
export interface AdvisorScreen extends Screen {
  sectionName: string;
  /** Oldest first. */
  turns: AdvisorReplyTurn[];
}

/**
 * Where the interview is:
 * - `screen`: a question's screen. `moving` holds a saved `next_question` or `next_section`
 *   message until the user clicks Next.
 * - `complete`: the Advisor ended the interview; `answer` is the last message's answer.
 */
export type AdvisorView =
  | { kind: 'screen'; screen: AdvisorScreen; moving: AdvisorMessage | null }
  | { kind: 'complete'; answer: string | null };

const isReply = (turn: AdvisorTurn): turn is AdvisorReplyTurn => turn.kind === 'turn';

const MOVES: readonly AdvisorMessage['type'][] = ['next_question', 'next_section'];

function screenFor(
  state: AdvisorState,
  turns: AdvisorReplyTurn[],
  screenId: string,
): AdvisorScreen | null {
  const screen = state.screens.find((s) => s.id === screenId);
  const section = state.sections.find((s) => s.id === screen?.section);
  if (!screen || !section) return null;
  return {
    ...screen,
    sectionName: section.name,
    turns: turns.filter((turn) => turn.screen === screenId),
  };
}

/**
 * The view to show. A turn that opens a new screen keeps its own screen until the user clicks
 * Next (`movedOn` is the index of the turn they clicked Next on), also after a reload.
 */
export function advisorView(
  state: AdvisorState,
  turns: readonly AdvisorTurn[],
  movedOn: number | null,
): AdvisorView | null {
  const replies = turns.filter(isReply);
  const last = replies.at(-1);
  if (last && MOVES.includes(last.message.type) && movedOn !== last.index) {
    const screen = screenFor(state, replies, last.screen);
    return screen && { kind: 'screen', screen, moving: last.message };
  }
  const current = state.screens.at(-1);
  if (state.complete || !current) {
    const answer = last?.message.type === 'interview_complete' ? last.message.answer : null;
    return { kind: 'complete', answer };
  }
  const screen = screenFor(state, replies, current.id);
  return screen && { kind: 'screen', screen, moving: null };
}

export interface AdvisorProgress {
  /** Share of checklist items done or skipped, 0–1. */
  fraction: number;
  sections: { name: string; done: boolean; active: boolean }[];
}

/** Progress over the live checklist, which grows as the Advisor adds items. */
export function advisorProgress(state: AdvisorState, activeSection: string): AdvisorProgress {
  const settled = (item: ChecklistItem) => item.status === 'done' || item.status === 'skipped';
  const items = state.sections.flatMap((section) => section.checklist);
  return {
    fraction: items.length === 0 ? 1 : items.filter(settled).length / items.length,
    sections: state.sections.map((section) => ({
      name: section.name,
      done: section.checklist.every(settled),
      active: section.name === activeSection,
    })),
  };
}

/** A red highlight streamed for a follow-up before the turn is saved. */
export interface LiveRedHighlight {
  followupId: string;
  highlight: TurnHighlight;
}

/** One numbered highlight on a screen; follow-ups on the same text share it. */
export interface NumberedHighlight {
  highlight: TurnHighlight;
  number: number;
  /** A follow-up on it is still to do. */
  open: boolean;
  /** Asked by the turn whose highlights are sweeping in. */
  sweep: boolean;
}

const highlightKey = ({ turn, start, end }: TurnHighlight) => `${turn}:${start}:${end}`;

/**
 * The screen's red highlights, numbered in order of first appearance (by reply, then position),
 * with each follow-up id's number. `sweeping`: the red highlights of the turn sweeping in, saved
 * or not. A follow-up without a highlight has no number.
 */
export function numberHighlights(
  followups: readonly Followup[],
  sweeping: readonly LiveRedHighlight[] = [],
): { highlights: NumberedHighlight[]; numberOf: (followupId: string) => number | undefined } {
  const byKey = new Map<string, { highlight: TurnHighlight; open: boolean; sweep: boolean }>();
  const keyOf = new Map<string, string>();
  // A highlight sweeps in only if every follow-up on it is new.
  const add = (id: string, highlight: TurnHighlight, open: boolean, sweep: boolean) => {
    const key = highlightKey(highlight);
    const existing = byKey.get(key);
    byKey.set(key, {
      highlight,
      open: open || (existing?.open ?? false),
      sweep: existing ? existing.sweep && sweep : sweep,
    });
    keyOf.set(id, key);
  };
  const sweepingIds = new Set(sweeping.map((r) => r.followupId));
  for (const f of followups) {
    const open = f.status === 'todo' || f.status === 'current';
    if (f.highlight) add(f.id, f.highlight, open, sweepingIds.has(f.id));
  }
  for (const r of sweeping)
    if (!keyOf.has(r.followupId)) add(r.followupId, r.highlight, true, true);

  const ordered = [...byKey.entries()].sort(
    ([, a], [, b]) =>
      a.highlight.turn - b.highlight.turn ||
      a.highlight.start - b.highlight.start ||
      a.highlight.end - b.highlight.end,
  );
  const numbers = new Map(ordered.map(([key], i) => [key, i + 1]));
  return {
    highlights: ordered.map(([key, value]) => ({ ...value, number: numbers.get(key) ?? 0 })),
    numberOf: (followupId) => {
      const key = keyOf.get(followupId);
      return key === undefined ? undefined : numbers.get(key);
    },
  };
}

/**
 * The marks on the reply of turn `turn`: its green highlights and the screen's numbered ones.
 * `sweep`: the turn's highlights are sweeping in.
 */
export function marksFor(
  turn: number,
  greenHighlights: readonly { start: number; end: number }[],
  numbered: readonly NumberedHighlight[],
  sweep = false,
): Mark[] {
  return [
    ...greenHighlights.map(({ start, end }) => ({ start, end, kind: 'kept' as const, sweep })),
    ...numbered
      .filter(({ highlight }) => highlight.turn === turn)
      .map((numberedHighlight) => ({
        start: numberedHighlight.highlight.start,
        end: numberedHighlight.highlight.end,
        kind: numberedHighlight.open ? ('needs' as const) : ('resolved' as const),
        number: numberedHighlight.number,
        sweep: numberedHighlight.sweep,
      })),
  ];
}

/** The text of a follow-up by id. */
export function followupText(state: AdvisorState, id: string): string | null {
  for (const screen of state.screens) {
    const followup = screen.followups.find((f) => f.id === id);
    if (followup) return followup.text;
  }
  return null;
}

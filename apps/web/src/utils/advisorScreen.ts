import type {
  AdvisorMessage,
  AdvisorReplyTurn,
  AdvisorState,
  AdvisorTurn,
  Followup,
  Question,
  TurnHighlight,
} from '@cherrytree/shared';

import type { Mark } from './highlights.ts';

/** One main question's screen: the question, then every reply sent on it, stacked. */
export interface AdvisorScreen {
  /** 1-based, in interview order. */
  sectionNumber: number;
  sectionName: string;
  question: Question;
  /** Oldest first. */
  turns: AdvisorReplyTurn[];
}

/**
 * Where the interview is:
 * - `screen`: a main question's screen. `moving` holds a saved `next_question` or `next_section`
 *   message until the user clicks Next.
 * - `complete`: every main question is done or skipped; `answer` is the last message's answer.
 */
export type AdvisorView =
  | { kind: 'screen'; screen: AdvisorScreen; moving: AdvisorMessage | null }
  | { kind: 'complete'; answer: string | null };

const isReply = (turn: AdvisorTurn): turn is AdvisorReplyTurn => turn.kind === 'turn';

const MOVES: readonly AdvisorMessage['type'][] = ['next_question', 'next_section'];

function screenFor(
  state: AdvisorState,
  turns: AdvisorReplyTurn[],
  questionId: string,
): AdvisorScreen | null {
  for (const [sectionIndex, section] of state.sections.entries()) {
    const question = section.questions.find((q) => q.id === questionId);
    if (!question) continue;
    return {
      sectionNumber: sectionIndex + 1,
      sectionName: section.name,
      question,
      turns: turns.filter((turn) => turn.screen === questionId),
    };
  }
  return null;
}

/**
 * The view to show. A turn that moves to the next main question keeps its screen until the user
 * clicks Next (`movedOn` is the index of the turn they clicked Next on), also after a reload.
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
  const current = state.sections.flatMap((s) => s.questions).find((q) => q.status === 'current');
  if (!current) {
    const answer = last?.message.type === 'interview_complete' ? last.message.answer : null;
    return { kind: 'complete', answer };
  }
  const screen = screenFor(state, replies, current.id);
  return screen && { kind: 'screen', screen, moving: null };
}

export interface AdvisorProgress {
  /** Share of main questions done or skipped, 0–1. */
  fraction: number;
  sections: { name: string; done: boolean; active: boolean }[];
}

/** Progress over the live question list, which grows as the Advisor adds main questions. */
export function advisorProgress(state: AdvisorState, activeSection: string): AdvisorProgress {
  const settled = (q: Question) => q.status === 'done' || q.status === 'skipped';
  const questions = state.sections.flatMap((section) => section.questions);
  return {
    fraction: questions.length === 0 ? 1 : questions.filter(settled).length / questions.length,
    sections: state.sections.map((section) => ({
      name: section.name,
      done: section.questions.every(settled),
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
}

const highlightKey = ({ turn, start, end }: TurnHighlight) => `${turn}:${start}:${end}`;

/**
 * The screen's red highlights, numbered in order of first appearance (by reply, then position),
 * with each follow-up id's number. `live` adds those streamed in the running turn.
 */
export function numberHighlights(
  followups: readonly Followup[],
  live: readonly LiveRedHighlight[] = [],
): { highlights: NumberedHighlight[]; numberOf: (followupId: string) => number | undefined } {
  const byKey = new Map<string, { highlight: TurnHighlight; open: boolean }>();
  const keyOf = new Map<string, string>();
  const add = (id: string, highlight: TurnHighlight, open: boolean) => {
    const key = highlightKey(highlight);
    const existing = byKey.get(key);
    byKey.set(key, { highlight, open: open || (existing?.open ?? false) });
    keyOf.set(id, key);
  };
  for (const f of followups) add(f.id, f.highlight, f.status === 'todo' || f.status === 'current');
  for (const r of live) if (!keyOf.has(r.followupId)) add(r.followupId, r.highlight, true);

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

/** The marks on the reply of turn `turn`: its green highlights and the screen's numbered ones. */
export function marksFor(
  turn: number,
  greenHighlights: readonly { start: number; end: number }[],
  numbered: readonly NumberedHighlight[],
): Mark[] {
  return [
    ...greenHighlights.map(({ start, end }) => ({ start, end, kind: 'kept' as const })),
    ...numbered
      .filter(({ highlight }) => highlight.turn === turn)
      .map(({ highlight, number, open }) => ({
        start: highlight.start,
        end: highlight.end,
        kind: open ? ('needs' as const) : ('resolved' as const),
        number,
      })),
  ];
}

/** The text of a follow-up or main question by id. */
export function questionText(state: AdvisorState, id: string): string | null {
  for (const section of state.sections) {
    for (const question of section.questions) {
      if (question.id === id) return question.text;
      const followup = question.followups.find((f) => f.id === id);
      if (followup) return followup.text;
    }
  }
  return null;
}

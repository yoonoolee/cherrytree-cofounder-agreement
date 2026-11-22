/** Typed builders for the Advisor documents (`advisor/state`, `turns/{index}`). */
import type {
  AdvisorBtwTurn,
  AdvisorMessage,
  AdvisorReplyTurn,
  AdvisorState,
  ChecklistItem,
  ChecklistSection,
  Followup,
  FollowupStatus,
} from '@cherrytree/shared';

import { timestamp } from './project.ts';

const item = (id: string, text: string): ChecklistItem => ({
  id,
  item: text,
  status: 'todo',
  source: 'initial',
  answer: null,
});

/** Two sections, as a session starts: every item to do. */
function makeSections(): ChecklistSection[] {
  return [
    {
      id: 'background',
      name: 'Background',
      checklist: [item('background_1', 'How they met'), item('background_2', 'Whose idea it was')],
    },
    { id: 'roles', name: 'Roles', checklist: [item('roles_1', 'What each one owns')] },
  ];
}

/** A session's start: the first screen asks the opener. */
export function makeAdvisorState(overrides: Partial<AdvisorState> = {}): AdvisorState {
  return {
    sections: makeSections(),
    screens: [
      { id: 'screen_1', section: 'background', question: 'How did you two meet?', followups: [] },
    ],
    complete: false,
    turnCount: 0,
    updatedAt: timestamp('2026-10-25T10:00:00Z'),
    ...overrides,
  };
}

/** Opens a new screen in `section`. */
export function withScreen(state: AdvisorState, section: string, question: string): AdvisorState {
  const id = `screen_${state.screens.length + 1}`;
  return { ...state, screens: [...state.screens, { id, section, question, followups: [] }] };
}

/** Marks the checklist items `ids` done. */
export function withDone(state: AdvisorState, ...ids: string[]): AdvisorState {
  return {
    ...state,
    sections: state.sections.map((section) => ({
      ...section,
      checklist: section.checklist.map((i) => (ids.includes(i.id) ? { ...i, status: 'done' } : i)),
    })),
  };
}

/** Adds follow-ups to the screen `screenId`. */
export function withFollowups(
  state: AdvisorState,
  screenId: string,
  followups: Followup[],
): AdvisorState {
  return {
    ...state,
    screens: state.screens.map((s) =>
      s.id === screenId ? { ...s, followups: [...s.followups, ...followups] } : s,
    ),
  };
}

export const REPLY = 'We met at a climbing gym in Oakland in 2023.';

/** A follow-up on `quote` in the reply of turn `turn` (REPLY by default). */
export function makeFollowup(
  id: string,
  text: string,
  quote: string,
  {
    turn = 0,
    status = 'todo',
    reply = REPLY,
  }: { turn?: number; status?: FollowupStatus; reply?: string } = {},
): Followup {
  const start = reply.indexOf(quote);
  return { id, text, status, highlight: { turn, text: quote, start, end: start + quote.length } };
}

export function makeMessage(overrides: Partial<AdvisorMessage> = {}): AdvisorMessage {
  return {
    type: 'followup',
    question: null,
    followupId: 'f_when',
    answer: null,
    sources: [],
    ...overrides,
  };
}

export function makeTurn(
  index: number,
  overrides: Partial<AdvisorReplyTurn> = {},
): AdvisorReplyTurn {
  return {
    index,
    kind: 'turn',
    uid: 'user_admin',
    screen: 'screen_1',
    reply: REPLY,
    greenHighlights: [{ text: 'Oakland', start: 28, end: 35 }],
    message: makeMessage(),
    traceId: null,
    createdAt: timestamp('2026-10-25T10:05:00Z'),
    ...overrides,
  };
}

export function makeBtwTurn(
  index: number,
  overrides: Partial<AdvisorBtwTurn> = {},
): AdvisorBtwTurn {
  return {
    index,
    kind: 'btw',
    uid: 'user_admin',
    screen: 'screen_1',
    quote: 'climbing gym',
    question: 'Does it matter where we met?',
    message: { type: 'answer', text: 'Not for the agreement.', sources: [] },
    traceId: null,
    createdAt: timestamp('2026-10-25T10:06:00Z'),
    ...overrides,
  };
}

/** Typed builders for the Advisor documents (`advisor/state`, `turns/{index}`). */
import type {
  AdvisorBtwTurn,
  AdvisorMessage,
  AdvisorReplyTurn,
  AdvisorState,
  Followup,
  Question,
  QuestionSection,
  QuestionStatus,
} from '@cherrytree/shared';

import { timestamp } from './project.ts';

const question = (id: string, text: string, status: QuestionStatus = 'todo'): Question => ({
  id,
  text,
  description: '',
  status,
  source: 'initial',
  advisorNotes: null,
  followups: [],
});

/** Two sections, as a session starts: the first question is current. */
function makeSections(): QuestionSection[] {
  return [
    {
      id: 'background',
      name: 'Background',
      questions: [
        question('background_meet', 'How did you two meet?', 'current'),
        question('background_idea', 'Whose idea was the company?'),
      ],
    },
    {
      id: 'roles',
      name: 'Roles',
      questions: [question('roles_titles', 'What will each of you be responsible for?')],
    },
  ];
}

export function makeAdvisorState(overrides: Partial<AdvisorState> = {}): AdvisorState {
  return {
    sections: makeSections(),
    turnCount: 0,
    updatedAt: timestamp('2026-10-25T10:00:00Z'),
    ...overrides,
  };
}

/** Marks `currentId` current, everything before it done. */
export function withCurrent(state: AdvisorState, currentId: string): AdvisorState {
  const ids = state.sections.flatMap((s) => s.questions.map((q) => q.id));
  const at = ids.indexOf(currentId);
  return {
    ...state,
    sections: state.sections.map((section) => ({
      ...section,
      questions: section.questions.map((q) => {
        const i = ids.indexOf(q.id);
        return { ...q, status: i < at ? 'done' : i === at ? 'current' : 'todo' };
      }),
    })),
  };
}

/** Adds follow-ups under the main question `questionId`. */
export function withFollowups(
  state: AdvisorState,
  questionId: string,
  followups: Followup[],
): AdvisorState {
  return {
    ...state,
    sections: state.sections.map((section) => ({
      ...section,
      questions: section.questions.map((q) =>
        q.id === questionId ? { ...q, followups: [...q.followups, ...followups] } : q,
      ),
    })),
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
  }: { turn?: number; status?: QuestionStatus; reply?: string } = {},
): Followup {
  const start = reply.indexOf(quote);
  return { id, text, status, highlight: { turn, text: quote, start, end: start + quote.length } };
}

export function makeMessage(overrides: Partial<AdvisorMessage> = {}): AdvisorMessage {
  return { type: 'followup', questionId: 'f_when', answer: null, sources: [], ...overrides };
}

export function makeTurn(
  index: number,
  overrides: Partial<AdvisorReplyTurn> = {},
): AdvisorReplyTurn {
  return {
    index,
    kind: 'turn',
    uid: 'user_admin',
    screen: 'background_meet',
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
    screen: 'background_meet',
    quote: 'climbing gym',
    question: 'Does it matter where we met?',
    message: { type: 'answer', text: 'Not for the agreement.', sources: [] },
    traceId: null,
    createdAt: timestamp('2026-10-25T10:06:00Z'),
    ...overrides,
  };
}

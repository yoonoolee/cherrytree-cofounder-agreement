/** Typed builders for the Advisor documents (`advisor/state`, `turns/{index}`). */
import type {
  AdvisorQuestion,
  AdvisorResponse,
  AdvisorState,
  AdvisorTurn,
  QuestionSection,
  QuestionStatus,
} from '@cherrytree/shared';

import { timestamp } from './project.ts';

const question = (id: string, text: string, status: QuestionStatus = 'todo') => ({
  id,
  text,
  description: '',
  status,
  source: 'initial' as const,
  advisorNotes: null,
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
    sectionSummaries: {},
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

export const followup = (text: string): AdvisorQuestion => ({ type: 'followup', text });
export const nextQuestion = (text: string): AdvisorQuestion => ({ type: 'next_question', text });

export function makeResponse(overrides: Partial<AdvisorResponse> = {}): AdvisorResponse {
  return {
    highlights: ['at a climbing gym in Oakland'],
    answer: null,
    sources: [],
    question: followup('How long have you known each other?'),
    ...overrides,
  };
}

export function makeTurn(index: number, overrides: Partial<AdvisorTurn> = {}): AdvisorTurn {
  return {
    index,
    uid: 'user_admin',
    reply: 'We met at a climbing gym in Oakland in 2023.',
    response: makeResponse(),
    traceId: null,
    createdAt: timestamp('2026-10-25T10:05:00Z'),
    ...overrides,
  };
}

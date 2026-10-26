import { z } from 'zod';

import {
  advisorResponseSchema,
  advisorStateSchema,
  advisorTurnSchema,
  initialQuestionsSchema,
} from './advisor.ts';

const timestamp = { toDate: () => new Date(0), toMillis: () => 0 };

const question = {
  id: 'q_equity_split',
  text: 'How do you plan to split equity?',
  description: 'Percentages per cofounder and the reasoning.',
  status: 'current',
  source: 'initial',
  advisorNotes: null,
};

const response = {
  highlights: ['50/50'],
  answer: null,
  sources: [],
  question: { type: 'followup', text: 'Does that include future hires?' },
};

describe('advisorStateSchema', () => {
  it('accepts a question list with summaries', () => {
    const state = {
      sections: [{ id: 'equity', name: 'Equity', questions: [question] }],
      sectionSummaries: { roles: '- Avery is CEO' },
      turnCount: 3,
      updatedAt: timestamp,
    };
    expect(advisorStateSchema.parse(state)).toEqual(state);
  });

  it('rejects an unknown status or source', () => {
    const withQuestion = (q: object) => ({
      sections: [{ id: 'equity', name: 'Equity', questions: [q] }],
      sectionSummaries: {},
      turnCount: 0,
      updatedAt: timestamp,
    });
    expect(
      advisorStateSchema.safeParse(withQuestion({ ...question, status: 'open' })).success,
    ).toBe(false);
    expect(
      advisorStateSchema.safeParse(withQuestion({ ...question, source: 'user' })).success,
    ).toBe(false);
  });
});

describe('initialQuestionsSchema', () => {
  it('takes only id, text and description per question', () => {
    const file = {
      sections: [
        { id: 'equity', name: 'Equity', questions: [{ id: 'q1', text: 'T', description: 'D' }] },
      ],
    };
    expect(initialQuestionsSchema.parse(file)).toEqual(file);
    expect(
      initialQuestionsSchema.parse({
        sections: [{ ...file.sections[0], questions: [question] }],
      }).sections[0]?.questions[0],
    ).toEqual({ id: question.id, text: question.text, description: question.description });
  });
});

describe('advisorTurnSchema', () => {
  it('accepts a turn', () => {
    const turn = {
      index: 0,
      uid: 'user_1',
      reply: "We're splitting 50/50.",
      response,
      traceId: null,
      createdAt: timestamp,
    };
    expect(advisorTurnSchema.parse(turn)).toEqual(turn);
  });

  it('rejects an unknown question type', () => {
    expect(
      advisorResponseSchema.safeParse({ ...response, question: { type: 'next', text: 'x' } })
        .success,
    ).toBe(false);
  });
});

describe('advisorResponseSchema as JSON Schema', () => {
  it('requires every property, so structured output keeps the streaming order', () => {
    const jsonSchema = z.toJSONSchema(advisorResponseSchema);
    expect(jsonSchema.required).toEqual(['highlights', 'answer', 'sources', 'question']);
    expect(Object.keys(jsonSchema.properties ?? {})).toEqual(jsonSchema.required);
  });
});

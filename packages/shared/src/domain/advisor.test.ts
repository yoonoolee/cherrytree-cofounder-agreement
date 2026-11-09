import { z } from 'zod';

import {
  advisorMessageSchema,
  advisorOutputSchema,
  advisorStateSchema,
  advisorTurnSchema,
  initialQuestionsSchema,
} from './advisor.ts';

const timestamp = { toDate: () => new Date(0), toMillis: () => 0 };

const followup = {
  id: 'f_idea',
  text: 'Whose idea was it to start the company?',
  status: 'todo',
  highlight: { turn: 0, text: 'talked about it for years', start: 10, end: 35 },
};

const question = {
  id: 'q_equity_split',
  text: 'How do you plan to split equity?',
  description: 'Percentages per cofounder and the reasoning.',
  status: 'current',
  source: 'initial',
  advisorNotes: null,
  followups: [followup],
};

const message = { type: 'followup', questionId: 'f_idea', answer: null, sources: [] };

describe('advisorStateSchema', () => {
  const withQuestion = (q: object) => ({
    sections: [{ id: 'equity', name: 'Equity', questions: [q] }],
    turnCount: 3,
    updatedAt: timestamp,
  });

  it('accepts a question list with follow-ups', () => {
    const state = withQuestion(question);
    expect(advisorStateSchema.parse(state)).toEqual(state);
  });

  it('rejects an unknown status or source', () => {
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
  const base = { index: 0, uid: 'user_1', screen: 'q_equity_split', traceId: null };

  it('accepts a turn and a btw', () => {
    const turn = {
      ...base,
      kind: 'turn',
      reply: "We're splitting 50/50.",
      greenHighlights: [{ text: '50/50', start: 17, end: 22 }],
      message,
      createdAt: timestamp,
    };
    const btw = {
      ...base,
      kind: 'btw',
      quote: '50/50',
      question: 'Is that common?',
      message: { type: 'answer', text: 'Yes, for two founders.', sources: [] },
      createdAt: timestamp,
    };
    expect(advisorTurnSchema.parse(turn)).toEqual(turn);
    expect(advisorTurnSchema.parse(btw)).toEqual(btw);
  });

  it('rejects an unknown message type', () => {
    expect(advisorMessageSchema.safeParse({ ...message, type: 'next' }).success).toBe(false);
  });
});

describe('advisorOutputSchema as JSON Schema', () => {
  it('requires every message property, so structured output keeps the streaming order', () => {
    const jsonSchema = z.toJSONSchema(advisorMessageSchema);
    expect(jsonSchema.required).toEqual(['type', 'questionId', 'answer', 'sources']);
    expect(Object.keys(jsonSchema.properties ?? {})).toEqual(jsonSchema.required);
  });

  it('takes a turn message or a btw answer', () => {
    expect(advisorOutputSchema.parse({ message }).message).toEqual(message);
    const answer = { type: 'answer', text: 'Yes.', sources: [] };
    expect(advisorOutputSchema.parse({ message: answer }).message).toEqual(answer);
  });
});

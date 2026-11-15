import { z } from 'zod';

import {
  advisorMessageSchema,
  advisorOutputSchema,
  advisorStateSchema,
  advisorTurnSchema,
  interviewSchema,
} from './advisor.ts';

const timestamp = { toDate: () => new Date(0), toMillis: () => 0 };

const followup = {
  id: 'f_idea',
  text: 'Whose idea was it to start the company?',
  status: 'todo',
  highlight: { turn: 0, text: 'talked about it for years', start: 10, end: 35 },
};

const item = {
  id: 'equity_1',
  item: "Each cofounder's percentage",
  status: 'done',
  source: 'initial',
  note: '50/50',
};

const message = {
  type: 'followup',
  question: null,
  followupId: 'f_idea',
  answer: null,
  sources: [],
};

describe('advisorStateSchema', () => {
  const state = (overrides: object = {}) => ({
    sections: [{ id: 'equity', name: 'Equity', checklist: [item] }],
    screens: [{ id: 'screen_1', section: 'equity', question: 'How?', followups: [followup] }],
    complete: false,
    turnCount: 3,
    updatedAt: timestamp,
    ...overrides,
  });

  it('accepts a checklist and screens with follow-ups', () => {
    expect(advisorStateSchema.parse(state())).toEqual(state());
  });

  it('rejects an unknown item status or source, and no screens', () => {
    const withItem = (changes: object) =>
      state({ sections: [{ id: 'equity', name: 'Equity', checklist: [{ ...item, ...changes }] }] });
    expect(advisorStateSchema.safeParse(withItem({ status: 'current' })).success).toBe(false);
    expect(advisorStateSchema.safeParse(withItem({ source: 'user' })).success).toBe(false);
    expect(advisorStateSchema.safeParse(state({ screens: [] })).success).toBe(false);
  });
});

describe('interviewSchema', () => {
  it('takes a guide per section and an optional guide per item', () => {
    const file = {
      opener: 'What are you building?',
      sections: [
        {
          id: 'company',
          name: 'The company',
          guide: 'Let them tell the story.',
          checklist: [{ item: 'Company name' }, { item: 'Entity type', guide: 'Suggest C-Corp.' }],
        },
      ],
    };
    expect(interviewSchema.parse(file)).toEqual(file);
    expect(interviewSchema.safeParse({ ...file, opener: undefined }).success).toBe(false);
  });
});

describe('advisorTurnSchema', () => {
  const base = { index: 0, uid: 'user_1', screen: 'screen_1', traceId: null };

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
    expect(jsonSchema.required).toEqual(['type', 'question', 'followupId', 'answer', 'sources']);
    expect(Object.keys(jsonSchema.properties ?? {})).toEqual(jsonSchema.required);
  });

  it('takes a turn message or a btw answer', () => {
    expect(advisorOutputSchema.parse({ message }).message).toEqual(message);
    const answer = { type: 'answer', text: 'Yes.', sources: [] };
    expect(advisorOutputSchema.parse({ message: answer }).message).toEqual(answer);
  });
});

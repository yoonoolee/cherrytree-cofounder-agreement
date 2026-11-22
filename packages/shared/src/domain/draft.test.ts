import { z } from 'zod';

import { agentEditSchema, draftSchema, threadSchema } from './draft.ts';

const timestamp = { toDate: () => new Date(0), toMillis: () => 0 };

const draft = {
  templateVersion: '0.1.0',
  version: 4,
  content: [
    {
      type: 'p',
      id: 'blk_1',
      children: [
        { text: 'Each founder vests over ' },
        { text: 'four', comment: true, comment_c1: true },
        { type: 'a', url: 'https://example.com', children: [{ text: ' years' }] },
      ],
    },
  ],
  updatedAt: timestamp,
};

describe('draftSchema', () => {
  it('accepts a Plate value and keeps the keys Plate owns', () => {
    expect(draftSchema.parse(draft)).toEqual(draft);
  });

  it('requires an id on every top-level block', () => {
    const { id: _id, ...block } = draft.content[0]!;
    expect(draftSchema.safeParse({ ...draft, content: [block] }).success).toBe(false);
  });

  it('rejects a malformed node', () => {
    const block = { type: 'p', id: 'blk_1', children: [{ bold: true }] };
    expect(draftSchema.safeParse({ ...draft, content: [block] }).success).toBe(false);
  });
});

describe('threadSchema', () => {
  it('accepts user and agent messages, an agent one with suggested wording', () => {
    const thread = {
      status: 'open',
      createdBy: 'agent',
      quote: 'Each founder vests over four years',
      messages: [
        {
          author: 'agent',
          uid: null,
          text: 'The vesting terms conflict.',
          suggestion: null,
          sources: [],
          createdAt: timestamp,
        },
        {
          author: 'user',
          uid: 'user_1',
          text: 'Use four years.',
          suggestion: null,
          sources: [],
          createdAt: timestamp,
        },
        {
          author: 'agent',
          uid: null,
          text: 'Here is the wording:',
          suggestion: 'Each Founder vests over four years.',
          sources: [],
          createdAt: timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    expect(threadSchema.parse(thread)).toEqual(thread);
    expect(threadSchema.safeParse({ ...thread, status: 'closed' }).success).toBe(false);
  });
});

describe('agentEditSchema', () => {
  it('accepts an applied rewrite and rejects an unknown status', () => {
    const edit = {
      uid: 'user_1',
      quote: 'four years',
      instruction: 'make it plainer',
      replacement: '4 years',
      message: 'I made it plainer.',
      title: 'Smoothed the wording',
      status: 'applied',
      durationMs: 2400,
      createdAt: timestamp,
    };
    expect(agentEditSchema.parse(edit)).toEqual(edit);
    expect(agentEditSchema.safeParse({ ...edit, status: 'pending' }).success).toBe(false);
  });
});

describe('as JSON Schema', () => {
  it('converts, recursive Plate nodes and timestamps included', () => {
    // `unrepresentable: 'any'` lets z.custom through; timestamps carry their schema in `.meta()`.
    const jsonSchema = z.toJSONSchema(draftSchema, { io: 'output', unrepresentable: 'any' });
    expect(jsonSchema.properties?.updatedAt).toEqual({ type: 'string', format: 'date-time' });
    expect(JSON.stringify(jsonSchema)).toContain('"$ref"');
  });
});

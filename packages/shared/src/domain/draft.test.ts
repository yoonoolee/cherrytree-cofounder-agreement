import { z } from 'zod';

import { draftSchema, suggestionSchema, threadSchema } from './draft.ts';

const timestamp = { toDate: () => new Date(0), toMillis: () => 0 };

const draft = {
  templateVersion: '0.1.0',
  version: 4,
  blockVersions: { blk_1: 2 },
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
  it('accepts user and agent messages', () => {
    const thread = {
      status: 'open',
      createdBy: 'agent',
      messages: [
        {
          author: 'agent',
          uid: null,
          text: 'The vesting terms conflict.',
          sources: [],
          createdAt: timestamp,
        },
        {
          author: 'user',
          uid: 'user_1',
          text: 'Use four years.',
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

describe('suggestionSchema', () => {
  it('accepts each edit op and rejects an unknown status', () => {
    const edit = {
      id: 'e1',
      op: 'replace',
      para: 'blk_1',
      old: 'four',
      new: 'three',
      status: 'pending',
    };
    const suggestion = {
      threadId: 'c1',
      edits: [
        edit,
        { ...edit, id: 'e2', op: 'insert_after', old: null, new: '## Vesting' },
        { ...edit, id: 'e3', op: 'delete', old: null, new: null },
      ],
      createdAt: timestamp,
    };
    expect(suggestionSchema.parse(suggestion)).toEqual(suggestion);
    expect(
      suggestionSchema.safeParse({ ...suggestion, edits: [{ ...edit, status: 'applied' }] })
        .success,
    ).toBe(false);
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

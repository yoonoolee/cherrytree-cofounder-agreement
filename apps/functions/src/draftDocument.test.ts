const logger = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('firebase-functions', () => ({ logger }));

const { draftDocument } = await import('./draftDocument.ts');

function mockRes() {
  const res = {
    status: vi.fn(),
    send: vi.fn(),
    json: vi.fn(),
    on: vi.fn(),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

async function call(body: unknown, method = 'POST') {
  const res = mockRes();
  await draftDocument({ method, headers: {}, body } as never, res as never);
  return res;
}

describe('draftDocument', () => {
  it('converts markdown to Plate blocks with ids', async () => {
    const res = await call({ op: 'from_markdown', markdown: '# Agreement\n\nText.' });
    const { content } = res.json.mock.calls[0]![0] as { content: { id: string; type: string }[] };
    expect(content.map((block) => block.type)).toEqual(['h1', 'p']);
    expect(content.every((block) => block.id)).toBe(true);
  });

  it('applies review fixes and thread anchors', async () => {
    const content = [{ type: 'p', id: 'b1', children: [{ text: 'The founders agree.' }] }];
    const res = await call({
      op: 'apply_review',
      content,
      fixes: [{ op: 'replace', para: 'b1', old: 'founders', new: 'Founders' }],
      threads: [{ threadId: 't1', para: 'b1' }],
    });
    expect(res.json).toHaveBeenCalledWith({
      content: [
        {
          type: 'p',
          id: 'b1',
          children: [{ text: 'The Founders agree.', comment: true, comment_t1: true }],
        },
      ],
    });
  });

  it('answers 422 when a fix does not fit the draft', async () => {
    const res = await call({
      op: 'apply_review',
      content: [{ type: 'p', id: 'b1', children: [{ text: 'Text.' }] }],
      fixes: [{ op: 'delete', para: 'missing', old: null, new: null }],
      threads: [],
    });
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: 'No block with id missing' });
  });

  it.each([
    ['an unknown op', { op: 'render' }],
    ['empty markdown', { op: 'from_markdown', markdown: '' }],
    [
      'a block without an id',
      { op: 'apply_review', content: [{ type: 'p', children: [] }], fixes: [], threads: [] },
    ],
  ])('answers 400 for %s', async (_, body) => {
    const res = await call(body);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('accepts only POST', async () => {
    const res = await call(undefined, 'GET');
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

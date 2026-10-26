import type { AdvisorStreamEvent } from '@cherrytree/shared';

import { AgentError, startAdvisorSession, startDraft, streamAdvisorTurn } from './agent.ts';
import { SESSION_NOT_READY_MESSAGE } from './functions.ts';
import { makeResponse } from '../test/fixtures/advisor.ts';

const mocks = vi.hoisted(() => ({
  getLimitedUseToken: vi.fn(() => Promise.resolve({ token: 'app-check-token' })),
  firebase: {
    appCheck: {} as object | null,
    auth: {
      authStateReady: vi.fn(() => Promise.resolve()),
      currentUser: null as { getIdToken: () => Promise<string> } | null,
    },
  },
}));

vi.mock('firebase/app-check', () => ({ getLimitedUseToken: mocks.getLimitedUseToken }));
vi.mock('./firebase.ts', () => mocks.firebase);
vi.mock('./env.ts', () => ({ env: { agentUrl: 'https://agent.test' } }));

const fetchMock = vi.fn<typeof fetch>();

/** An SSE body that sends `chunks` as written, so events can split across reads. */
function sseResponse(chunks: string[], init: ResponseInit = {}): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { headers: { 'Content-Type': 'text/event-stream' }, ...init });
}

const sse = (event: AdvisorStreamEvent) => `data: ${JSON.stringify(event)}\n\n`;

async function collect(projectId = 'org_1') {
  const events = [];
  for await (const event of streamAdvisorTurn(projectId, { reply: 'Hi', expectedTurnIndex: 2 })) {
    events.push(event);
  }
  return events;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  mocks.firebase.appCheck = {};
  mocks.firebase.auth.currentUser = { getIdToken: () => Promise.resolve('id-token') };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('startAdvisorSession', () => {
  it('posts with the ID token and a limited-use App Check token', async () => {
    fetchMock.mockResolvedValue(Response.json({ turnCount: 3 }));
    await expect(startAdvisorSession('org/1')).resolves.toEqual({ turnCount: 3 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://agent.test/v1/projects/org%2F1/advisor/session',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer id-token',
          'X-Firebase-AppCheck': 'app-check-token',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('refuses to call without a Firebase session', async () => {
    mocks.firebase.auth.currentUser = null;
    await expect(startAdvisorSession('org_1')).rejects.toThrow(SESSION_NOT_READY_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [500, 'temporary'],
  ])('maps HTTP %i to %s', async (status, code) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    await expect(startAdvisorSession('org_1')).rejects.toMatchObject({ code });
  });

  it('maps a network failure to temporary', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(startAdvisorSession('org_1')).rejects.toMatchObject({ code: 'temporary' });
  });
});

describe('startDraft', () => {
  it('posts to the project draft endpoint and returns the queued status', async () => {
    fetchMock.mockResolvedValue(Response.json({ draftStatus: 'queued' }));
    await expect(startDraft('org/1')).resolves.toEqual({ draftStatus: 'queued' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://agent.test/v1/projects/org%2F1/draft');
    expect(init?.method).toBe('POST');
  });

  it('maps 409 (not finished, or already started) to stale', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 409 }));
    await expect(startDraft('org_1')).rejects.toEqual(new AgentError('stale'));
  });
});

describe('streamAdvisorTurn', () => {
  it('sends the reply and yields the events up to done, across split chunks', async () => {
    const response = makeResponse({ answer: 'Common.' });
    const body = [
      sse({ type: 'highlights', highlights: ['Oakland'] }),
      sse({ type: 'answer_delta', text: 'Com' }) + sse({ type: 'answer_delta', text: 'mon.' }),
      sse({ type: 'sources', sources: [] }),
      sse({ type: 'done', index: 2, response }),
    ].join('');
    fetchMock.mockResolvedValue(sseResponse([body.slice(0, 30), body.slice(30)]));

    expect(await collect()).toEqual([
      { type: 'highlights', highlights: ['Oakland'] },
      { type: 'answer_delta', text: 'Com' },
      { type: 'answer_delta', text: 'mon.' },
      { type: 'sources', sources: [] },
      { type: 'done', index: 2, response },
    ]);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://agent.test/v1/projects/org_1/advisor/turns');
    expect(init?.body).toBe(JSON.stringify({ reply: 'Hi', expectedTurnIndex: 2 }));
  });

  it.each(['temporary', 'refusal', 'stale'] as const)('throws an error event %s', async (code) => {
    fetchMock.mockResolvedValue(
      sseResponse([sse({ type: 'highlights', highlights: [] }), sse({ type: 'error', code })]),
    );
    await expect(collect()).rejects.toEqual(new AgentError(code));
  });

  it('treats a stream that ends without done as temporary', async () => {
    fetchMock.mockResolvedValue(sseResponse([sse({ type: 'highlights', highlights: [] })]));
    await expect(collect()).rejects.toMatchObject({ code: 'temporary' });
  });

  it('maps 409 to stale and 429 to rate_limited with Retry-After', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 409 }));
    await expect(collect()).rejects.toMatchObject({ code: 'stale' });

    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { 'Retry-After': '1200' } }),
    );
    await expect(collect()).rejects.toMatchObject({
      code: 'rate_limited',
      retryAfterSeconds: 1200,
    });
  });

  it('rejects a malformed event', async () => {
    fetchMock.mockResolvedValue(sseResponse(['data: {"type":"nope"}\n\n']));
    await expect(collect()).rejects.toThrow();
  });
});

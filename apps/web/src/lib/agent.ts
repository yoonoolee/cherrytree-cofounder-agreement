/**
 * Client for the agent service (apps/agent; contracts in `@cherrytree/shared` → agentApi.ts).
 *
 * The browser calls the service directly rather than through a Hosting rewrite, which would cut
 * a streamed turn off at 60 seconds. Every request carries the Firebase ID token and a
 * limited-use App Check token, which the service consumes so a captured request cannot be
 * replayed.
 */
import { EventSourceParserStream } from 'eventsource-parser/stream';
import { getLimitedUseToken } from 'firebase/app-check';
import {
  advisorSessionResponseSchema,
  advisorStreamEventSchema,
  startDraftResponseSchema,
  type AdvisorBtwRequest,
  type AdvisorSessionResponse,
  type AdvisorStreamEvent,
  type AdvisorTurnErrorCode,
  type AdvisorTurnRequest,
  type StartDraftResponse,
} from '@cherrytree/shared';

import { env } from './env.ts';
import { appCheck, auth } from './firebase.ts';
import { SESSION_NOT_READY_MESSAGE } from './functions.ts';

/**
 * - `AdvisorTurnErrorCode`s as the service reports them (`stale` also as HTTP 409, which starting
 *   the draft also answers when the interview has questions left or a draft already started);
 * - `rate_limited`: too many agent runs this hour (`retryAfterSeconds` says for how long);
 * - `unauthenticated`: a token was missing, invalid or already used;
 * - `forbidden`: the caller is not the project's admin.
 */
export type AgentErrorCode =
  AdvisorTurnErrorCode | 'rate_limited' | 'unauthenticated' | 'forbidden';

export class AgentError extends Error {
  constructor(
    readonly code: AgentErrorCode,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(`Agent service error: ${code}`);
    this.name = 'AgentError';
  }
}

/**
 * Events the caller handles; `done` (a turn) or `btw_done` (a btw) ends the stream, and `error` is
 * thrown as an `AgentError`.
 */
export type AdvisorRunEvent = Exclude<AdvisorStreamEvent, { type: 'error' }>;

async function authHeaders(): Promise<Record<string, string>> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || !appCheck) throw new Error(SESSION_NOT_READY_MESSAGE);
  const [idToken, { token: appCheckToken }] = await Promise.all([
    user.getIdToken(),
    getLimitedUseToken(appCheck),
  ]);
  return { Authorization: `Bearer ${idToken}`, 'X-Firebase-AppCheck': appCheckToken };
}

function errorFor(response: Response): AgentError {
  switch (response.status) {
    case 401:
      return new AgentError('unauthenticated');
    case 403:
      return new AgentError('forbidden');
    case 409:
      return new AgentError('stale');
    case 429: {
      const seconds = Number(response.headers.get('Retry-After'));
      return new AgentError(
        'rate_limited',
        Number.isFinite(seconds) && seconds > 0 ? seconds : null,
      );
    }
    default:
      return new AgentError('temporary');
  }
}

async function post(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  const headers = await authHeaders();
  let response: Response;
  try {
    response = await fetch(`${env.agentUrl}${path}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AgentError('temporary');
  }
  if (!response.ok) throw errorFor(response);
  return response;
}

const projectPath = (projectId: string) => `/v1/projects/${encodeURIComponent(projectId)}`;
const advisorPath = (projectId: string) => `${projectPath(projectId)}/advisor`;

/** Starts the project's Advisor (idempotent); the question list exists once it resolves. */
export async function startAdvisorSession(projectId: string): Promise<AdvisorSessionResponse> {
  const response = await post(`${advisorPath(projectId)}/session`, {});
  return advisorSessionResponseSchema.parse(await response.json());
}

/**
 * Runs one Advisor turn or btw, yielding its events in order up to its done event. Aborting
 * `signal` closes the stream, which cancels the run on the server: nothing is saved.
 */
async function* streamAdvisorRun(
  path: string,
  request: unknown,
  signal?: AbortSignal,
): AsyncGenerator<AdvisorRunEvent> {
  const response = await post(path, request, signal);
  if (!response.body) throw new AgentError('temporary');

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
    .getReader();
  try {
    for (;;) {
      let chunk: ReadableStreamReadResult<{ data: string }>;
      try {
        chunk = await reader.read();
      } catch (error) {
        if (signal?.aborted) throw error;
        throw new AgentError('temporary');
      }
      // The service always ends with a done event or `error`; a stream that just stops was cut off.
      if (chunk.done) throw new AgentError('temporary');

      const event = advisorStreamEventSchema.parse(JSON.parse(chunk.value.data));
      if (event.type === 'error') throw new AgentError(event.code);
      yield event;
      if (event.type === 'done' || event.type === 'btw_done') return;
    }
  } finally {
    // Cancelling propagates through the pipes to the body, so an early exit closes the connection.
    await reader.cancel().catch(() => {});
  }
}

/** A reply to the question on screen. */
export const streamAdvisorTurn = (
  projectId: string,
  request: AdvisorTurnRequest,
  signal?: AbortSignal,
) => streamAdvisorRun(`${advisorPath(projectId)}/turns`, request, signal);

/** A one-off question about selected text. */
export const streamAdvisorBtw = (
  projectId: string,
  request: AdvisorBtwRequest,
  signal?: AbortSignal,
) => streamAdvisorRun(`${advisorPath(projectId)}/btw`, request, signal);

/**
 * Starts Drafting + Review, which closes the Advisor. The job runs in the background; follow
 * `Project.draftStatus` for its progress.
 */
export async function startDraft(projectId: string): Promise<StartDraftResponse> {
  const response = await post(`${projectPath(projectId)}/draft`, {});
  return startDraftResponseSchema.parse(await response.json());
}

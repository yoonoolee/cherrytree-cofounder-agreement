/**
 * Request/response contracts of the agent service (apps/agent, FastAPI on Cloud Run).
 *
 * Every request carries the caller's Firebase ID token (`Authorization: Bearer`) and a
 * limited-use App Check token (`X-Firebase-AppCheck`), which the service consumes. The agent
 * service's Pydantic models are generated from these schemas (npm run generate:agent-types).
 */
import { z } from 'zod';

import { advisorResponseSchema } from './domain/advisor.ts';
import { draftStatusSchema } from './domain/draft.ts';
import { webSourceSchema } from './domain/webSource.ts';

export const ADVISOR_REPLY_MAX_LENGTH = 20_000;

/** `POST /v1/projects/{projectId}/advisor/session` — starts the Advisor, idempotent. */
export const advisorSessionResponseSchema = z.object({
  turnCount: z.number().int(),
});
export type AdvisorSessionResponse = z.infer<typeof advisorSessionResponseSchema>;

/**
 * `POST /v1/projects/{projectId}/advisor/turns` — answered with a stream of `AdvisorStreamEvent`.
 * Before the stream opens: 409 if another turn was saved since, 429 (with `Retry-After`, in
 * seconds) if the user started too many agent runs this hour.
 */
export const advisorTurnRequestSchema = z.object({
  reply: z.string().min(1).max(ADVISOR_REPLY_MAX_LENGTH),
  /** The turn count the browser last saw. The turn saves only if no other turn was saved since. */
  expectedTurnIndex: z.number().int().min(0),
});
export type AdvisorTurnRequest = z.infer<typeof advisorTurnRequestSchema>;

/**
 * - `temporary`: the model call failed after retries; the reply can be sent again.
 * - `refusal`: the model declined; the user should rephrase.
 * - `stale`: another turn was saved first; reload the current question.
 */
export const advisorTurnErrorCodeSchema = z.enum(['temporary', 'refusal', 'stale']);
export type AdvisorTurnErrorCode = z.infer<typeof advisorTurnErrorCodeSchema>;

/**
 * Server-sent events of one turn, in order: `highlights`, `answer_delta`s, `sources`, then `done`
 * once the turn is saved, or `error`. `done` carries the saved response, which is authoritative:
 * the UI shows the question from it (all at once) and replaces the streamed answer with its own.
 */
export const advisorStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('highlights'), highlights: z.array(z.string()) }),
  z.object({ type: z.literal('answer_delta'), text: z.string() }),
  z.object({ type: z.literal('sources'), sources: z.array(webSourceSchema) }),
  z.object({ type: z.literal('done'), index: z.number().int(), response: advisorResponseSchema }),
  z.object({ type: z.literal('error'), code: advisorTurnErrorCodeSchema }),
]);
export type AdvisorStreamEvent = z.infer<typeof advisorStreamEventSchema>;

/**
 * `POST /v1/projects/{projectId}/draft` — starts Drafting + Review once every main question is
 * done or skipped, and closes the Advisor. Answers right away with `queued`; the job runs in the
 * background and the browser follows `Project.draftStatus`. 409 if the interview is not finished
 * or a job already started (starting again is allowed only after `failed`).
 */
export const startDraftResponseSchema = z.object({
  draftStatus: draftStatusSchema,
});
export type StartDraftResponse = z.infer<typeof startDraftResponseSchema>;

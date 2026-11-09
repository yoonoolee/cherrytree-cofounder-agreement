/**
 * Request/response contracts of the agent service (apps/agent, FastAPI on Cloud Run).
 *
 * Every request carries the caller's Firebase ID token (`Authorization: Bearer`) and a
 * limited-use App Check token (`X-Firebase-AppCheck`), which the service consumes. The agent
 * service's Pydantic models are generated from these schemas (npm run generate:agent-types).
 */
import { z } from 'zod';

import {
  advisorMessageSchema,
  btwMessageSchema,
  highlightSchema,
  turnHighlightSchema,
} from './domain/advisor.ts';
import { draftStatusSchema } from './domain/draft.ts';

export const ADVISOR_REPLY_MAX_LENGTH = 20_000;

/** `POST /v1/projects/{projectId}/advisor/session` — starts the Advisor, idempotent. */
export const advisorSessionResponseSchema = z.object({
  turnCount: z.number().int(),
});
export type AdvisorSessionResponse = z.infer<typeof advisorSessionResponseSchema>;

/**
 * `POST /v1/projects/{projectId}/advisor/turns` — answered with a stream of `AdvisorStreamEvent`.
 * Before the stream opens: 409 if another turn or btw was saved since, 429 (with `Retry-After`, in
 * seconds) if the user started too many agent runs this hour.
 */
export const advisorTurnRequestSchema = z.object({
  reply: z.string().min(1).max(ADVISOR_REPLY_MAX_LENGTH),
  /** The turn count the browser last saw. The turn saves only if nothing else was saved since. */
  expectedTurnIndex: z.number().int().min(0),
});
export type AdvisorTurnRequest = z.infer<typeof advisorTurnRequestSchema>;

/** `POST /v1/projects/{projectId}/advisor/btw` — like a turn, for a question about `quote`. */
export const advisorBtwRequestSchema = z.object({
  quote: z.string().min(1).max(ADVISOR_REPLY_MAX_LENGTH),
  question: z.string().min(1).max(ADVISOR_REPLY_MAX_LENGTH),
  expectedTurnIndex: z.number().int().min(0),
});
export type AdvisorBtwRequest = z.infer<typeof advisorBtwRequestSchema>;

/**
 * - `temporary`: the model call failed after retries; the reply can be sent again.
 * - `refusal`: the model declined; the user should rephrase.
 * - `stale`: another turn was saved first; reload the current question.
 */
export const advisorTurnErrorCodeSchema = z.enum(['temporary', 'refusal', 'stale']);
export type AdvisorTurnErrorCode = z.infer<typeof advisorTurnErrorCodeSchema>;

/**
 * Server-sent events of a turn or btw, ending with `done` (a turn) or `btw_done` (a btw) once it is
 * saved, or with `error`, which drops everything streamed before it.
 * - `green_highlight`: a fact noted in this turn's reply, as the model writes it.
 * - `red_highlight`: a follow-up's highlight, as the model writes it. `withdraw_red_highlights`
 *   takes back those of a question list change that was rejected.
 * - `answer_delta`: the message's `answer` (a btw: its `text`) as it is written.
 * `done` and `btw_done` carry the saved message, which is authoritative.
 */
export const advisorStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('green_highlight'), highlight: highlightSchema }),
  z.object({
    type: z.literal('red_highlight'),
    followupId: z.string(),
    highlight: turnHighlightSchema,
  }),
  z.object({ type: z.literal('withdraw_red_highlights'), followupIds: z.array(z.string()) }),
  z.object({ type: z.literal('answer_delta'), text: z.string() }),
  z.object({ type: z.literal('done'), index: z.number().int(), message: advisorMessageSchema }),
  z.object({ type: z.literal('btw_done'), index: z.number().int(), message: btwMessageSchema }),
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

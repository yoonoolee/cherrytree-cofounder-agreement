import { z } from 'zod';

import { timestampSchema } from '../time.ts';
import { webSourceSchema } from './webSource.ts';

/**
 * Advisor Agent data under `projects/{clerkOrgId}`. Written only by the agent service; one turn is
 * saved atomically with its question list and summary changes.
 */

// ---------------------------------------------------------------------------
// Question list
// ---------------------------------------------------------------------------

export const questionStatusSchema = z.enum(['todo', 'current', 'done', 'skipped']);
export type QuestionStatus = z.infer<typeof questionStatusSchema>;

export const questionSourceSchema = z.enum(['initial', 'added_by_agent']);
export type QuestionSource = z.infer<typeof questionSourceSchema>;

/** A main question. Each gets its own screen; follow-ups are not in the list. */
export const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  description: z.string(),
  status: questionStatusSchema,
  source: questionSourceSchema,
  /** The Advisor's notes on the question, such as why it was skipped. */
  advisorNotes: z.string().nullable(),
});
export type Question = z.infer<typeof questionSchema>;

export const questionSectionSchema = z.object({
  /** Keys the section's summary in `AdvisorState.sectionSummaries`. */
  id: z.string(),
  name: z.string(),
  questions: z.array(questionSchema),
});
export type QuestionSection = z.infer<typeof questionSectionSchema>;

/**
 * The initial questions in the repo, copied into `AdvisorState.sections` when a project's first
 * session opens, every question as `todo` from source `initial` with no notes.
 */
export const initialQuestionsSchema = z.object({
  sections: z.array(
    questionSectionSchema.extend({
      questions: z.array(questionSchema.pick({ id: true, text: true, description: true })),
    }),
  ),
});
export type InitialQuestions = z.infer<typeof initialQuestionsSchema>;

// ---------------------------------------------------------------------------
// projects/{clerkOrgId}/advisor/state
// ---------------------------------------------------------------------------

export const advisorStateSchema = z.object({
  /** The live question list, in interview order. */
  sections: z.array(questionSectionSchema),
  /** Markdown summary of each finished section, keyed by section id. */
  sectionSummaries: z.record(z.string(), z.string()),
  /** Number of saved turns. A turn saves only if no other turn was saved since it started. */
  turnCount: z.number().int(),
  updatedAt: timestampSchema,
});
export type AdvisorState = z.infer<typeof advisorStateSchema>;

// ---------------------------------------------------------------------------
// Advisor response (the model's structured output) and turns
// ---------------------------------------------------------------------------

/** Decides the rendering: same screen, new screen, or new section. */
export const advisorQuestionTypeSchema = z.enum(['followup', 'next_question', 'next_section']);
export type AdvisorQuestionType = z.infer<typeof advisorQuestionTypeSchema>;

export const advisorQuestionSchema = z.object({
  type: advisorQuestionTypeSchema,
  text: z.string(),
});
export type AdvisorQuestion = z.infer<typeof advisorQuestionSchema>;

/**
 * One Advisor response, streamed in this order. Every property is required so the output keeps
 * this order (structured outputs emit required properties first).
 */
export const advisorResponseSchema = z.object({
  /** Phrases from the user's message that carry facts, quoted as written. */
  highlights: z.array(z.string()),
  answer: z.string().nullable(),
  sources: z.array(webSourceSchema),
  question: advisorQuestionSchema.nullable(),
});
export type AdvisorResponse = z.infer<typeof advisorResponseSchema>;

/** `projects/{clerkOrgId}/turns/{index}` — what the UI shows of one turn. */
export const advisorTurnSchema = z.object({
  index: z.number().int(),
  /** Clerk user id of the member who replied. */
  uid: z.string(),
  reply: z.string(),
  response: advisorResponseSchema,
  /** Langfuse trace of the turn. */
  traceId: z.string().nullable(),
  createdAt: timestampSchema,
});
export type AdvisorTurn = z.infer<typeof advisorTurnSchema>;

/**
 * `projects/{clerkOrgId}/transcript/{index}` — server-only. The Messages API messages of one turn
 * (user message, assistant blocks, tool calls and results, compaction blocks), replayed on every
 * later turn. Kept apart from the turn so the browser never downloads it.
 */
export const transcriptEntrySchema = z.object({
  index: z.number().int(),
  /**
   * JSON-encoded, so each replay is byte-identical: Firestore maps don't keep key order, and both
   * prompt caching and the model's check that earlier history is unchanged need the same bytes.
   */
  messages: z.string(),
  createdAt: timestampSchema,
});
export type TranscriptEntry = z.infer<typeof transcriptEntrySchema>;

import { z } from 'zod';

import { timestampSchema } from '../time.ts';
import { webSourceSchema } from './webSource.ts';

/**
 * Advisor Agent data under `projects/{clerkOrgId}`. Written only by the agent service; one turn or
 * btw is saved atomically with its question list changes.
 */

// ---------------------------------------------------------------------------
// Highlights
// ---------------------------------------------------------------------------

/** A quoted part of one reply. The model sends the quote; code finds `start` and `end`. */
export const highlightSchema = z.object({
  text: z.string(),
  start: z.number().int(),
  end: z.number().int(),
});
export type Highlight = z.infer<typeof highlightSchema>;

/** A highlight in the reply of turn `turn` (its index). */
export const turnHighlightSchema = highlightSchema.extend({ turn: z.number().int() });
export type TurnHighlight = z.infer<typeof turnHighlightSchema>;

// ---------------------------------------------------------------------------
// Question list
// ---------------------------------------------------------------------------

export const questionStatusSchema = z.enum(['todo', 'current', 'done', 'skipped']);
export type QuestionStatus = z.infer<typeof questionStatusSchema>;

export const questionSourceSchema = z.enum(['initial', 'added_by_agent']);
export type QuestionSource = z.infer<typeof questionSourceSchema>;

/** A follow-up on part of a reply (a red highlight). Done and skipped ones stay in the list. */
export const followupSchema = z.object({
  id: z.string(),
  text: z.string(),
  status: questionStatusSchema,
  highlight: turnHighlightSchema,
});
export type Followup = z.infer<typeof followupSchema>;

/** A main question. Each gets its own screen, where its follow-ups are asked. */
export const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  description: z.string(),
  status: questionStatusSchema,
  source: questionSourceSchema,
  /** The Advisor's notes on the question, such as why it was skipped. */
  advisorNotes: z.string().nullable(),
  followups: z.array(followupSchema),
});
export type Question = z.infer<typeof questionSchema>;

export const questionSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  questions: z.array(questionSchema),
});
export type QuestionSection = z.infer<typeof questionSectionSchema>;

/**
 * The initial questions in the repo, copied into `AdvisorState.sections` when a project's first
 * session opens: every question `todo` (the first one `current`) from source `initial`, with no
 * notes or follow-ups.
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
  /** The live question list, in interview order. One main question is current until the end. */
  sections: z.array(questionSectionSchema),
  /** Number of saved turns and btws. One saves only if no other was saved since it started. */
  turnCount: z.number().int(),
  updatedAt: timestampSchema,
});
export type AdvisorState = z.infer<typeof advisorStateSchema>;

// ---------------------------------------------------------------------------
// Advisor output (the model's structured output) and turns
// ---------------------------------------------------------------------------

/**
 * What the screen does next: ask a follow-up on this screen, move to the next main question (or
 * the first of the next section), or end the interview.
 */
export const advisorMessageTypeSchema = z.enum([
  'followup',
  'next_question',
  'next_section',
  'interview_complete',
]);
export type AdvisorMessageType = z.infer<typeof advisorMessageTypeSchema>;

/**
 * A turn's message. The question's text comes from the question list by `questionId`. Every
 * property is required so structured output keeps this order, and `answer` streams last but one.
 */
export const advisorMessageSchema = z.object({
  type: advisorMessageTypeSchema,
  /** The follow-up or main question asked next; null only for `interview_complete`. */
  questionId: z.string().nullable(),
  /** The Advisor's reply to anything the user asked in their reply, shown before the question. */
  answer: z.string().nullable(),
  sources: z.array(webSourceSchema),
});
export type AdvisorMessage = z.infer<typeof advisorMessageSchema>;

/** A btw's message: the answer to a one-off question about selected text. */
export const btwMessageSchema = z.object({
  type: z.literal('answer'),
  text: z.string(),
  sources: z.array(webSourceSchema),
});
export type BtwMessage = z.infer<typeof btwMessageSchema>;

/** The model's structured output: one schema for turns and btws, so both share the cache. */
export const advisorOutputSchema = z.object({
  message: z.union([advisorMessageSchema, btwMessageSchema]),
});
export type AdvisorOutput = z.infer<typeof advisorOutputSchema>;

const turnBaseSchema = z.object({
  index: z.number().int(),
  /** Clerk user id of the member who sent it. */
  uid: z.string(),
  /** The main question whose screen it was sent from. */
  screen: z.string(),
  /** Langfuse trace of the run. */
  traceId: z.string().nullable(),
  createdAt: timestampSchema,
});

/** A reply to the question on screen. */
export const advisorReplyTurnSchema = turnBaseSchema.extend({
  kind: z.literal('turn'),
  reply: z.string(),
  /** The facts noted in `reply`. */
  greenHighlights: z.array(highlightSchema),
  message: advisorMessageSchema,
});
export type AdvisorReplyTurn = z.infer<typeof advisorReplyTurnSchema>;

/** A one-off question about selected text. Kept for the history; the UI shows it only live. */
export const advisorBtwTurnSchema = turnBaseSchema.extend({
  kind: z.literal('btw'),
  quote: z.string(),
  question: z.string(),
  message: btwMessageSchema,
});
export type AdvisorBtwTurn = z.infer<typeof advisorBtwTurnSchema>;

/** `projects/{clerkOrgId}/turns/{index}` — what the UI shows of one turn or btw. */
export const advisorTurnSchema = z.discriminatedUnion('kind', [
  advisorReplyTurnSchema,
  advisorBtwTurnSchema,
]);
export type AdvisorTurn = z.infer<typeof advisorTurnSchema>;

/**
 * `projects/{clerkOrgId}/transcript/{index}` — server-only. The Messages API messages of one turn
 * or btw (user message, assistant blocks, tool calls and results, compaction blocks), replayed on
 * every later one. Kept apart from the turn so the browser never downloads it.
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

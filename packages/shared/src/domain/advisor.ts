import { z } from 'zod';

import { timestampSchema } from '../time.ts';
import { webSourceSchema } from './webSource.ts';

/**
 * Advisor Agent data under `projects/{clerkOrgId}`. Written only by the agent service; one turn or
 * btw is saved atomically with its checklist and screen changes.
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
// Checklist: what the interview needs to learn
// ---------------------------------------------------------------------------

/**
 * `revisit`: the user doesn't know yet or isn't sure. The Advisor asks again before the end; one
 * still open then becomes a placeholder in the draft.
 */
export const checklistStatusSchema = z.enum(['todo', 'revisit', 'done', 'skipped']);
export type ChecklistStatus = z.infer<typeof checklistStatusSchema>;

export const checklistSourceSchema = z.enum(['initial', 'added_by_agent']);
export type ChecklistSource = z.infer<typeof checklistSourceSchema>;

/** One thing to learn. The Advisor decides what to ask to cover it. */
export const checklistItemSchema = z.object({
  id: z.string(),
  item: z.string(),
  status: checklistStatusSchema,
  source: checklistSourceSchema,
  /**
   * The item's conclusion so far, in the Advisor's words: what was settled, what is still open
   * (revisit), or why it was skipped.
   */
  answer: z.string().nullable(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const checklistSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  checklist: z.array(checklistItemSchema),
});
export type ChecklistSection = z.infer<typeof checklistSectionSchema>;

/**
 * The interview in the repo (`content/interview.json`). Its checklist is copied into
 * `AdvisorState.sections` when a project's first session opens; the section guides and item notes
 * go to the Advisor's system prompt.
 */
export const interviewSchema = z.object({
  /** The first screen's question, shown before the Advisor has run. */
  opener: z.string(),
  sections: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      guide: z.string(),
      checklist: z.array(z.object({ item: z.string(), notes: z.string().optional() })),
    }),
  ),
});
export type Interview = z.infer<typeof interviewSchema>;

// ---------------------------------------------------------------------------
// Screens: the questions the Advisor asked
// ---------------------------------------------------------------------------

export const followupStatusSchema = z.enum(['todo', 'current', 'done', 'skipped']);
export type FollowupStatus = z.infer<typeof followupStatusSchema>;

/**
 * A question asked on a screen after its first reply. Done and skipped ones stay on the screen.
 */
export const followupSchema = z.object({
  id: z.string(),
  text: z.string(),
  status: followupStatusSchema,
  /**
   * The words in a reply it asks about, shown as a numbered red highlight; asked before any
   * follow-up without one. null: it asks about something the replies don't cover yet.
   */
  highlight: turnHighlightSchema.nullable(),
});
export type Followup = z.infer<typeof followupSchema>;

/** One topic of the interview: the question that opens it, and the follow-ups asked on it. */
export const screenSchema = z.object({
  id: z.string(),
  /** The section it belongs to. */
  section: z.string(),
  question: z.string(),
  followups: z.array(followupSchema),
});
export type Screen = z.infer<typeof screenSchema>;

// ---------------------------------------------------------------------------
// projects/{clerkOrgId}/advisor/state
// ---------------------------------------------------------------------------

export const advisorStateSchema = z.object({
  /** The live checklist, in interview order. */
  sections: z.array(checklistSectionSchema),
  /** Every screen so far; the last one is on screen until the interview is complete. */
  screens: z.array(screenSchema).min(1),
  /** No checklist item is left to do, and the Advisor ended the interview. */
  complete: z.boolean(),
  /** Number of saved turns and btws. One saves only if no other was saved since it started. */
  turnCount: z.number().int(),
  updatedAt: timestampSchema,
});
export type AdvisorState = z.infer<typeof advisorStateSchema>;

// ---------------------------------------------------------------------------
// Advisor output (the model's structured output) and turns
// ---------------------------------------------------------------------------

/**
 * What the screen does next: ask a follow-up on this screen, open a new screen in this section or
 * the next one, or end the interview.
 */
export const advisorMessageTypeSchema = z.enum([
  'followup',
  'next_question',
  'next_section',
  'interview_complete',
]);
export type AdvisorMessageType = z.infer<typeof advisorMessageTypeSchema>;

/**
 * A turn's message. Every property is required so structured output keeps this order, and
 * `answer` streams last but one.
 */
export const advisorMessageSchema = z.object({
  type: advisorMessageTypeSchema,
  /** The new screen's question, for `next_question` and `next_section`. */
  question: z.string().nullable(),
  /** The follow-up asked on this screen, for `followup`. */
  followupId: z.string().nullable(),
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
  /** The id of the screen it was sent from. */
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

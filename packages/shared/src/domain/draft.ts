import { z } from 'zod';

import { timestampSchema } from '../time.ts';
import { webSourceSchema } from './webSource.ts';

/**
 * The agreement draft, its comment threads and the agent's edits, under `projects/{clerkOrgId}`.
 * The editor in the browser applies every change with Plate and saves through the agent service,
 * so none of these documents is client-writable.
 */

/** Drafting + Review background job, on the project. `null` until the Advisor finishes. */
export const draftStatusSchema = z.enum(['queued', 'drafting', 'reviewing', 'ready', 'failed']);
export type DraftStatus = z.infer<typeof draftStatusSchema>;

// ---------------------------------------------------------------------------
// Plate value
// ---------------------------------------------------------------------------

/** A Plate leaf. Marks (bold, comment anchors, ...) are extra keys owned by Plate. */
export interface PlateText {
  text: string;
  [key: string]: unknown;
}

/** A Plate element. Block ids come from `NodeIdPlugin`; other keys are owned by Plate. */
export interface PlateElement {
  type: string;
  id?: string;
  children: PlateNode[];
  [key: string]: unknown;
}

export type PlateNode = PlateElement | PlateText;

/** A top-level block (heading, paragraph, ...), always with an id. */
export type DraftBlock = PlateElement & { id: string };

export const plateTextSchema = z.looseObject({ text: z.string() });

const plateChildrenSchema = () => z.array(z.union([plateElementSchema, plateTextSchema]));

export const plateElementSchema: z.ZodType<PlateElement> = z.looseObject({
  type: z.string(),
  id: z.string().optional(),
  get children() {
    return plateChildrenSchema();
  },
});

export const draftBlockSchema: z.ZodType<DraftBlock> = z.looseObject({
  type: z.string(),
  id: z.string(),
  get children() {
    return plateChildrenSchema();
  },
});

// ---------------------------------------------------------------------------
// projects/{clerkOrgId}/draft/current
// ---------------------------------------------------------------------------

export const draftSchema = z.object({
  /** Version of `agreement-template.md` the draft was written from. */
  templateVersion: z.string(),
  /** Bumped on every save; a save based on an older version is rejected. */
  version: z.number().int(),
  /** Plate value. Each comment thread is anchored by a comment mark inside the text. */
  content: z.array(draftBlockSchema),
  updatedAt: timestampSchema,
});
export type Draft = z.infer<typeof draftSchema>;

// ---------------------------------------------------------------------------
// projects/{clerkOrgId}/threads/{commentId}
// ---------------------------------------------------------------------------

/** `deleted` is a soft delete: hidden from members, the agents and finalize. */
export const threadStatusSchema = z.enum(['open', 'resolved', 'deleted']);
export type ThreadStatus = z.infer<typeof threadStatusSchema>;

export const authorSchema = z.enum(['user', 'agent']);
export type Author = z.infer<typeof authorSchema>;

export const threadMessageSchema = z.object({
  author: authorSchema,
  /** Clerk user id of the member who wrote it; `null` for agent messages. */
  uid: z.string().nullable(),
  text: z.string(),
  /** An agent message's proposed wording for the commented text, applied by Approve. */
  suggestion: z.string().nullable(),
  /** Web pages an agent reply used, shown as links. Empty for user messages. */
  sources: z.array(webSourceSchema),
  createdAt: timestampSchema,
});
export type ThreadMessage = z.infer<typeof threadMessageSchema>;

/** A comment thread. The document id is the id of its Plate comment mark in the draft. */
export const threadSchema = z.object({
  status: threadStatusSchema,
  /** `agent` for the Review Agent's open items. */
  createdBy: authorSchema,
  /** The commented text, as it read when the thread started. */
  quote: z.string(),
  messages: z.array(threadMessageSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Thread = z.infer<typeof threadSchema>;

// ---------------------------------------------------------------------------
// projects/{clerkOrgId}/edits/{editId}
// ---------------------------------------------------------------------------

export const agentEditStatusSchema = z.enum(['applied', 'undone']);
export type AgentEditStatus = z.infer<typeof agentEditStatusSchema>;

/**
 * One rewrite the user asked the agent for. The editor applies `replacement` in place of `quote`
 * at once; undoing it puts `quote` back.
 */
export const agentEditSchema = z.object({
  uid: z.string(),
  quote: z.string(),
  instruction: z.string(),
  replacement: z.string(),
  /** What the agent did, in one sentence. */
  message: z.string(),
  /** A short label for the change, such as "Smoothed the wording". */
  title: z.string(),
  status: agentEditStatusSchema,
  /** How long the agent took. */
  durationMs: z.number().int(),
  createdAt: timestampSchema,
});
export type AgentEdit = z.infer<typeof agentEditSchema>;

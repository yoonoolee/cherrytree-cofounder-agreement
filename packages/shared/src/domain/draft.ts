import { z } from 'zod';

import { timestampSchema } from '../time.ts';
import { webSourceSchema } from './webSource.ts';

/**
 * The agreement draft and its comment threads and suggestions, under `projects/{clerkOrgId}`.
 * Every document edit runs Plate's own code; the agent service saves the results, so none of
 * these documents is client-writable.
 */

/** Drafting + Review background job, on the project. `null` until the Advisor finishes. */
export const draftStatusSchema = z.enum(['queued', 'drafting', 'reviewing', 'ready', 'failed']);
export type DraftStatus = z.infer<typeof draftStatusSchema>;

// ---------------------------------------------------------------------------
// Plate value
// ---------------------------------------------------------------------------

/** A Plate leaf. Marks (bold, comments, suggestions, ...) are extra keys owned by Plate. */
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

/** A top-level block (heading, paragraph, ...): the unit agents edit, always with an id. */
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
  /**
   * Per-block version, keyed by block id, bumped by the server when a save changes the block.
   * An agent run whose edited blocks changed during the run restarts.
   */
  blockVersions: z.record(z.string(), z.number().int()),
  /** Plate value. Pending suggestions and thread anchors are marks inside the text. */
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
  messages: z.array(threadMessageSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Thread = z.infer<typeof threadSchema>;

// ---------------------------------------------------------------------------
// projects/{clerkOrgId}/suggestions/{suggestionId}
// ---------------------------------------------------------------------------

/**
 * `replace`: `old` → `new` inside block `para`. `insert_after`: markdown `new` after block `para`.
 * `delete`: removes block `para`.
 */
export const editOpSchema = z.enum(['replace', 'insert_after', 'delete']);
export type EditOp = z.infer<typeof editOpSchema>;

/**
 * `accepted` / `rejected` by the user, `withdrawn` by the agent, `stale` when the user accepts a
 * conflicting edit.
 */
export const editStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'withdrawn', 'stale']);
export type EditStatus = z.infer<typeof editStatusSchema>;

export const editSchema = z.object({
  /** Same id as the edit's suggestion marks in the draft. */
  id: z.string(),
  op: editOpSchema,
  /** Block id the edit targets (`insert_after`: the block it follows). */
  para: z.string(),
  old: z.string().nullable(),
  new: z.string().nullable(),
  status: editStatusSchema,
});
export type Edit = z.infer<typeof editSchema>;

/** The edits one agent run proposed in a thread, shown as tracked changes. */
export const suggestionSchema = z.object({
  threadId: z.string(),
  edits: z.array(editSchema),
  createdAt: timestampSchema,
});
export type Suggestion = z.infer<typeof suggestionSchema>;

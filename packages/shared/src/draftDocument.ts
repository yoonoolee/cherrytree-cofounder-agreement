/**
 * Contract of the `draftDocument` Cloud Function: the Plate document code the agent service runs
 * before the user first opens the draft. Only the agent service's service account may call it
 * (Cloud Run IAM); it writes nothing, the agent service saves the result.
 */
import { z } from 'zod';

import { draftBlockSchema, editSchema } from './domain/draft.ts';

/**
 * One of the Review Agent's first-draft fixes, applied directly. `replace`: `old` (exactly once in
 * block `para`'s text) → `new`. `insert_after`: markdown `new` after block `para`. `delete`:
 * removes block `para`. Every fix targets the text as Drafting wrote it.
 */
export const draftFixSchema = editSchema.pick({ op: true, para: true, old: true, new: true });
export type DraftFix = z.infer<typeof draftFixSchema>;

/** A Review Agent thread, anchored by a comment mark over block `para`. */
export const draftThreadAnchorSchema = z.object({
  threadId: z.string(),
  para: z.string(),
});
export type DraftThreadAnchor = z.infer<typeof draftThreadAnchorSchema>;

/**
 * - `from_markdown`: the Drafting Agent's markdown → a Plate value, every block with an id.
 * - `apply_review`: applies the fixes, then marks each thread's block with its comment.
 *
 * 400 for a malformed request, 422 (with `error`) if a fix or anchor does not fit the draft.
 */
export const draftDocumentRequestSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('from_markdown'), markdown: z.string().min(1) }),
  z.object({
    op: z.literal('apply_review'),
    content: z.array(draftBlockSchema),
    fixes: z.array(draftFixSchema),
    threads: z.array(draftThreadAnchorSchema),
  }),
]);
export type DraftDocumentRequest = z.infer<typeof draftDocumentRequestSchema>;

export const draftDocumentResponseSchema = z.object({
  content: z.array(draftBlockSchema),
});
export type DraftDocumentResponse = z.infer<typeof draftDocumentResponseSchema>;

/**
 * `draftDocument`: Plate document code for the agent service's Drafting + Review job, before the
 * user first opens the draft (contract: `@cherrytree/shared` → draftDocument.ts). Pure: it
 * returns the document and writes nothing; the agent service saves it.
 */
import { draftDocumentRequestSchema, type DraftDocumentResponse } from '@cherrytree/shared';
import { logger } from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';

import { AGENT_SERVICE_OPTIONS } from './config.ts';
import { applyReview, DraftDocumentError, markdownToDraft } from './lib/plate.ts';

export const draftDocument = onRequest({ ...AGENT_SERVICE_OPTIONS }, (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const parsed = draftDocumentRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const request = parsed.data;
  try {
    const content =
      request.op === 'from_markdown'
        ? markdownToDraft(request.markdown)
        : applyReview(request.content, request.fixes, request.threads);
    res.json({ content } satisfies DraftDocumentResponse);
  } catch (error) {
    if (!(error instanceof DraftDocumentError)) throw error;
    logger.warn('Draft document request did not fit the draft', { op: request.op, error });
    res.status(422).json({ error: error.message });
  }
});

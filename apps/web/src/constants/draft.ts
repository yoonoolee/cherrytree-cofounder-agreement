import type { DraftStatus } from '@cherrytree/shared';

import { advisorErrorMessage } from './advisor.ts';
import type { AgentErrorCode } from '../lib/agent.ts';

/** The Drafting + Review job's steps, in order, as the status screen lists them. */
export const DRAFT_STEPS: { statuses: DraftStatus[]; label: string }[] = [
  { statuses: ['queued', 'drafting'], label: 'Writing the agreement from your answers' },
  { statuses: ['reviewing'], label: 'Checking it for consistency and open questions' },
];

export const DRAFT_STATUS_COPY = {
  working: {
    title: 'Writing your draft…',
    body: 'This takes a few minutes. You can close this page; your draft keeps going and will be here when you come back.',
  },
  // Placeholder until the draft editor exists.
  ready: {
    title: 'Your draft is ready.',
    body: 'The editor to read and work on it is coming next.',
  },
  failed: {
    title: "We couldn't write your draft.",
    body: 'Your answers are saved. Try again.',
    action: 'Try again',
  },
};

/** What the user sees when starting the draft fails. */
export function draftErrorMessage(code: AgentErrorCode): string {
  return code === 'stale'
    ? 'Your draft has already started, or the interview has questions left.'
    : advisorErrorMessage(code, null);
}

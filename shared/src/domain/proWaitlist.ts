import type { TimestampLike } from '../time.ts';

/**
 * `proWaitlist/{autoId}` — anonymous Pro-plan interest, created by the marketing pages.
 * Nothing reads it in the app; the Firestore rules pin exactly these fields.
 */
export interface ProWaitlistSignup {
  email: string;
  timestamp: TimestampLike;
  /** Which page/form the signup came from. */
  source: string;
}

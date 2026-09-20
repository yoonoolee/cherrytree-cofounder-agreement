import type { TimestampLike } from '../time.ts';

/**
 * `proWaitlist/{autoId}` — one Pro-plan waitlist signup, written by the web form.
 * The Firestore rules allow exactly these three fields (and require `timestamp` to be
 * the server time).
 */
export interface ProWaitlistSignup {
  email: string;
  timestamp: TimestampLike;
  /** Where the form was shown, e.g. `'upgrade_modal'` or `'payment_modal'`. */
  source: string;
}

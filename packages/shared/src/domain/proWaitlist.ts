import { z } from 'zod';

import { timestampSchema } from '../time.ts';

/**
 * `proWaitlist/{autoId}` — one Pro-plan waitlist signup, written by the web form.
 * The Firestore rules allow exactly these three fields (and require `timestamp` to be
 * the server time).
 */
export const proWaitlistSignupSchema = z.object({
  email: z.string(),
  timestamp: timestampSchema,
  /** Where the form was shown, e.g. `'payment_modal'`. */
  source: z.string(),
});
export type ProWaitlistSignup = z.infer<typeof proWaitlistSignupSchema>;

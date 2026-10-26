import { z } from 'zod';

import { timestampSchema } from '../time.ts';

/**
 * `rateLimits/{clerkUserId}` — server-only. How many agent runs a user started in the current
 * window; the agent service turns away runs over its limit.
 */
export const rateLimitSchema = z.object({
  windowStart: timestampSchema,
  count: z.number().int(),
});
export type RateLimit = z.infer<typeof rateLimitSchema>;

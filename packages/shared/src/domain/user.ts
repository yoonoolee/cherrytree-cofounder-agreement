import { z } from 'zod';

import { timestampSchema } from '../time.ts';

/** `users/{clerkUserId}` — created and kept in sync by the Clerk webhook. */
export const userDocSchema = z.object({
  userId: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  picture: z.string().nullable(),
  createdAt: timestampSchema,
  lastLoginAt: timestampSchema.nullable(),
  deleted: z.boolean(),

  // Written after creation
  /** Set by `createCheckoutSession` on first purchase. */
  stripeCustomerId: z.string().optional(),
  /** Set by the `user.deleted` webhook. */
  deletedAt: timestampSchema.optional(),
});
export type UserDoc = z.infer<typeof userDocSchema>;

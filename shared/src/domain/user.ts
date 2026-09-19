import type { TimestampLike } from '../time.ts';

/**
 * `users/{clerkUserId}` — created and kept in sync by the Clerk webhook.
 *
 * Interfaces are mutable on purpose: the server mutates `doc.data()` in place.
 */
export interface UserDoc {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string | null;
  createdAt: TimestampLike;
  lastLoginAt: TimestampLike | null;
  deleted: boolean;

  // Written after creation
  /** Set by `createCheckoutSession` on first purchase. */
  stripeCustomerId?: string;
  /** Set by `deleteAccount` / the `user.deleted` webhook. */
  deletedAt?: TimestampLike;
  originalEmail?: string;
  name?: string;
}

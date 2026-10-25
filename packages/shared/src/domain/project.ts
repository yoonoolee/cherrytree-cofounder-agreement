import { z } from 'zod';

import { storedDateSchema, timestampSchema } from '../time.ts';

/**
 * `projects/{clerkOrgId}` — the document id is the Clerk organization id.
 * Created by `stripeWebhook` once a checkout completes.
 */

export const planSchema = z.enum(['starter', 'pro']);
export type Plan = z.infer<typeof planSchema>;

/** `admin` talks to the agents, edits the draft and finalizes. */
export const memberRoleSchema = z.enum(['admin']);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const memberSchema = z.object({
  role: memberRoleSchema,
});
export type Member = z.infer<typeof memberSchema>;

/** One Stripe purchase, keyed in `Project.payments` by checkout session id. */
export const paymentSchema = z.object({
  plan: planSchema,
  type: z.literal('initial'),
  stripeCustomerId: z.string().nullable(),
  stripePaymentIntentId: z.string().nullable(),
  amountPaidCents: z.number().nullable(),
  currency: z.string().nullable(),
  receiptUrl: z.string().nullable(),
  purchasedAt: storedDateSchema,
});
export type Payment = z.infer<typeof paymentSchema>;

export const projectSchema = z.object({
  name: z.string(),
  /** Keyed by Clerk user id. A project has exactly one member, the purchaser, as `admin`. */
  members: z.record(z.string(), memberSchema),
  /** Keyed by Clerk user id. */
  onboardingCompleted: z.record(z.string(), z.boolean()),
  currentPlan: planSchema,
  /** Keyed by Stripe checkout session id. */
  payments: z.record(z.string(), paymentSchema),
  createdAt: timestampSchema,
  lastUpdated: timestampSchema,
  lastOpened: timestampSchema,
});
export type Project = z.infer<typeof projectSchema>;

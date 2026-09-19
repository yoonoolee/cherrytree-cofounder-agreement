import type { StoredDate, TimestampLike } from '../time.ts';
import type { SurveyData } from './surveyData.ts';

/**
 * `projects/{clerkOrgId}` — the document id is the Clerk organization id.
 * Fields written at creation (`stripeWebhook`) are required; fields written later are optional.
 * Documents predating a field may still lack it, so reads stay defensive.
 *
 * Interfaces are mutable on purpose: the server mutates `doc.data()` in place.
 */

export type Plan = 'starter' | 'pro';

export type CollaboratorRole = 'admin' | 'collaborator';

/** One membership period. `endAt` is `null` while the collaborator is active. */
export interface CollaboratorHistoryEntry {
  startAt: StoredDate;
  endAt: StoredDate | null;
}

export interface Collaborator {
  role: CollaboratorRole;
  isActive: boolean;
  /** Copied from the user document when the collaborator joins; `''` when unknown. */
  firstName: string;
  lastName: string;
  history: CollaboratorHistoryEntry[];
}

export interface PdfAgreement {
  url: string;
  generatedAt: StoredDate;
  generatedBy: string;
}

/** One Stripe purchase, keyed in `Project.payments` by checkout session id. */
export interface Payment {
  plan: Plan;
  type: 'initial';
  stripeCustomerId: string | null;
  stripePaymentIntentId: string | null;
  amountPaidCents: number | null;
  currency: string | null;
  receiptUrl: string | null;
  purchasedAt: StoredDate;
}

export interface Project {
  name: string;
  /** Clerk user id of the admin. */
  admin: string;
  /** Keyed by Clerk user id. */
  collaborators: Record<string, Collaborator>;
  /** Keyed by Clerk user id; reset to `{}` by the client whenever survey data changes. */
  approvals: Record<string, boolean>;
  /** Keyed by Clerk user id. */
  onboardingCompleted: Record<string, boolean>;
  surveyVersion: string;
  surveyData: Partial<SurveyData>;
  pdfAgreements: PdfAgreement[];
  latestPdfUrl: string | null;
  currentPlan: Plan;
  /** Keyed by Stripe checkout session id. */
  payments: Record<string, Payment>;
  createdAt: TimestampLike;
  /** Locked in at purchase; collaborator changes are refused after it. */
  editDeadline: TimestampLike;
  lastUpdated: TimestampLike;
  lastOpened: TimestampLike;

  // Written after creation
  /** Email of the last editor (client auto-save). */
  lastEditedBy?: string;
  previewPdfUrl?: string;
  previewPdfGeneratedAt?: TimestampLike;
  /** Read by the dashboard but never written (see docs/REFACTOR_PLAN.md). */
  updatedAt?: TimestampLike;
}

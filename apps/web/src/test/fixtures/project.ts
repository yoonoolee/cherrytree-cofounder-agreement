/**
 * Typed builders for the Firestore documents the web app reads. Every builder returns a
 * complete, valid document so a test only spells out what it is about.
 */
import type { Project, TimestampLike } from '@cherrytree/shared';

/** A `Timestamp`-compatible value without pulling the Firestore SDK into unit tests. */
export function timestamp(value: string | Date): TimestampLike {
  const date = new Date(value);
  return { toDate: () => date, toMillis: () => date.getTime() };
}

const ADMIN_ID = 'user_admin';

/** A project as `stripeWebhook` creates it. */
export function makeProject(overrides: Partial<Project> = {}): Project {
  const createdAt = timestamp('2026-01-01T00:00:00Z');
  return {
    name: 'Acme',
    members: { [ADMIN_ID]: { role: 'admin' } },
    onboardingCompleted: { [ADMIN_ID]: false },
    currentPlan: 'starter',
    payments: {},
    createdAt,
    lastUpdated: createdAt,
    lastOpened: createdAt,
    ...overrides,
  };
}

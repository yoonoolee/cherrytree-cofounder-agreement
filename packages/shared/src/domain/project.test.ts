import { normalizeProjectName, projectSchema } from './project.ts';

const timestamp = { toDate: () => new Date(0), toMillis: () => 0 };

/** A project as `stripeWebhook` creates it, read back from Firestore. */
const project = {
  name: 'Acme',
  members: { user_1: { role: 'admin' } },
  onboardingCompleted: { user_1: false },
  currentPlan: 'starter',
  payments: {
    cs_1: {
      plan: 'starter',
      type: 'initial',
      stripeCustomerId: 'cus_1',
      stripePaymentIntentId: null,
      amountPaidCents: 9900,
      currency: 'usd',
      receiptUrl: null,
      purchasedAt: timestamp,
    },
  },
  draftStatus: null,
  createdAt: timestamp,
  lastUpdated: timestamp,
  lastOpened: timestamp,
};

describe('projectSchema', () => {
  it('accepts a project as stripeWebhook creates it', () => {
    expect(projectSchema.parse(project)).toEqual(project);
  });

  it('rejects an unknown member role and a non-Timestamp date', () => {
    expect(
      projectSchema.safeParse({ ...project, members: { user_1: { role: 'viewer' } } }).success,
    ).toBe(false);
    expect(projectSchema.safeParse({ ...project, createdAt: '2026-01-01' }).success).toBe(false);
  });
});

describe('normalizeProjectName', () => {
  it('trims and keeps the raw text, including characters an HTML escape would change', () => {
    expect(normalizeProjectName('  Acme & Co  ')).toBe('Acme & Co');
  });

  it('strips NUL bytes', () => {
    expect(normalizeProjectName('Ac\0me')).toBe('Acme');
  });

  it('caps the length at 100 characters', () => {
    expect(normalizeProjectName('x'.repeat(150))).toHaveLength(100);
  });

  it('returns null for non-strings and names shorter than two characters', () => {
    expect(normalizeProjectName(undefined)).toBeNull();
    expect(normalizeProjectName(42)).toBeNull();
    expect(normalizeProjectName(' a ')).toBeNull();
    expect(normalizeProjectName('')).toBeNull();
  });
});

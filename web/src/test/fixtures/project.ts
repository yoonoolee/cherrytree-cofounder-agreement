/**
 * Typed builders for the Firestore documents the web app reads. Every builder returns a
 * complete, valid document so a test only spells out what it is about.
 */
import {
  INITIAL_FORM_DATA,
  type Collaborator,
  type Project,
  type SurveyData,
  type TimestampLike,
} from '@cherrytree/shared';

/** A `Timestamp`-compatible value without pulling the Firestore SDK into unit tests. */
export function timestamp(value: string | Date): TimestampLike {
  const date = new Date(value);
  return { toDate: () => date, toMillis: () => date.getTime() };
}

export const ADMIN_ID = 'user_admin';
export const MEMBER_ID = 'user_member';

export function makeCollaborator(overrides: Partial<Collaborator> = {}): Collaborator {
  return {
    role: 'collaborator',
    isActive: true,
    firstName: '',
    lastName: '',
    history: [{ startAt: timestamp('2026-01-01T00:00:00Z'), endAt: null }],
    ...overrides,
  };
}

/** Full client-side form state: every key present, defaults from the schema. */
export function makeSurveyData(overrides: Partial<SurveyData> = {}): SurveyData {
  return { ...INITIAL_FORM_DATA, ...overrides };
}

/** A project as `stripeWebhook` creates it, with an admin and one active collaborator. */
export function makeProject(overrides: Partial<Project> = {}): Project {
  const createdAt = timestamp('2026-01-01T00:00:00Z');
  return {
    name: 'Acme',
    admin: ADMIN_ID,
    collaborators: {
      [ADMIN_ID]: makeCollaborator({ role: 'admin', firstName: 'Ada', lastName: 'Lovelace' }),
      [MEMBER_ID]: makeCollaborator({ firstName: 'Grace', lastName: 'Hopper' }),
    },
    approvals: {},
    onboardingCompleted: {},
    surveyVersion: '1.0',
    surveyData: {},
    pdfAgreements: [],
    latestPdfUrl: null,
    currentPlan: 'starter',
    payments: {},
    createdAt,
    editDeadline: timestamp('2026-07-01T00:00:00Z'),
    lastUpdated: createdAt,
    lastOpened: createdAt,
    ...overrides,
  };
}

/** Every collaborator in `ids` has ticked the box. */
export function acknowledgedBy(ids: readonly string[]): Record<string, boolean> {
  return Object.fromEntries(ids.map((id) => [id, true]));
}

/**
 * Survey answers that satisfy every completion rule for the given collaborators
 * (progress 100%, all 10 sections complete). Change one field to test a single rule.
 */
export function completeSurveyData(ids: readonly string[] = [ADMIN_ID, MEMBER_ID]): SurveyData {
  return makeSurveyData({
    companyName: 'Acme',
    entityType: 'C-Corp',
    registeredState: 'Delaware',
    mailingStreet: '1 Main St',
    mailingCity: 'Wilmington',
    mailingState: 'DE',
    mailingZip: '19801',
    companyDescription: 'Widgets',
    industries: ['Software'],
    cofounderCount: String(ids.length),
    cofounders: ids.map((id, index) => ({
      id,
      fullName: `Founder ${index + 1}`,
      title: 'CEO',
      email: `founder${index + 1}@example.com`,
      roles: ['Engineering'],
      rolesOther: '',
    })),
    equityEntries: ids.map((id, index) => ({
      name: `Founder ${index + 1}`,
      percentage: index === 0 ? String(100 - 50 * (ids.length - 1)) : '50',
    })),
    acknowledgeEquityAllocation: acknowledgedBy(ids),
    majorDecisions: ['Raising capital'],
    equityVotingPower: 'Yes',
    tieResolution: 'Mediation',
    acknowledgeTieResolution: acknowledgedBy(ids),
    includeShotgunClause: 'Yes',
    acknowledgeShotgunClause: acknowledgedBy(ids),
    vestingStartDate: '2026-01-01',
    vestingSchedule: '4 years',
    cliffPercentage: '25',
    accelerationTrigger: 'Yes',
    sharesSellNoticeDays: '30',
    sharesBuybackDays: '60',
    acknowledgeForfeiture: acknowledgedBy(ids),
    vestedSharesDisposal: 'Buyback',
    hasPreExistingIP: 'No',
    acknowledgeIPOwnership: acknowledgedBy(ids),
    takingCompensation: 'No',
    spendingLimit: '1000',
    performanceConsequences: ['Warning'],
    remedyPeriodDays: '30',
    terminationWithCause: ['Fraud'],
    voluntaryNoticeDays: '30',
    acknowledgeConfidentiality: acknowledgedBy(ids),
    nonCompeteDuration: '1 year',
    nonSolicitDuration: '1 year',
    disputeResolution: 'Mediation',
    governingLaw: 'Delaware',
    amendmentProcess: 'Unanimous',
    reviewFrequencyMonths: '12',
    acknowledgePeriodicReview: acknowledgedBy(ids),
    acknowledgeAmendmentReviewRequest: acknowledgedBy(ids),
    acknowledgeEntireAgreement: acknowledgedBy(ids),
    acknowledgeSeverability: acknowledgedBy(ids),
  });
}

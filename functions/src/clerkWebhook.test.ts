import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { fakeCollection, type FakeCollection } from '../test/helpers/fakeFirestore.ts';

const verify = vi.hoisted(() => vi.fn());
const authMock = vi.hoisted(() => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));
const collections = vi.hoisted(() => ({
  users: null as unknown as FakeCollection,
  projects: null as unknown as FakeCollection,
}));
const logger = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn() }));

vi.mock('svix', () => ({
  Webhook: class WebhookMock {
    constructor(public secret: string) {}
    verify(payload: unknown, headers: unknown) {
      return verify(this.secret, payload, headers);
    }
  },
}));
vi.mock('firebase-functions', () => ({ logger }));
vi.mock('./lib/firebase.ts', () => ({
  auth: authMock,
  get users() {
    return collections.users;
  },
  get projects() {
    return collections.projects;
  },
}));

const { clerkWebhook } = await import('./clerkWebhook.ts');

const USER = 'user_1';
const ORG = 'org_1';
const SVIX = { 'svix-id': 'msg_1', 'svix-timestamp': '1700000000', 'svix-signature': 'v1,abc' };

function mockRes() {
  const res = {
    status: vi.fn(),
    send: vi.fn(),
    json: vi.fn(),
    on: vi.fn(),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

async function deliver(event: unknown, headers: Record<string, string> = SVIX) {
  const rawBody = Buffer.from('{"exact":"bytes"}');
  verify.mockReturnValue(event);
  const res = mockRes();
  await clerkWebhook(
    { method: 'POST', headers, rawBody, body: { parsed: true } } as never,
    res as never,
  );
  return { res, rawBody };
}

function clerkUser(overrides: Record<string, unknown> = {}) {
  return {
    id: USER,
    first_name: 'Ada',
    last_name: 'Lovelace',
    image_url: 'https://img.clerk.com/ada.png',
    primary_email_address_id: 'idn_primary',
    email_addresses: [
      { id: 'idn_old', email_address: 'old@example.com', verification: null },
      {
        id: 'idn_primary',
        email_address: 'ada@example.com',
        verification: { status: 'verified' },
      },
    ],
    created_at: 1_700_000_000_000,
    last_sign_in_at: 1_700_000_500_000,
    ...overrides,
  };
}

function membership(userId = USER) {
  return { organization: { id: ORG }, public_user_data: { user_id: userId } };
}

function project(overrides: Record<string, unknown> = {}) {
  return {
    admin: 'user_admin',
    collaborators: {
      user_admin: {
        role: 'admin',
        isActive: true,
        firstName: 'Grace',
        lastName: 'Hopper',
        history: [{ startAt: new Date(0), endAt: null }],
      },
    },
    approvals: { user_admin: true },
    onboardingCompleted: { user_admin: true },
    surveyData: {
      companyName: 'Acme',
      acknowledgeEquityAllocation: { user_admin: true },
      acknowledgeTieResolution: { user_admin: false },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CLERK_WEBHOOK_SECRET = 'whsec_clerk';
  collections.users = fakeCollection();
  collections.projects = fakeCollection({ [ORG]: project() });
  authMock.createUser.mockResolvedValue({});
  authMock.updateUser.mockResolvedValue({});
  authMock.deleteUser.mockResolvedValue(undefined);
});

describe('clerkWebhook endpoint', () => {
  it('rejects requests without the svix headers', async () => {
    const { res } = await deliver({ type: 'user.created' }, { 'svix-id': 'msg_1' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(verify).not.toHaveBeenCalled();
  });

  it('verifies the signature over the raw body, not the parsed JSON', async () => {
    const { res, rawBody } = await deliver({ type: 'session.created', data: {} });
    expect(verify).toHaveBeenCalledWith('whsec_clerk', rawBody, SVIX);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('rejects a failed verification', async () => {
    verify.mockImplementation(() => {
      throw new Error('No matching signature found');
    });
    const res = mockRes();
    await clerkWebhook(
      { method: 'POST', headers: SVIX, rawBody: Buffer.from('{}'), body: {} } as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(authMock.createUser).not.toHaveBeenCalled();
  });

  it('returns 500 when a handler fails so Svix redelivers', async () => {
    collections.users.doc(USER).set.mockRejectedValue(new Error('Firestore unavailable'));
    const { res } = await deliver({ type: 'user.created', data: clerkUser() });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('user.created', () => {
  it('creates the Firebase Auth user and the user document from the primary email', async () => {
    const { res } = await deliver({ type: 'user.created', data: clerkUser() });

    expect(authMock.createUser).toHaveBeenCalledWith({
      uid: USER,
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      photoURL: 'https://img.clerk.com/ada.png',
      emailVerified: true,
    });
    expect(collections.users.store.get(USER)).toEqual({
      userId: USER,
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      picture: 'https://img.clerk.com/ada.png',
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
      lastLoginAt: Timestamp.fromMillis(1_700_000_500_000),
      deleted: false,
    });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('derives the display name from the email and reports unverified addresses', async () => {
    await deliver({
      type: 'user.created',
      data: clerkUser({
        first_name: null,
        last_name: null,
        image_url: '',
        last_sign_in_at: null,
        email_addresses: [
          { id: 'idn_primary', email_address: 'ada@example.com', verification: null },
        ],
      }),
    });

    expect(authMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'ada', photoURL: null, emailVerified: false }),
    );
    expect(collections.users.store.get(USER)).toMatchObject({
      firstName: '',
      lastName: '',
      picture: null,
      lastLoginAt: Timestamp.fromMillis(1_700_000_000_000),
    });
  });

  it('tolerates a redelivery where the Auth user already exists', async () => {
    authMock.createUser.mockRejectedValue({ code: 'auth/uid-already-exists' });
    const { res } = await deliver({ type: 'user.created', data: clerkUser() });

    expect(logger.error).not.toHaveBeenCalled();
    expect(collections.users.store.has(USER)).toBe(true);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('ignores users without a primary email', async () => {
    await deliver({ type: 'user.created', data: clerkUser({ primary_email_address_id: null }) });
    expect(authMock.createUser).not.toHaveBeenCalled();
    expect(collections.users.store.size).toBe(0);
  });
});

describe('user.updated', () => {
  it('updates the Auth user and merges the user document', async () => {
    collections.users = fakeCollection({
      [USER]: { userId: USER, createdAt: 'kept', stripeCustomerId: 'cus_1', deleted: false },
    });

    await deliver({ type: 'user.updated', data: clerkUser({ first_name: 'Augusta' }) });

    expect(authMock.updateUser).toHaveBeenCalledWith(USER, {
      email: 'ada@example.com',
      displayName: 'Augusta Lovelace',
      photoURL: 'https://img.clerk.com/ada.png',
      emailVerified: true,
    });
    expect(collections.users.doc(USER).set).toHaveBeenCalledWith(expect.anything(), {
      merge: true,
    });
    expect(collections.users.store.get(USER)).toMatchObject({
      firstName: 'Augusta',
      createdAt: 'kept',
      stripeCustomerId: 'cus_1',
      lastLoginAt: Timestamp.fromMillis(1_700_000_500_000),
    });
  });

  it('creates the Auth user when it does not exist yet', async () => {
    authMock.updateUser.mockRejectedValue({ code: 'auth/user-not-found' });
    await deliver({ type: 'user.updated', data: clerkUser() });

    expect(authMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ uid: USER, email: 'ada@example.com' }),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('user.deleted', () => {
  it('deletes the Auth user and flags an existing document', async () => {
    collections.users = fakeCollection({ [USER]: { userId: USER, deleted: false } });

    await deliver({ type: 'user.deleted', data: { id: USER, deleted: true } });

    expect(authMock.deleteUser).toHaveBeenCalledWith(USER);
    expect(collections.users.store.get(USER)).toEqual({
      userId: USER,
      deleted: true,
      deletedAt: FieldValue.serverTimestamp(),
    });
  });

  it('does not create a document for an unknown user and survives a missing Auth user', async () => {
    authMock.deleteUser.mockRejectedValue({ code: 'auth/user-not-found' });
    const { res } = await deliver({ type: 'user.deleted', data: { id: USER, deleted: true } });

    expect(collections.users.store.size).toBe(0);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });
});

describe('organizationMembership.created', () => {
  it('adds a new collaborator with names, flags and acknowledgment slots', async () => {
    collections.users = fakeCollection({ [USER]: { firstName: 'Ada', lastName: 'Lovelace' } });

    await deliver({ type: 'organizationMembership.created', data: membership() });

    const update = collections.projects.doc(ORG).update.mock.calls[0]![0];
    expect(update).toEqual({
      collaborators: {
        user_admin: expect.objectContaining({ role: 'admin' }),
        [USER]: {
          role: 'collaborator',
          isActive: true,
          firstName: 'Ada',
          lastName: 'Lovelace',
          history: [{ startAt: expect.any(Date), endAt: null }],
        },
      },
      approvals: { user_admin: true, [USER]: false },
      onboardingCompleted: { user_admin: true, [USER]: false },
      surveyData: {
        companyName: 'Acme',
        acknowledgeEquityAllocation: { user_admin: true, [USER]: false },
        acknowledgeForfeiture: { [USER]: false },
        acknowledgeIPOwnership: { [USER]: false },
        acknowledgeConfidentiality: { [USER]: false },
        acknowledgePeriodicReview: { [USER]: false },
        acknowledgeAmendmentReviewRequest: { [USER]: false },
        acknowledgeEntireAgreement: { [USER]: false },
        acknowledgeSeverability: { [USER]: false },
        // Conditional map present → slot added; absent conditional maps stay absent.
        acknowledgeTieResolution: { user_admin: false, [USER]: false },
      },
      lastUpdated: FieldValue.serverTimestamp(),
    });
  });

  it('re-activates a returning collaborator with a new history period', async () => {
    collections.projects = fakeCollection({
      [ORG]: project({
        collaborators: {
          [USER]: {
            role: 'collaborator',
            isActive: false,
            firstName: 'Old',
            lastName: 'Name',
            history: [{ startAt: new Date(0), endAt: new Date(1) }],
          },
        },
        onboardingCompleted: { [USER]: true },
      }),
    });
    collections.users = fakeCollection({ [USER]: { firstName: 'Ada', lastName: 'Lovelace' } });

    await deliver({ type: 'organizationMembership.created', data: membership() });

    const update = collections.projects.doc(ORG).update.mock.calls[0]![0];
    expect(update.collaborators[USER]).toEqual({
      role: 'collaborator',
      isActive: true,
      firstName: 'Ada',
      lastName: 'Lovelace',
      history: [
        { startAt: new Date(0), endAt: new Date(1) },
        { startAt: expect.any(Date), endAt: null },
      ],
    });
    // Completed onboarding is not reset.
    expect(update.onboardingCompleted[USER]).toBe(true);
  });

  it('is idempotent for an already-active collaborator', async () => {
    collections.projects = fakeCollection({
      [ORG]: project({
        collaborators: {
          [USER]: {
            role: 'collaborator',
            isActive: true,
            firstName: 'Ada',
            lastName: 'Lovelace',
            history: [{ startAt: new Date(0), endAt: null }],
          },
        },
      }),
    });

    await deliver({ type: 'organizationMembership.created', data: membership() });

    const update = collections.projects.doc(ORG).update.mock.calls[0]![0];
    expect(update.collaborators[USER].history).toHaveLength(1);
  });

  it('uses empty names when the user document is missing and ignores unknown projects', async () => {
    await deliver({ type: 'organizationMembership.created', data: membership() });
    expect(
      collections.projects.doc(ORG).update.mock.calls[0]![0].collaborators[USER],
    ).toMatchObject({ firstName: '', lastName: '' });

    collections.projects = fakeCollection();
    const { res } = await deliver({ type: 'organizationMembership.created', data: membership() });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });
});

describe('organizationMembership.deleted', () => {
  it('closes the history period and removes approvals and acknowledgments', async () => {
    collections.projects = fakeCollection({
      [ORG]: project({
        collaborators: {
          user_admin: project().collaborators.user_admin,
          [USER]: {
            role: 'collaborator',
            isActive: true,
            firstName: 'Ada',
            lastName: 'Lovelace',
            history: [{ startAt: new Date(0), endAt: null }],
          },
        },
        approvals: { user_admin: true, [USER]: true },
        surveyData: {
          companyName: 'Acme',
          acknowledgeEquityAllocation: { user_admin: true, [USER]: true },
          acknowledgeTieResolution: { user_admin: false, [USER]: true },
        },
      }),
    });

    await deliver({ type: 'organizationMembership.deleted', data: membership() });

    const update = collections.projects.doc(ORG).update.mock.calls[0]![0];
    expect(update).toEqual({
      collaborators: {
        user_admin: expect.objectContaining({ role: 'admin' }),
        [USER]: expect.objectContaining({
          isActive: false,
          history: [{ startAt: new Date(0), endAt: expect.any(Date) }],
        }),
      },
      approvals: { user_admin: true },
      surveyData: {
        companyName: 'Acme',
        acknowledgeEquityAllocation: { user_admin: true },
        acknowledgeTieResolution: { user_admin: false },
      },
      lastUpdated: FieldValue.serverTimestamp(),
    });
  });

  it('is a no-op update for a user who was never a collaborator', async () => {
    await deliver({ type: 'organizationMembership.deleted', data: membership('user_ghost') });
    const update = collections.projects.doc(ORG).update.mock.calls[0]![0];
    expect(update.collaborators).toEqual(project().collaborators);
    expect(update.approvals).toEqual({ user_admin: true });
  });
});

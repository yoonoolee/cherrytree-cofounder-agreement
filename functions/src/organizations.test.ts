import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

import { fakeCollection, type FakeCollection } from '../test/helpers/fakeFirestore.ts';

const clerk = vi.hoisted(() => ({
  getOrganizationMembershipList: vi.fn(),
  createOrganizationInvitation: vi.fn(),
  deleteOrganizationMembership: vi.fn(),
}));
const collections = vi.hoisted(() => ({ projects: null as unknown as FakeCollection }));

vi.mock('@clerk/backend', () => ({
  createClerkClient: () => ({ organizations: clerk }),
  verifyToken: vi.fn(),
}));
vi.mock('firebase-functions', () => ({ logger: { error: vi.fn() } }));
vi.mock('./lib/firebase.ts', () => ({
  get projects() {
    return collections.projects;
  },
}));

const { createOrganizationInvitation, removeOrganizationMember } =
  await import('./organizations.ts');

const ORG = 'org_1';
const ADMIN = 'user_admin';
const MEMBER = 'user_member';
const APP_ORIGIN = 'https://app.example.com';

function membership(userId: string, role: string) {
  return { id: `orgmem_${userId}`, role, publicUserData: { userId } };
}

function timestamp(date: Date) {
  return { toDate: () => date, toMillis: () => date.getTime() };
}

function call(uid: string | undefined, data: unknown, origin?: string): CallableRequest<never> {
  return {
    data: data as never,
    auth: uid ? { uid, token: {} as never, rawToken: 'id-token' } : undefined,
    rawRequest: { headers: origin ? { origin } : {} } as never,
    acceptsStreaming: false,
  };
}

async function failure(promise: Promise<unknown>): Promise<HttpsError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof HttpsError) return error;
    throw new Error(`not an HttpsError: ${String(error)}`, { cause: error });
  }
  throw new Error('expected the call to fail');
}

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const past = new Date('2026-01-15T12:00:00Z');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CLERK_SECRET_KEY = 'sk_clerk_x';
  process.env.APP_ORIGIN = APP_ORIGIN;
  collections.projects = fakeCollection({ [ORG]: { editDeadline: timestamp(future) } });
  clerk.getOrganizationMembershipList.mockResolvedValue({
    data: [membership(ADMIN, 'org:admin'), membership(MEMBER, 'org:member')],
  });
  clerk.createOrganizationInvitation.mockResolvedValue({ id: 'orginv_1' });
  clerk.deleteOrganizationMembership.mockResolvedValue({});
});

describe('createOrganizationInvitation', () => {
  const data = { emailAddress: 'new@example.com', organizationId: ORG };

  it('rejects unauthenticated callers and bad input', async () => {
    expect((await failure(createOrganizationInvitation.run(call(undefined, data)))).code).toBe(
      'unauthenticated',
    );
    expect(
      (await failure(createOrganizationInvitation.run(call(ADMIN, { organizationId: ORG })))).code,
    ).toBe('invalid-argument');
    expect(
      (await failure(createOrganizationInvitation.run(call(ADMIN, { emailAddress: 'a@b.co' }))))
        .code,
    ).toBe('invalid-argument');
    expect(
      (
        await failure(
          createOrganizationInvitation.run(call(ADMIN, { ...data, emailAddress: 'not-an-email' })),
        )
      ).message,
    ).toBe('Invalid email address format');
    expect(clerk.createOrganizationInvitation).not.toHaveBeenCalled();
  });

  it('requires the caller (from request.auth) to be an org admin', async () => {
    expect((await failure(createOrganizationInvitation.run(call(MEMBER, data)))).message).toBe(
      'Only organization admins can invite members',
    );
    expect((await failure(createOrganizationInvitation.run(call('user_x', data)))).message).toBe(
      'You must be a member of this organization to invite others',
    );
    expect(clerk.createOrganizationInvitation).not.toHaveBeenCalled();
  });

  it('refuses once the edit window has expired', async () => {
    collections.projects = fakeCollection({ [ORG]: { editDeadline: timestamp(past) } });

    const error = await failure(createOrganizationInvitation.run(call(ADMIN, data)));
    expect(error.code).toBe('permission-denied');
    expect(error.message).toMatch(/edit window expired on January 1[45], 2026/);
  });

  it('invites as a member with the redirect on the app origin, ignoring client role and origin', async () => {
    const result = await createOrganizationInvitation.run(
      call(
        ADMIN,
        { ...data, role: 'org:admin', redirectUrl: 'https://evil.example' },
        'https://evil.example',
      ),
    );

    expect(clerk.createOrganizationInvitation).toHaveBeenCalledWith({
      organizationId: ORG,
      emailAddress: 'new@example.com',
      role: 'org:member',
      redirectUrl: `${APP_ORIGIN}/accept-invite`,
    });
    expect(result).toEqual({
      success: true,
      invitationId: 'orginv_1',
      redirectUrl: `${APP_ORIGIN}/accept-invite`,
    });
  });

  it('keeps the local dev server as the redirect origin', async () => {
    await createOrganizationInvitation.run(call(ADMIN, data, 'http://localhost:3000'));
    expect(clerk.createOrganizationInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ redirectUrl: 'http://localhost:3000/accept-invite' }),
    );
  });

  it('skips the edit-window check for projects without a deadline', async () => {
    collections.projects = fakeCollection({ [ORG]: {} });
    await expect(createOrganizationInvitation.run(call(ADMIN, data))).resolves.toMatchObject({
      success: true,
    });
  });

  it('hides Clerk errors behind an internal error', async () => {
    clerk.createOrganizationInvitation.mockRejectedValue(new Error('Unprocessable Entity'));
    const error = await failure(createOrganizationInvitation.run(call(ADMIN, data)));
    expect(error.code).toBe('internal');
    expect(error.message).toBe('Failed to create organization invitation');
  });
});

describe('removeOrganizationMember', () => {
  const data = { userId: MEMBER, organizationId: ORG };

  it('rejects unauthenticated callers and missing ids', async () => {
    expect((await failure(removeOrganizationMember.run(call(undefined, data)))).code).toBe(
      'unauthenticated',
    );
    expect(
      (await failure(removeOrganizationMember.run(call(ADMIN, { organizationId: ORG })))).message,
    ).toBe('User ID is required');
    expect(
      (await failure(removeOrganizationMember.run(call(ADMIN, { userId: MEMBER })))).message,
    ).toBe('Organization ID is required');
  });

  it('only an org admin may remove members', async () => {
    expect(
      (await failure(removeOrganizationMember.run(call(MEMBER, { ...data, userId: ADMIN })))).code,
    ).toBe('permission-denied');
    expect(clerk.deleteOrganizationMembership).not.toHaveBeenCalled();
  });

  it('refuses once the edit window has expired', async () => {
    collections.projects = fakeCollection({ [ORG]: { editDeadline: timestamp(past) } });
    expect((await failure(removeOrganizationMember.run(call(ADMIN, data)))).code).toBe(
      'permission-denied',
    );
  });

  it('prevents the admin from removing themselves', async () => {
    const error = await failure(
      removeOrganizationMember.run(call(ADMIN, { ...data, userId: ADMIN })),
    );
    expect(error.code).toBe('invalid-argument');
    expect(clerk.deleteOrganizationMembership).not.toHaveBeenCalled();
  });

  it('returns not-found for a user who is not a member', async () => {
    expect(
      (await failure(removeOrganizationMember.run(call(ADMIN, { ...data, userId: 'user_x' }))))
        .code,
    ).toBe('not-found');
  });

  it('removes the membership', async () => {
    await expect(removeOrganizationMember.run(call(ADMIN, data))).resolves.toEqual({
      success: true,
    });
    expect(clerk.deleteOrganizationMembership).toHaveBeenCalledWith({
      organizationId: ORG,
      userId: MEMBER,
    });
  });
});

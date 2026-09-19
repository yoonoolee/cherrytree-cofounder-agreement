import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

import { getClerkPrimaryEmail, requireAuth, verifyClerkToken } from './auth.ts';

const { getUser, verifyToken } = vi.hoisted(() => ({
  getUser: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock('@clerk/backend', () => ({
  createClerkClient: () => ({ users: { getUser } }),
  verifyToken,
}));

vi.mock('firebase-functions', () => ({ logger: { error: vi.fn() } }));

const clerkUser = {
  id: 'user_1',
  primaryEmailAddressId: 'idn_primary',
  emailAddresses: [
    { id: 'idn_other', emailAddress: 'old@example.com' },
    { id: 'idn_primary', emailAddress: 'founder@example.com' },
  ],
};

function request(auth: CallableRequest['auth']): CallableRequest<unknown> {
  return { data: {}, auth, rawRequest: {} as never, acceptsStreaming: false };
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof HttpsError ? error.code : `not an HttpsError: ${String(error)}`;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireAuth', () => {
  it('returns the Firebase uid (the Clerk user id)', () => {
    expect(requireAuth(request({ uid: 'user_1', token: {} as never, rawToken: 'id-token' }))).toBe(
      'user_1',
    );
  });

  it('throws unauthenticated without a verified caller', () => {
    expect(() => requireAuth(request(undefined))).toThrow(HttpsError);
    expect(() => requireAuth(request(undefined))).toThrow('signed in');
  });
});

describe('getClerkPrimaryEmail', () => {
  it('returns the primary address, not the first one', async () => {
    getUser.mockResolvedValue(clerkUser);
    await expect(getClerkPrimaryEmail('user_1')).resolves.toBe('founder@example.com');
    expect(getUser).toHaveBeenCalledWith('user_1');
  });

  it('throws unauthenticated when the user or the primary address is missing', async () => {
    getUser.mockResolvedValue(null);
    expect(await codeOf(getClerkPrimaryEmail('user_1'))).toBe('unauthenticated');

    getUser.mockResolvedValue({ ...clerkUser, primaryEmailAddressId: 'idn_missing' });
    expect(await codeOf(getClerkPrimaryEmail('user_1'))).toBe('unauthenticated');
  });
});

describe('verifyClerkToken', () => {
  it('returns the user id and email for a valid token', async () => {
    verifyToken.mockResolvedValue({ sub: 'user_1' });
    getUser.mockResolvedValue(clerkUser);

    await expect(verifyClerkToken('jwt')).resolves.toEqual({
      userId: 'user_1',
      email: 'founder@example.com',
    });
  });

  it('rejects a missing or non-string token without calling Clerk', async () => {
    expect(await codeOf(verifyClerkToken(undefined))).toBe('unauthenticated');
    expect(await codeOf(verifyClerkToken(42))).toBe('unauthenticated');
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('maps verification failures and payloads without a subject to unauthenticated', async () => {
    verifyToken.mockRejectedValue(new Error('expired'));
    expect(await codeOf(verifyClerkToken('jwt'))).toBe('unauthenticated');

    verifyToken.mockResolvedValue({});
    expect(await codeOf(verifyClerkToken('jwt'))).toBe('unauthenticated');
    expect(getUser).not.toHaveBeenCalled();
  });
});

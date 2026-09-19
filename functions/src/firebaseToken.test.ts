import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

const clerk = vi.hoisted(() => ({ getUser: vi.fn(), verifyToken: vi.fn() }));
const createCustomToken = vi.hoisted(() => vi.fn());

vi.mock('@clerk/backend', () => ({
  createClerkClient: () => ({ users: { getUser: clerk.getUser } }),
  verifyToken: clerk.verifyToken,
}));
vi.mock('firebase-functions', () => ({ logger: { error: vi.fn() } }));
vi.mock('./lib/firebase.ts', () => ({ auth: { createCustomToken } }));

const { getFirebaseToken } = await import('./firebaseToken.ts');

function call(data: unknown, app?: CallableRequest['app']): CallableRequest<never> {
  return { data: data as never, app, rawRequest: {} as never, acceptsStreaming: false };
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
  process.env.CLERK_SECRET_KEY = 'sk_clerk_x';
  clerk.verifyToken.mockResolvedValue({ sub: 'user_1' });
  clerk.getUser.mockResolvedValue({
    id: 'user_1',
    primaryEmailAddressId: 'idn_1',
    emailAddresses: [{ id: 'idn_1', emailAddress: 'founder@example.com' }],
  });
  createCustomToken.mockResolvedValue('firebase-custom-token');
});

describe('getFirebaseToken', () => {
  it('mints a Firebase custom token whose uid is the Clerk user id', async () => {
    await expect(getFirebaseToken.run(call({ sessionToken: 'clerk-jwt' }))).resolves.toEqual({
      firebaseToken: 'firebase-custom-token',
      userId: 'user_1',
    });
    expect(clerk.verifyToken).toHaveBeenCalledWith('clerk-jwt', { secretKey: 'sk_clerk_x' });
    expect(createCustomToken).toHaveBeenCalledWith('user_1');
  });

  it('rejects a replayed App Check token before touching Clerk', async () => {
    const replayed = { appId: '1:123:web:abc', token: {} as never, alreadyConsumed: true };
    expect(await codeOf(getFirebaseToken.run(call({ sessionToken: 'clerk-jwt' }, replayed)))).toBe(
      'permission-denied',
    );
    expect(clerk.verifyToken).not.toHaveBeenCalled();
    expect(createCustomToken).not.toHaveBeenCalled();
  });

  it('requires a session token', async () => {
    expect(await codeOf(getFirebaseToken.run(call({})))).toBe('invalid-argument');
    expect(await codeOf(getFirebaseToken.run(call(undefined)))).toBe('invalid-argument');
    expect(createCustomToken).not.toHaveBeenCalled();
  });

  it('rejects an invalid Clerk token before minting anything', async () => {
    clerk.verifyToken.mockRejectedValue(new Error('invalid signature'));
    expect(await codeOf(getFirebaseToken.run(call({ sessionToken: 'bad' })))).toBe(
      'unauthenticated',
    );
    expect(createCustomToken).not.toHaveBeenCalled();
  });

  it('hides Firebase Auth failures behind an internal error', async () => {
    createCustomToken.mockRejectedValue(new Error('IAM permission denied for service account'));
    const error = await getFirebaseToken.run(call({ sessionToken: 'clerk-jwt' })).catch((e) => e);
    expect(error.code).toBe('internal');
    expect(error.message).toBe('Failed to create Firebase token');
  });
});

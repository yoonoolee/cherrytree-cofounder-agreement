import { callFunction, SESSION_NOT_READY_MESSAGE } from './functions.ts';

const { httpsCallable, callable, auth } = vi.hoisted(() => {
  const callable = vi.fn();
  return {
    callable,
    httpsCallable: vi.fn(() => callable),
    auth: {
      authStateReady: vi.fn(() => Promise.resolve()),
      currentUser: null as { uid: string } | null,
    },
  };
});

vi.mock('firebase/functions', () => ({ httpsCallable }));
vi.mock('./firebase.ts', () => ({ auth, functions: { region: 'us-west2' } }));

beforeEach(() => {
  vi.clearAllMocks();
  auth.currentUser = { uid: 'user_1' };
  callable.mockResolvedValue({ data: { success: true } });
});

describe('callFunction', () => {
  it('calls the named function with a limited-use App Check token and unwraps the result', async () => {
    await expect(callFunction('submitSurvey', { projectId: 'org_1' })).resolves.toEqual({
      success: true,
    });

    expect(httpsCallable).toHaveBeenCalledWith({ region: 'us-west2' }, 'submitSurvey', {
      limitedUseAppCheckTokens: true,
    });
    expect(callable).toHaveBeenCalledWith({ projectId: 'org_1' });
  });

  it('waits for Firebase Auth and refuses a session-backed call when nobody is signed in', async () => {
    let resolveAuth: () => void = () => {};
    auth.authStateReady.mockReturnValue(new Promise<void>((resolve) => (resolveAuth = resolve)));
    auth.currentUser = null;

    const pending = callFunction('generatePreviewPDF', { projectId: 'org_1' });
    expect(httpsCallable).not.toHaveBeenCalled();

    resolveAuth();
    await expect(pending).rejects.toThrow(SESSION_NOT_READY_MESSAGE);
    expect(httpsCallable).not.toHaveBeenCalled();
  });

  it('lets the Clerk exchange and the public contact form through without a Firebase session', async () => {
    auth.currentUser = null;

    await callFunction('getFirebaseToken', { sessionToken: 'jwt' });
    await callFunction('sendContactMessage', { name: 'A', email: 'a@b.co', message: 'hi' });

    expect(httpsCallable).toHaveBeenCalledTimes(2);
    expect(auth.authStateReady).not.toHaveBeenCalled();
  });

  it('propagates the function error unchanged', async () => {
    const error = Object.assign(new Error('boom'), { code: 'functions/invalid-argument' });
    callable.mockRejectedValue(error);

    await expect(
      callFunction('createCheckoutSession', { plan: 'starter', projectName: 'Acme' }),
    ).rejects.toBe(error);
  });
});

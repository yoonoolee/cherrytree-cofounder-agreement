import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { UserProvider, useUser, type UserContextValue } from './UserContext';

type SnapshotHandler = (snapshot: { exists: () => boolean; data: () => unknown }) => void;

const mocks = vi.hoisted(() => ({
  clerk: {
    useUser: vi.fn(),
    useAuth: vi.fn(),
    useOrganizationList: vi.fn(),
  },
  getToken: vi.fn(),
  callFunction: vi.fn(),
  signInWithCustomToken: vi.fn(),
  signOut: vi.fn(),
  onSnapshot: vi.fn(),
  unsubscribe: vi.fn(),
  snapshotListeners: [] as SnapshotHandler[],
}));

vi.mock('@clerk/clerk-react', () => mocks.clerk);
vi.mock('firebase/auth', () => ({
  signInWithCustomToken: mocks.signInWithCustomToken,
  signOut: mocks.signOut,
}));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}` }),
  onSnapshot: mocks.onSnapshot,
}));
vi.mock('../lib/firebase', () => ({
  db: {},
  auth: { name: 'auth' },
  userRef: (id: string) => ({ path: `users/${id}` }),
}));
vi.mock('../lib/functions', () => ({ callFunction: mocks.callFunction }));

const clerkUser = {
  id: 'user_1',
  primaryEmailAddress: { emailAddress: 'ada@example.com' },
};
const orgList = {
  userMemberships: { data: [] },
  setActive: vi.fn(),
  isLoaded: true,
};

function Probe() {
  const value = useUser();
  return (
    <output>
      {JSON.stringify({
        loading: value.loading,
        displayName: value.displayName,
        userId: value.currentUser?.id ?? null,
        profile: value.userProfile,
      })}
    </output>
  );
}

function read(): {
  loading: boolean;
  displayName: string;
  userId: string | null;
  profile: unknown;
} {
  return JSON.parse(screen.getByRole('status').textContent ?? '{}');
}

function renderProvider() {
  return render(
    <UserProvider>
      <Probe />
    </UserProvider>,
  );
}

function emitProfile(profile: Record<string, unknown> | null) {
  const listener = mocks.snapshotListeners.at(-1);
  if (!listener) throw new Error('no profile listener');
  act(() => listener({ exists: () => profile !== null, data: () => profile ?? undefined }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.snapshotListeners.length = 0;
  mocks.clerk.useUser.mockReturnValue({ user: clerkUser, isLoaded: true });
  mocks.clerk.useAuth.mockReturnValue({ getToken: mocks.getToken });
  mocks.clerk.useOrganizationList.mockReturnValue(orgList);
  mocks.getToken.mockResolvedValue('clerk-jwt');
  mocks.callFunction.mockResolvedValue({ firebaseToken: 'custom-token', userId: 'user_1' });
  mocks.signInWithCustomToken.mockResolvedValue(undefined);
  mocks.signOut.mockResolvedValue(undefined);
  mocks.onSnapshot.mockImplementation((_ref: unknown, next: SnapshotHandler) => {
    mocks.snapshotListeners.push(next);
    return mocks.unsubscribe;
  });
});

describe('useUser', () => {
  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useUser())).toThrow('useUser must be used within UserProvider');
  });
});

describe('UserProvider', () => {
  it('is loading until Clerk has loaded', () => {
    mocks.clerk.useUser.mockReturnValue({ user: undefined, isLoaded: false });
    renderProvider();
    expect(read().loading).toBe(true);
    expect(mocks.callFunction).not.toHaveBeenCalled();
  });

  it('signs out of Firebase and settles with no profile when Clerk has no user', async () => {
    mocks.clerk.useUser.mockReturnValue({ user: null, isLoaded: true });
    renderProvider();

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledWith({ name: 'auth' }));
    expect(read()).toEqual({ loading: false, displayName: 'User', userId: null, profile: null });
    expect(mocks.onSnapshot).not.toHaveBeenCalled();
  });

  it('exchanges the Clerk session for a Firebase session, then follows the user document', async () => {
    renderProvider();

    await waitFor(() => expect(mocks.signInWithCustomToken).toHaveBeenCalled());
    expect(mocks.callFunction).toHaveBeenCalledWith('getFirebaseToken', {
      sessionToken: 'clerk-jwt',
    });
    expect(mocks.signInWithCustomToken).toHaveBeenCalledWith({ name: 'auth' }, 'custom-token');

    await waitFor(() =>
      expect(mocks.onSnapshot).toHaveBeenCalledWith(
        { path: 'users/user_1' },
        expect.any(Function),
        expect.any(Function),
      ),
    );
    expect(read().loading).toBe(true);

    emitProfile({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });
    expect(read()).toMatchObject({ loading: false, displayName: 'Ada Lovelace', userId: 'user_1' });
  });

  it('falls back to the email local part, then "User", for the display name', async () => {
    renderProvider();
    await waitFor(() => expect(mocks.onSnapshot).toHaveBeenCalled());

    emitProfile({ firstName: '', lastName: '' });
    expect(read().displayName).toBe('ada');

    emitProfile(null);
    expect(read()).toMatchObject({ displayName: 'ada', profile: null });
  });

  it('stays loading when the Firebase exchange fails (pinned; no error state today)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.callFunction.mockRejectedValue(new Error('app-check'));
    renderProvider();

    await waitFor(() => expect(mocks.callFunction).toHaveBeenCalled());
    await act(async () => {});
    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
    expect(mocks.onSnapshot).not.toHaveBeenCalled();
    expect(read().loading).toBe(true);
  });

  it('exposes the organization memberships untouched', () => {
    let value: UserContextValue | undefined;
    function Capture({ children }: { children?: ReactNode }) {
      value = useUser();
      return children;
    }
    render(
      <UserProvider>
        <Capture />
      </UserProvider>,
    );
    expect(value).toMatchObject({
      userMemberships: orgList.userMemberships,
      setActive: orgList.setActive,
      orgsLoaded: true,
    });
    expect(value).not.toHaveProperty('organizationList');
  });
});

import { renderHook, waitFor } from '@testing-library/react';

import { makeProject, timestamp } from '../test/fixtures/project.ts';
import { useProjects } from './useProjects.ts';

const { getDoc } = vi.hoisted(() => ({ getDoc: vi.fn() }));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}`, id }),
  getDoc,
}));
vi.mock('../lib/firebase.ts', () => ({
  db: {},
  projectRef: (id: string) => ({ path: `projects/${id}`, id }),
}));

const currentUser = { id: 'user_1' } as never;
const memberships = {
  data: [
    { organization: { id: 'org_old' } },
    { organization: { id: 'org_missing' } },
    { organization: { id: 'org_new' } },
  ],
} as never;

const stored: Record<string, ReturnType<typeof makeProject>> = {
  org_old: makeProject({ name: 'Old', lastOpened: timestamp('2026-01-01T00:00:00Z') }),
  org_new: makeProject({ name: 'New', lastOpened: timestamp('2026-06-01T00:00:00Z') }),
};

beforeEach(() => {
  vi.clearAllMocks();
  getDoc.mockImplementation((ref: { id: string }) =>
    Promise.resolve({
      id: ref.id,
      exists: () => ref.id in stored,
      data: () => stored[ref.id],
    }),
  );
});

describe('useProjects', () => {
  it('waits for the user, memberships and Firebase session', () => {
    renderHook(() => useProjects(null, memberships, true, false));
    renderHook(() => useProjects(currentUser, memberships, false, false));
    renderHook(() => useProjects(currentUser, memberships, true, true));
    expect(getDoc).not.toHaveBeenCalled();
  });

  it('loads one project per membership, newest opened first, skipping missing documents', async () => {
    const { result } = renderHook(() => useProjects(currentUser, memberships, true, false));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.projects.map((p) => p.id)).toEqual(['org_new', 'org_old']);
    expect(result.current.projects[0]).toEqual({ id: 'org_new', ...stored.org_new });
  });

  it('keeps the other projects when one read fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getDoc.mockImplementation((ref: { id: string }) =>
      ref.id === 'org_old'
        ? Promise.reject(new Error('permission-denied'))
        : Promise.resolve({
            id: ref.id,
            exists: () => ref.id in stored,
            data: () => stored[ref.id],
          }),
    );
    const { result } = renderHook(() => useProjects(currentUser, memberships, true, false));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projects.map((p) => p.id)).toEqual(['org_new']);
  });
});

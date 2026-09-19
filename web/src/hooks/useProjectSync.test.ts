import { act, renderHook } from '@testing-library/react';
import { INITIAL_FORM_DATA } from '@cherrytree/shared';

import { makeProject, timestamp } from '../test/fixtures/project';
import { useProjectSync } from './useProjectSync';

type SnapshotHandler = (snapshot: { id: string; exists: () => boolean; data: () => unknown }) => void;
type ErrorHandler = (error: { code?: string; message: string }) => void;

const { onSnapshot, unsubscribe, listeners } = vi.hoisted(() => {
  const listeners: { next: SnapshotHandler; error: ErrorHandler }[] = [];
  const unsubscribe = vi.fn();
  return {
    listeners,
    unsubscribe,
    onSnapshot: vi.fn((_ref: unknown, next: SnapshotHandler, error: ErrorHandler) => {
      listeners.push({ next, error });
      return unsubscribe;
    }),
  };
});

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}` }),
  onSnapshot,
}));
vi.mock('../lib/firebase', () => ({
  db: {},
  projectRef: (id: string) => ({ path: `projects/${id}` }),
}));

function emit(id: string, project: ReturnType<typeof makeProject> | null) {
  const listener = listeners.at(-1);
  if (!listener) throw new Error('no listener');
  act(() =>
    listener.next({ id, exists: () => project !== null, data: () => project ?? undefined }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listeners.length = 0;
});

describe('useProjectSync', () => {
  it('listens to the project document and stops on unmount', () => {
    const isSavingRef = { current: false };
    const { unmount } = renderHook(() => useProjectSync('org_1', isSavingRef));

    expect(onSnapshot).toHaveBeenCalledWith(
      { path: 'projects/org_1' },
      expect.any(Function),
      expect.any(Function),
    );
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('starts from the schema defaults with no project', () => {
    const { result } = renderHook(() => useProjectSync('org_1', { current: false }));
    expect(result.current.project).toBeNull();
    expect(result.current.formData).toEqual(INITIAL_FORM_DATA);
    expect(result.current.accessDenied).toBe(false);
    expect(result.current.lastSaved).toBeNull();
  });

  it('exposes the document with its id and the stored answers over the defaults', () => {
    const { result } = renderHook(() => useProjectSync('org_1', { current: false }));
    const stored = makeProject({
      surveyData: { companyName: 'Acme', industries: ['Software'] },
      lastUpdated: timestamp('2026-03-01T00:00:00Z'),
    });

    emit('org_1', stored);

    expect(result.current.project).toEqual({ ...stored, id: 'org_1' });
    expect(result.current.formData).toEqual({
      ...INITIAL_FORM_DATA,
      companyName: 'Acme',
      industries: ['Software'],
    });
    expect(result.current.lastSaved).toEqual(new Date('2026-03-01T00:00:00Z'));
  });

  it('keeps the in-flight form while a save is pending, but still refreshes the project', () => {
    const isSavingRef = { current: false };
    const { result } = renderHook(() => useProjectSync('org_1', isSavingRef));
    emit('org_1', makeProject({ surveyData: { companyName: 'Acme' } }));

    isSavingRef.current = true;
    emit('org_1', makeProject({ name: 'Renamed', surveyData: { companyName: 'Echo' } }));

    expect(result.current.formData.companyName).toBe('Acme');
    expect(result.current.project?.name).toBe('Renamed');
  });

  it('flags a permission error as access denied', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useProjectSync('org_1', { current: false }));

    act(() => listeners.at(-1)?.error({ code: 'permission-denied', message: 'nope' }));
    expect(result.current.accessDenied).toBe(true);
  });

  it('ignores a missing document', () => {
    const { result } = renderHook(() => useProjectSync('org_1', { current: false }));
    emit('org_1', null);
    expect(result.current.project).toBeNull();
    expect(result.current.accessDenied).toBe(false);
  });
});

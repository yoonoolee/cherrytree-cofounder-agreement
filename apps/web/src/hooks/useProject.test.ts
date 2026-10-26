import { act, renderHook } from '@testing-library/react';

import { useProject } from './useProject.ts';
import { makeProject } from '../test/fixtures/project.ts';

type Listener = { next: (snapshot: unknown) => void; error: (cause: unknown) => void };

const mocks = vi.hoisted(() => ({ listener: null as Listener | null, unsubscribe: vi.fn() }));

vi.mock('../lib/firebase.ts', () => ({ projectRef: (id: string) => `projects/${id}` }));
vi.mock('firebase/firestore', () => ({
  onSnapshot: (_ref: string, next: Listener['next'], error: Listener['error']) => {
    mocks.listener = { next, error };
    return mocks.unsubscribe;
  },
}));

const emit = (data: () => unknown) => act(() => mocks.listener?.next({ data }));

beforeEach(() => {
  mocks.listener = null;
  mocks.unsubscribe.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useProject', () => {
  it('follows the project live', () => {
    const { result, unmount } = renderHook(() => useProject('org_1'));
    expect(result.current).toEqual({ status: 'loading' });

    emit(() => makeProject());
    expect(result.current).toMatchObject({ status: 'ready', project: { draftStatus: null } });
    emit(() => makeProject({ draftStatus: 'drafting' }));
    expect(result.current).toMatchObject({ project: { draftStatus: 'drafting' } });

    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalled();
  });

  it.each([
    ['a missing project', () => undefined],
    [
      'a malformed one',
      () => {
        throw new Error('invalid');
      },
    ],
  ])('reports %s as an error', (_, data) => {
    const { result } = renderHook(() => useProject('org_1'));
    emit(data);
    expect(result.current).toEqual({ status: 'error' });
  });

  it('reports a listener error', () => {
    const { result } = renderHook(() => useProject('org_1'));
    act(() => mocks.listener?.error(new Error('permission-denied')));
    expect(result.current).toEqual({ status: 'error' });
  });
});

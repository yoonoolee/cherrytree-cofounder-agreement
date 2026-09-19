import { act, renderHook } from '@testing-library/react';

import { makeProject, makeSurveyData } from '../test/fixtures/project.ts';
import { useAutoSave } from './useAutoSave.ts';

const { updateDoc, SERVER_TIMESTAMP } = vi.hoisted(() => ({
  updateDoc: vi.fn(),
  SERVER_TIMESTAMP: { kind: 'serverTimestamp' },
}));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}` }),
  updateDoc,
  serverTimestamp: () => SERVER_TIMESTAMP,
}));
vi.mock('../lib/firebase.ts', () => ({
  db: {},
  projectRef: (id: string) => ({ path: `projects/${id}` }),
}));

const currentUser = { primaryEmailAddress: { emailAddress: 'ada@example.com' } } as never;
const project = makeProject({ surveyData: { companyName: 'Acme' } });

beforeEach(() => {
  vi.clearAllMocks();
  updateDoc.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAutoSave', () => {
  it('starts as saved with nothing saved yet', () => {
    const { result } = renderHook(() => useAutoSave('org_1', project, currentUser));
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.isSavingRef.current).toBe(false);
  });

  it('does nothing until the project has loaded', async () => {
    const { result } = renderHook(() => useAutoSave('org_1', null, currentUser));
    await act(() => result.current.saveFormData(makeSurveyData()));
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('writes the whole form with a server timestamp and the editor email', async () => {
    const { result } = renderHook(() => useAutoSave('org_1', project, currentUser));
    const form = makeSurveyData({ companyName: 'Acme', mailingCity: 'Wilmington' });

    await act(() => result.current.saveFormData(form));

    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'projects/org_1' },
      {
        surveyData: form,
        lastUpdated: SERVER_TIMESTAMP,
        lastEditedBy: 'ada@example.com',
        approvals: {},
      },
    );
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.lastSaved).toBeInstanceOf(Date);
  });

  it('keeps existing approvals when nothing actually changed', async () => {
    const { result } = renderHook(() => useAutoSave('org_1', project, currentUser));
    // Same values as the stored surveyData for every key it holds.
    await act(() => result.current.saveFormData({ companyName: 'Acme' } as never));

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc.mock.calls[0]?.[1]).not.toHaveProperty('approvals');
  });

  it('reports a failed write', async () => {
    updateDoc.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useAutoSave('org_1', project, currentUser));

    await act(() => result.current.saveFormData(makeSurveyData()));

    expect(result.current.saveStatus).toBe('error');
    expect(result.current.lastSaved).toBeNull();
  });

  it('flags a save in progress until shortly after it settles', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAutoSave('org_1', project, currentUser));

    await act(() => result.current.saveFormData(makeSurveyData()));
    expect(result.current.isSavingRef.current).toBe(true);

    act(() => vi.advanceTimersByTime(500));
    expect(result.current.isSavingRef.current).toBe(false);
  });

  it('debounces field changes into one save of the merged form', async () => {
    vi.useFakeTimers();
    const setFormData = vi.fn((update: (prev: unknown) => unknown) =>
      update(makeSurveyData({ companyName: 'Acme' })),
    );
    const { result } = renderHook(() => useAutoSave('org_1', project, currentUser));
    const handleChange = result.current.createChangeHandler(setFormData as never);

    act(() => {
      handleChange('mailingCity', 'Wilmington');
      handleChange('mailingZip', '19801');
    });
    expect(result.current.saveStatus).toBe('saving');
    expect(updateDoc).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc.mock.calls[0]?.[1]).toMatchObject({
      surveyData: expect.objectContaining({ companyName: 'Acme', mailingZip: '19801' }),
    });
  });
});

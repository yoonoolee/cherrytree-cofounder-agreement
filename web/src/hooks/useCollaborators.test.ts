import { renderHook } from '@testing-library/react';

import { ADMIN_ID, MEMBER_ID, makeCollaborator, makeProject } from '../test/fixtures/project.ts';
import { useCollaborators } from './useCollaborators.ts';

const project = makeProject({
  collaborators: {
    [MEMBER_ID]: makeCollaborator({ firstName: 'Grace', lastName: 'Hopper' }),
    [ADMIN_ID]: makeCollaborator({ role: 'admin', firstName: 'Ada', lastName: 'Lovelace' }),
    user_anon: makeCollaborator(),
    user_gone: makeCollaborator({ firstName: 'Zed', isActive: false }),
  },
});

describe('useCollaborators', () => {
  it('is empty without a project', () => {
    const { result } = renderHook(() => useCollaborators(null));
    expect(result.current.collaborators).toEqual([]);
    expect(result.current.collaboratorIds).toEqual([]);
    expect(result.current.getAdmin()).toBeNull();
  });

  it('lists every collaborator (active or not) with its userId', () => {
    const { result } = renderHook(() => useCollaborators(project));
    expect(result.current.collaborators.map((c) => c.userId).sort()).toEqual([
      ADMIN_ID,
      'user_anon',
      'user_gone',
      MEMBER_ID,
    ]);
    expect(result.current.collaboratorsMap).toBe(project.collaborators);
  });

  it('orders the active ids the way the survey letters them', () => {
    const { result } = renderHook(() => useCollaborators(project));
    expect(result.current.collaboratorIds).toEqual(['user_anon', ADMIN_ID, MEMBER_ID]);
  });

  it('names a collaborator by account name, or by letter when the name is blank', () => {
    const { result } = renderHook(() => useCollaborators(project));
    expect(result.current.getDisplayName(ADMIN_ID)).toBe('Ada Lovelace');
    expect(result.current.getDisplayName(MEMBER_ID)).toBe('Grace Hopper');
    expect(result.current.getDisplayName('user_anon')).toBe('Cofounder A');
  });

  it('has no name for a removed or unknown user', () => {
    const { result } = renderHook(() => useCollaborators(project));
    expect(result.current.getDisplayName('user_gone')).toBe('');
    expect(result.current.getDisplayName('user_nobody')).toBe('');
  });

  it('identifies the admin', () => {
    const { result } = renderHook(() => useCollaborators(project));
    expect(result.current.isAdmin(ADMIN_ID)).toBe(true);
    expect(result.current.isAdmin(MEMBER_ID)).toBe(false);
    expect(result.current.getAdmin()).toEqual({
      userId: ADMIN_ID,
      ...project.collaborators[ADMIN_ID],
    });
  });

  it('has no admin when the admin is not in the collaborator map', () => {
    const { result } = renderHook(() => useCollaborators(makeProject({ admin: 'user_elsewhere' })));
    expect(result.current.getAdmin()).toBeNull();
  });
});

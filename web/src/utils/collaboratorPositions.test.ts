import { makeCollaborator } from '../test/fixtures/project.ts';
import { getSortedCollaboratorIds } from './collaboratorPositions.ts';

describe('getSortedCollaboratorIds', () => {
  it('is empty without collaborators', () => {
    expect(getSortedCollaboratorIds(undefined)).toEqual([]);
    expect(getSortedCollaboratorIds({})).toEqual([]);
  });

  it('drops removed collaborators', () => {
    const ids = getSortedCollaboratorIds({
      user_a: makeCollaborator({ firstName: 'Ada', isActive: false }),
      user_b: makeCollaborator({ firstName: 'Bob' }),
    });
    expect(ids).toEqual(['user_b']);
  });

  // Documented as "join time" but sorted by display name; pinned as-is (docs/REFACTOR_PLAN.md).
  it('orders active collaborators by full name, case-insensitively', () => {
    const ids = getSortedCollaboratorIds({
      user_c: makeCollaborator({ firstName: 'carol', lastName: 'Zed' }),
      user_a: makeCollaborator({ firstName: 'Ada', lastName: 'Lovelace' }),
      user_b: makeCollaborator({ firstName: 'Ada', lastName: 'Byron' }),
    });
    expect(ids).toEqual(['user_b', 'user_a', 'user_c']);
  });

  it('puts collaborators without a name first', () => {
    const ids = getSortedCollaboratorIds({
      user_a: makeCollaborator({ firstName: 'Ada' }),
      user_x: makeCollaborator(),
    });
    expect(ids).toEqual(['user_x', 'user_a']);
  });
});

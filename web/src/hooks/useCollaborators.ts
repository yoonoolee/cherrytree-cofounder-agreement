import { useMemo } from 'react';
import { COLLABORATOR_FIELDS, type Collaborator, type Project } from '@cherrytree/shared';

import { getSortedCollaboratorIds, type CollaboratorsMap } from '../utils/collaboratorPositions.ts';

/** A collaborator together with the map key it lives under. */
export interface CollaboratorWithId extends Collaborator {
  userId: string;
}

/** Everything the collaborator helpers read from a project. */
export type CollaboratorSource = Pick<Project, 'admin' | 'collaborators'> | null | undefined;

const EMPTY_MAP: CollaboratorsMap = {};

export function useCollaborators(project: CollaboratorSource) {
  const collaboratorsMap = useMemo(
    () => project?.collaborators || EMPTY_MAP,
    [project?.collaborators],
  );

  const collaborators = useMemo((): CollaboratorWithId[] => {
    return Object.entries(collaboratorsMap).map(([userId, data]) => ({
      userId,
      ...data,
    }));
  }, [collaboratorsMap]);

  // Sort collaborators by position (determines A, B, C order)
  const collaboratorIds = useMemo(() => {
    return getSortedCollaboratorIds(collaboratorsMap);
  }, [collaboratorsMap]);

  const getCofounderLabel = (index: number) => `Cofounder ${String.fromCharCode(65 + index)}`;

  const getDisplayName = useMemo(() => {
    return (userId: string): string => {
      const index = collaboratorIds.indexOf(userId);
      if (index === -1) return '';
      const collaborator = collaboratorsMap[userId];
      const accountName = [
        collaborator?.[COLLABORATOR_FIELDS.FIRST_NAME],
        collaborator?.[COLLABORATOR_FIELDS.LAST_NAME],
      ]
        .filter(Boolean)
        .join(' ');
      return accountName || getCofounderLabel(index);
    };
  }, [collaboratorIds, collaboratorsMap]);

  const isAdmin = useMemo(() => {
    return (userId: string): boolean => project?.admin === userId;
  }, [project?.admin]);

  const getAdmin = useMemo(() => {
    return (): CollaboratorWithId | null => {
      const adminId = project?.admin;
      const admin = adminId ? collaboratorsMap[adminId] : undefined;
      if (!adminId || !admin) return null;
      return { userId: adminId, ...admin };
    };
  }, [collaboratorsMap, project?.admin]);

  return {
    collaborators,
    collaboratorsMap,
    collaboratorIds,
    getDisplayName,
    isAdmin,
    getAdmin,
  };
}

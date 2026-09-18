import { useMemo } from 'react';
import { getSortedCollaboratorIds, migrateCollaboratorPositions } from '../utils/collaboratorPositions';
import { COLLABORATOR_FIELDS } from '../config/surveySchema';

export function useCollaborators(project) {
  // Auto-migrate collaborators to have positions if they don't already
  const collaboratorsMap = useMemo(() => {
    const rawCollaborators = project?.collaborators || {};
    return migrateCollaboratorPositions(rawCollaborators, project?.admin);
  }, [project?.collaborators, project?.admin]);

  const collaborators = useMemo(() => {
    return Object.entries(collaboratorsMap).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }, [collaboratorsMap]);

  // Sort collaborators by position (determines A, B, C order)
  const collaboratorIds = useMemo(() => {
    return getSortedCollaboratorIds(collaboratorsMap);
  }, [collaboratorsMap]);

  const getCofounderLabel = (index) => `Cofounder ${String.fromCharCode(65 + index)}`;

  const getDisplayName = useMemo(() => {
    return (userId) => {
      const index = collaboratorIds.indexOf(userId);
      if (index === -1) return '';
      const collaborator = collaboratorsMap[userId];
      const accountName = [
        collaborator?.[COLLABORATOR_FIELDS.FIRST_NAME],
        collaborator?.[COLLABORATOR_FIELDS.LAST_NAME]
      ].filter(Boolean).join(' ');
      return accountName || getCofounderLabel(index);
    };
  }, [collaboratorIds, collaboratorsMap]);

  const isAdmin = useMemo(() => {
    return (userId) => project?.admin === userId;
  }, [project?.admin]);

  const getAdmin = useMemo(() => {
    return () => {
      const adminId = project?.admin;
      if (!adminId || !collaboratorsMap[adminId]) return null;
      return { userId: adminId, ...collaboratorsMap[adminId] };
    };
  }, [collaboratorsMap, project?.admin]);

  return {
    collaborators,
    collaboratorsMap,
    collaboratorIds,
    getDisplayName,
    isAdmin,
    getAdmin
  };
}

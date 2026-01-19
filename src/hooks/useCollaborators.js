import { useMemo } from 'react';

export function useCollaborators(project) {
  const collaboratorsMap = useMemo(() => {
    return project?.collaborators || {};
  }, [project?.collaborators]);

  const collaborators = useMemo(() => {
    return Object.entries(collaboratorsMap).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }, [collaboratorsMap]);

  const collaboratorIds = useMemo(() => {
    return Object.keys(collaboratorsMap);
  }, [collaboratorsMap]);

  const cofounders = project?.surveyData?.cofounders || [];

  const getCofounderLabel = (index) => `Cofounder ${String.fromCharCode(65 + index)}`;

  const getDisplayName = useMemo(() => {
    return (userId) => {
      const index = Object.keys(collaboratorsMap).indexOf(userId);
      if (index === -1) return '';
      const name = cofounders[index]?.fullName?.trim();
      return name || getCofounderLabel(index);
    };
  }, [collaboratorsMap, cofounders]);

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

import { useMemo } from 'react';

/**
 * Hook to access collaborator data from a project
 *
 * Data structure:
 * - project.admin: userId of the admin
 * - project.collaborators: [{userId, email}, {userId, email}, ...]
 */
export function useCollaborators(project) {
  const collaborators = useMemo(() => {
    return project?.collaborators || [];
  }, [project?.collaborators]);

  const collaboratorIds = useMemo(() => {
    return collaborators.map(c => c.userId);
  }, [collaborators]);

  const getEmailFromUserId = useMemo(() => {
    return (userId) => collaborators.find(c => c.userId === userId)?.email || '';
  }, [collaborators]);

  const isAdmin = useMemo(() => {
    return (userId) => project?.admin === userId;
  }, [project?.admin]);

  const getAdmin = useMemo(() => {
    return () => collaborators.find(c => c.userId === project?.admin);
  }, [collaborators, project?.admin]);

  return {
    collaborators,
    collaboratorIds,
    getEmailFromUserId,
    isAdmin,
    getAdmin
  };
}

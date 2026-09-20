import { useParams } from 'react-router-dom';

/**
 * The `:projectId` route parameter. The survey, preview and final-agreement routes always
 * carry one, so a missing parameter is a routing bug rather than a state to render.
 */
export function useProjectId(): string {
  const { projectId } = useParams<'projectId'>();
  if (!projectId) throw new Error('Route has no :projectId parameter');
  return projectId;
}

/**
 * Utility functions for managing collaborator sorting
 *
 * Collaborators are sorted by join time (not position numbers).
 * Order is determined by the startAt timestamp of their current (active) history entry.
 */

import { COLLABORATOR_FIELDS, type Collaborator } from '@cherrytree/shared';

/** `Project.collaborators`, keyed by Clerk user id. */
export type CollaboratorsMap = Record<string, Collaborator>;

/**
 * Get sorted collaborator IDs by join time (active collaborators only)
 * @returns Array of userIds sorted by join time (earliest first)
 */
export function getSortedCollaboratorIds(
  collaboratorsMap: CollaboratorsMap | null | undefined,
): string[] {
  if (!collaboratorsMap || Object.keys(collaboratorsMap).length === 0) {
    return [];
  }

  return Object.entries(collaboratorsMap)
    .filter(([_, data]) => data[COLLABORATOR_FIELDS.IS_ACTIVE] !== false) // Only include active collaborators
    .map(([userId, data]) => {
      const name = [data[COLLABORATOR_FIELDS.FIRST_NAME], data[COLLABORATOR_FIELDS.LAST_NAME]]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return { userId, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name
    .map((item) => item.userId);
}

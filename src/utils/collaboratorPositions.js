/**
 * Utility functions for managing collaborator sorting
 *
 * Collaborators are sorted by join time (not position numbers).
 * Order is determined by the startAt timestamp of their current (active) history entry.
 */

import { COLLABORATOR_FIELDS } from '../config/surveySchema';

/**
 * Get sorted collaborator IDs by join time (active collaborators only)
 * @param {Object} collaboratorsMap - Map of userId -> collaborator data
 * @returns {string[]} - Array of userIds sorted by join time (earliest first)
 */
export function getSortedCollaboratorIds(collaboratorsMap) {
  if (!collaboratorsMap || Object.keys(collaboratorsMap).length === 0) {
    return [];
  }

  return Object.entries(collaboratorsMap)
    .filter(([_, data]) => data[COLLABORATOR_FIELDS.IS_ACTIVE] !== false) // Only include active collaborators
    .map(([userId, data]) => {
      // Get current (active) history entry
      const currentEntry = data[COLLABORATOR_FIELDS.HISTORY]?.find(h => h.endAt === null);
      const joinTime = currentEntry?.startAt ? new Date(currentEntry.startAt).getTime() : Infinity;

      return { userId, joinTime };
    })
    .sort((a, b) => a.joinTime - b.joinTime) // Sort by join time (earliest first)
    .map(item => item.userId);
}

/**
 * No migration needed - we use join time from history, not positions
 */
export function migrateCollaboratorPositions(collaboratorsMap, adminUserId) {
  // No-op: positions are no longer used, join time is the source of truth
  return collaboratorsMap;
}

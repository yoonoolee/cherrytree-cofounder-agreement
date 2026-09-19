/**
 * Date utility functions for edit window management
 *
 * The edit deadline is calculated ONCE at project creation and stored in Firestore.
 * See functions/src/config.ts EDIT_WINDOW_CONFIG for configuration.
 */
import type { DateLike, Project } from '@cherrytree/shared';
import { toDate } from '@cherrytree/shared';

/** A deadline as read from Firestore; `null`/`undefined` on legacy projects. */
type Deadline = DateLike | null | undefined;

/**
 * Check if current date is after the edit deadline
 * @returns True if current date > deadline (editing locked), false otherwise
 */
export function isAfterEditDeadline(editDeadline: Deadline): boolean {
  if (!editDeadline) {
    return false;
  }

  return new Date() > toDate(editDeadline);
}

/**
 * Determine if project should be read-only based on deadline and submission history
 * LOGIC:
 * - Before deadline: Always editable (even if submitted)
 * - After deadline: Locked if they've ever submitted, editable for one-time submission if never submitted
 */
export function isProjectReadOnly(
  project: Pick<Project, 'editDeadline' | 'pdfAgreements'> | null | undefined,
): boolean {
  if (!project) {
    return false;
  }

  const isAfterDeadline = isAfterEditDeadline(project.editDeadline);
  const hasEverSubmitted = (project.pdfAgreements?.length || 0) > 0;

  return isAfterDeadline && hasEverSubmitted;
}

/**
 * Format a deadline date for display
 * @returns Formatted date string (e.g., "July 16, 2026") or null
 */
export function formatDeadline(editDeadline: Deadline): string | null {
  if (!editDeadline) {
    return null;
  }

  return toDate(editDeadline).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

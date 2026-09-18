/**
 * Date utility functions for edit window management
 *
 * The edit deadline is calculated ONCE at project creation and stored in Firestore.
 * See functions/index.js EDIT_WINDOW_CONFIG for configuration.
 */

/**
 * Check if current date is after the edit deadline
 * @param {Date|Timestamp|null} editDeadline - The edit deadline from Firestore
 * @returns {boolean} True if current date > deadline (editing locked), false otherwise
 */
export function isAfterEditDeadline(editDeadline) {
  if (!editDeadline) {
    return false;
  }

  const deadline = editDeadline.toDate ? editDeadline.toDate() : new Date(editDeadline);
  return new Date() > deadline;
}

/**
 * Determine if project should be read-only based on deadline and submission history
 * LOGIC:
 * - Before deadline: Always editable (even if submitted)
 * - After deadline: Locked if they've ever submitted, editable for one-time submission if never submitted
 *
 * @param {Object} project - The project object from Firestore
 * @returns {boolean} True if read-only, false if editable
 */
export function isProjectReadOnly(project) {
  if (!project) {
    return false;
  }

  const isAfterDeadline = isAfterEditDeadline(project.editDeadline);
  const hasEverSubmitted = (project.pdfAgreements?.length || 0) > 0;

  return isAfterDeadline && hasEverSubmitted;
}

/**
 * Format a deadline date for display
 * @param {Date|Timestamp|null} editDeadline - The edit deadline from Firestore
 * @returns {string|null} Formatted date string (e.g., "July 16, 2026") or null
 */
export function formatDeadline(editDeadline) {
  if (!editDeadline) {
    return null;
  }

  const deadline = editDeadline.toDate ? editDeadline.toDate() : new Date(editDeadline);
  return deadline.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

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

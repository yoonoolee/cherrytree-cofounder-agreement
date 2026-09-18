import toast from 'react-hot-toast';
import * as Sentry from '@sentry/react';

/**
 * Handle errors with user-friendly toast + Sentry logging
 * @param {Error|string} error - The error object or message
 * @param {Object} options - Additional options
 * @param {string} options.userMessage - Message to show user (defaults to generic message)
 * @param {string} options.action - What the user was trying to do (e.g., "send invitation")
 * @param {Object} options.context - Additional context for debugging (userId, projectId, etc.)
 */
export function handleError(error, options = {}) {
  const {
    userMessage = 'Something went wrong. Please try again.',
    action = 'unknown action',
    context = {}
  } = options;

  // Show user-friendly toast
  toast.error(userMessage);

  // Log to console with full details for debugging
  console.error(`Error during ${action}:`, {
    error: error?.message || error,
    stack: error?.stack,
    ...context,
    timestamp: new Date().toISOString()
  });

  // Send to Sentry with context
  Sentry.captureException(error, {
    tags: { action },
    extra: context
  });
}

/**
 * Show success toast
 * @param {string} message - Success message to show
 */
export function showSuccess(message) {
  toast.success(message);
}

/**
 * Show info toast
 * @param {string} message - Info message to show
 */
export function showInfo(message) {
  toast(message, { icon: 'ℹ️' });
}

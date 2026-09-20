import { EDIT_WINDOW_CONFIG } from '../config.ts';

/**
 * Deadline for collaborator/survey edits: `EDIT_WINDOW_CONFIG` after `startDate`, moved to
 * 11:59:59 PM PST (UTC-8) of that day, i.e. 07:59:59 UTC the next day.
 */
export function calculateEditDeadline(startDate: Date): Date {
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    throw new Error('startDate must be a valid Date object');
  }

  const { amount, unit } = EDIT_WINDOW_CONFIG;

  if (!amount || amount <= 0) {
    throw new Error('EDIT_WINDOW_CONFIG.amount must be a positive number');
  }

  const deadline = new Date(startDate);

  switch (unit) {
    case 'years':
      deadline.setFullYear(deadline.getFullYear() + amount);
      break;
    case 'months':
      deadline.setMonth(deadline.getMonth() + amount);
      break;
    case 'days':
      deadline.setDate(deadline.getDate() + amount);
      break;
    case 'hours':
      deadline.setHours(deadline.getHours() + amount);
      break;
    case 'minutes':
      deadline.setMinutes(deadline.getMinutes() + amount);
      break;
    default:
      throw new Error(
        `Unsupported unit: ${String(unit)}. Supported units: years, months, days, hours, minutes`,
      );
  }

  const year = deadline.getUTCFullYear();
  const month = deadline.getUTCMonth();
  const day = deadline.getUTCDate();
  return new Date(Date.UTC(year, month, day + 1, 7, 59, 59));
}

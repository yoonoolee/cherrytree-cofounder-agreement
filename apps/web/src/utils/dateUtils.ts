import type { DateLike } from '@cherrytree/shared';
import { toDate } from '@cherrytree/shared';

/**
 * Coarse "edited … ago" label: "just now" under a minute, then minutes, hours, days
 * (floored, no rounding up).
 */
export function formatTimeAgo(value: DateLike, now: Date = new Date()): string {
  const elapsed = now.getTime() - toDate(value).getTime();
  const hoursAgo = Math.floor(elapsed / (1000 * 60 * 60));
  if (hoursAgo < 1) {
    const minutesAgo = Math.floor(elapsed / (1000 * 60));
    return minutesAgo < 1 ? 'just now' : `${minutesAgo}m ago`;
  }
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.floor(hoursAgo / 24)}d ago`;
}

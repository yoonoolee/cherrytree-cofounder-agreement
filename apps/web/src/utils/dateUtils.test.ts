import { timestamp } from '../test/fixtures/project.ts';
import { formatTimeAgo } from './dateUtils.ts';

const NOW = new Date('2026-07-16T12:00:00Z');

describe('formatTimeAgo', () => {
  const minutesBefore = (n: number) => new Date(NOW.getTime() - n * 60_000);

  it('floors to the coarsest unit that fits', () => {
    expect(formatTimeAgo(minutesBefore(0), NOW)).toBe('just now');
    expect(formatTimeAgo(minutesBefore(0.9), NOW)).toBe('just now');
    expect(formatTimeAgo(minutesBefore(1), NOW)).toBe('1m ago');
    expect(formatTimeAgo(minutesBefore(59.9), NOW)).toBe('59m ago');
    expect(formatTimeAgo(minutesBefore(60), NOW)).toBe('1h ago');
    expect(formatTimeAgo(minutesBefore(23 * 60 + 59), NOW)).toBe('23h ago');
    expect(formatTimeAgo(minutesBefore(24 * 60), NOW)).toBe('1d ago');
    expect(formatTimeAgo(minutesBefore(49 * 60), NOW)).toBe('2d ago');
  });

  it('accepts a Firestore timestamp', () => {
    expect(formatTimeAgo(timestamp(minutesBefore(5)), NOW)).toBe('5m ago');
  });
});

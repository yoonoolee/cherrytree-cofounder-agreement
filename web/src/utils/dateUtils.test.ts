import { makeProject, timestamp } from '../test/fixtures/project.ts';
import {
  formatDeadline,
  formatTimeAgo,
  isAfterEditDeadline,
  isProjectReadOnly,
} from './dateUtils.ts';

const NOW = new Date('2026-07-16T12:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isAfterEditDeadline', () => {
  it('is false without a deadline (legacy projects edit forever)', () => {
    expect(isAfterEditDeadline(null)).toBe(false);
    expect(isAfterEditDeadline(undefined)).toBe(false);
  });

  it('compares a Firestore Timestamp against now', () => {
    expect(isAfterEditDeadline(timestamp('2026-07-16T11:59:59Z'))).toBe(true);
    expect(isAfterEditDeadline(timestamp('2026-07-16T12:00:01Z'))).toBe(false);
  });

  it('also accepts a Date', () => {
    expect(isAfterEditDeadline(new Date('2026-01-01T00:00:00Z'))).toBe(true);
    expect(isAfterEditDeadline(new Date('2027-01-01T00:00:00Z'))).toBe(false);
  });
});

describe('isProjectReadOnly', () => {
  const past = timestamp('2026-01-01T00:00:00Z');
  const future = timestamp('2027-01-01T00:00:00Z');
  const agreement = { url: 'https://drive/x', generatedAt: past, generatedBy: 'user_admin' };

  it('is false without a project', () => {
    expect(isProjectReadOnly(null)).toBe(false);
    expect(isProjectReadOnly(undefined)).toBe(false);
  });

  it('locks only a project that is past its deadline AND has submitted at least once', () => {
    expect(isProjectReadOnly(makeProject({ editDeadline: past, pdfAgreements: [agreement] }))).toBe(
      true,
    );
    expect(isProjectReadOnly(makeProject({ editDeadline: past, pdfAgreements: [] }))).toBe(false);
    expect(
      isProjectReadOnly(makeProject({ editDeadline: future, pdfAgreements: [agreement] })),
    ).toBe(false);
  });
});

describe('formatDeadline', () => {
  it('is null without a deadline', () => {
    expect(formatDeadline(null)).toBeNull();
  });

  it('formats as a long US date', () => {
    expect(formatDeadline(timestamp('2026-07-16T12:00:00Z'))).toBe('July 16, 2026');
    expect(formatDeadline(new Date('2026-07-16T12:00:00Z'))).toBe('July 16, 2026');
  });
});

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

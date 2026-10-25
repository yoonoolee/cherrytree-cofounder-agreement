import { toDate } from './time.ts';

describe('toDate', () => {
  it('unwraps a Timestamp-like value', () => {
    const date = new Date('2026-01-02T03:04:05.000Z');
    const timestamp = { toDate: () => date, toMillis: () => date.getTime() };
    expect(toDate(timestamp)).toBe(date);
  });

  it('copies a Date', () => {
    const date = new Date('2026-01-02T03:04:05.000Z');
    const result = toDate(date);
    expect(result).not.toBe(date);
    expect(result.getTime()).toBe(date.getTime());
  });

  it('parses an ISO string', () => {
    expect(toDate('2026-01-02T03:04:05.000Z').toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it('accepts epoch milliseconds', () => {
    expect(toDate(0).toISOString()).toBe('1970-01-01T00:00:00.000Z');
  });
});

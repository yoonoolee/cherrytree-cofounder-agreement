import { calculateEditDeadline } from './dates.ts';

// Noon UTC keeps the calendar day identical in every real time zone, so the expectations
// below hold regardless of the machine running the tests.
describe('calculateEditDeadline', () => {
  it('adds six months and lands on 07:59:59 UTC of the following day (11:59:59 PM PST)', () => {
    expect(calculateEditDeadline(new Date('2026-01-15T12:00:00Z')).toISOString()).toBe(
      '2026-07-16T07:59:59.000Z',
    );
  });

  it('rolls over the year', () => {
    expect(calculateEditDeadline(new Date('2026-09-15T12:00:00Z')).toISOString()).toBe(
      '2027-03-16T07:59:59.000Z',
    );
  });

  it('does not mutate its input', () => {
    const start = new Date('2026-01-15T12:00:00Z');
    calculateEditDeadline(start);
    expect(start.toISOString()).toBe('2026-01-15T12:00:00.000Z');
  });

  it('rejects anything but a valid Date', () => {
    expect(() => calculateEditDeadline(new Date('nope'))).toThrow('valid Date');
    expect(() => calculateEditDeadline('2026-01-15' as unknown as Date)).toThrow('valid Date');
  });
});

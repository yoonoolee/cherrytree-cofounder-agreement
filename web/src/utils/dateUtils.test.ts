import { makeProject, timestamp } from '../test/fixtures/project.ts';
import { formatDeadline, isAfterEditDeadline, isProjectReadOnly } from './dateUtils.ts';

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

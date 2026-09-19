import { HttpsError } from 'firebase-functions/v2/https';

import { toErrorMessage, toHttpsError } from './errors.ts';

const { error: logError } = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('firebase-functions', () => ({ logger: { error: logError } }));

describe('toErrorMessage', () => {
  it('returns an Error message', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns a thrown string as-is', () => {
    expect(toErrorMessage('plain')).toBe('plain');
  });

  it('stringifies anything else', () => {
    expect(toErrorMessage(42)).toBe('42');
    expect(toErrorMessage(undefined)).toBe('undefined');
  });
});

describe('toHttpsError', () => {
  beforeEach(() => {
    logError.mockClear();
  });

  it('passes an HttpsError through unchanged, after logging it', () => {
    const original = new HttpsError('permission-denied', 'nope');
    expect(toHttpsError(original, 'Error doing x:', 'Something failed')).toBe(original);
    expect(logError).toHaveBeenCalledWith('Error doing x:', original);
  });

  it('hides any other error behind an opaque internal error', () => {
    const result = toHttpsError(
      new Error('ECONNRESET db-host'),
      'Error doing x:',
      'Something failed',
    );
    expect(result).toBeInstanceOf(HttpsError);
    expect(result.code).toBe('internal');
    expect(result.message).toBe('Something failed');
  });
});

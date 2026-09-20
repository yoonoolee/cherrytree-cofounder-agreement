import { toErrorMessage } from './errors.ts';

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

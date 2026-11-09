import { isValidEmail } from './validation.ts';

describe('isValidEmail', () => {
  it('accepts a plain address', () => {
    expect(isValidEmail('founder@example.com')).toBe(true);
  });

  it('rejects non-strings, malformed and over-long addresses', () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail('not an email')).toBe(false);
    expect(isValidEmail(`${'a'.repeat(250)}@example.com`)).toBe(false);
  });
});

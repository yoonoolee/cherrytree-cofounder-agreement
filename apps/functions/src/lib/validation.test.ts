import { isValidEmail, normalizeProjectName } from './validation.ts';

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

describe('normalizeProjectName', () => {
  it('trims and keeps the raw text, including characters an HTML escape would change', () => {
    expect(normalizeProjectName('  Acme & Co  ')).toBe('Acme & Co');
  });

  it('strips NUL bytes', () => {
    expect(normalizeProjectName('Ac\0me')).toBe('Acme');
  });

  it('caps the length at 100 characters', () => {
    expect(normalizeProjectName('x'.repeat(150))).toHaveLength(100);
  });

  it('returns null for non-strings and names shorter than two characters', () => {
    expect(normalizeProjectName(undefined)).toBeNull();
    expect(normalizeProjectName(42)).toBeNull();
    expect(normalizeProjectName(' a ')).toBeNull();
    expect(normalizeProjectName('')).toBeNull();
  });
});

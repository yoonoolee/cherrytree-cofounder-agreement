import { escapeHtml, isValidEmail, isValidTrustedUrl, normalizeProjectName } from './validation.ts';

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

describe('isValidTrustedUrl', () => {
  const domains = ['drive.google.com', 'storage.googleapis.com'];

  it('accepts HTTPS on an allowed host, case-insensitively', () => {
    expect(isValidTrustedUrl('https://drive.google.com/file/d/abc/view', domains)).toBe(true);
    expect(isValidTrustedUrl('https://DRIVE.GOOGLE.COM/x', domains)).toBe(true);
  });

  it('rejects other hosts, subdomains and lookalikes', () => {
    expect(isValidTrustedUrl('https://evil.com/drive.google.com', domains)).toBe(false);
    expect(isValidTrustedUrl('https://docs.google.com/x', domains)).toBe(false);
    expect(isValidTrustedUrl('https://drive.google.com.evil.com/x', domains)).toBe(false);
  });

  it('rejects non-HTTPS, unparsable and non-string input', () => {
    expect(isValidTrustedUrl('http://drive.google.com/x', domains)).toBe(false);
    expect(isValidTrustedUrl('not a url', domains)).toBe(false);
    expect(isValidTrustedUrl(null, domains)).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`Acme & Co <"it's">`)).toBe('Acme &amp; Co &lt;&quot;it&#x27;s&quot;&gt;');
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

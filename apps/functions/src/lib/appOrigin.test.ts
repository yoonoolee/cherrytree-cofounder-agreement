import { HttpsError } from 'firebase-functions/v2/https';

import { resolveAppOrigin } from './appOrigin.ts';

describe('resolveAppOrigin', () => {
  beforeEach(() => {
    process.env.APP_ORIGIN = 'https://app.example.com';
  });

  it('echoes the app origin or the local dev server', () => {
    expect(resolveAppOrigin('https://app.example.com')).toBe('https://app.example.com');
    expect(resolveAppOrigin('http://localhost:3000')).toBe('http://localhost:3000');
    expect(resolveAppOrigin(['http://localhost:3000'])).toBe('http://localhost:3000');
  });

  it('falls back to the configured origin for anything else', () => {
    expect(resolveAppOrigin('https://evil.example')).toBe('https://app.example.com');
    expect(resolveAppOrigin('https://app.example.com.evil.example')).toBe(
      'https://app.example.com',
    );
    expect(resolveAppOrigin('http://localhost:3001')).toBe('https://app.example.com');
    expect(resolveAppOrigin(undefined)).toBe('https://app.example.com');
  });

  it('fails loudly when APP_ORIGIN is missing', () => {
    process.env.APP_ORIGIN = '';
    expect(() => resolveAppOrigin('http://localhost:3000')).toThrow(HttpsError);
  });
});

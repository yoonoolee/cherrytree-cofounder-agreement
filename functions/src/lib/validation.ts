import validator from 'validator';

import { EMAIL_MAX_LENGTH, PROJECT_NAME_MAX_LENGTH, PROJECT_NAME_MIN_LENGTH } from '../config.ts';

/**
 * Basic email check for early feedback; Clerk/Resend do the authoritative validation.
 */
export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && validator.isEmail(email) && email.length <= EMAIL_MAX_LENGTH;
}

/**
 * Whether `url` is HTTPS and its hostname exactly matches one of `allowedDomains`.
 * Guards URLs received from external services (e.g. PDF links from Make.com) before storage.
 */
export function isValidTrustedUrl(url: unknown, allowedDomains: readonly string[]): url is string {
  if (typeof url !== 'string') return false;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') return false;

    const hostname = parsedUrl.hostname.toLowerCase();
    return allowedDomains.some((domain) => domain.toLowerCase() === hostname);
  } catch {
    return false;
  }
}

/**
 * HTML-escapes text for an HTML rendering boundary (the Make.com PDF payload). Stored data
 * is never escaped: escape at output, not at input.
 */
export function escapeHtml(text: string): string {
  return validator.escape(text);
}

/**
 * Normalizes a user-entered project/company name for storage: strips NUL bytes, trims, caps
 * the length. Returns `null` when the result is too short to be a name. The value is stored
 * raw and escaped only where it is rendered (see `escapeHtml`).
 */
export function normalizeProjectName(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  const name = input.replace(/\0/g, '').trim().slice(0, PROJECT_NAME_MAX_LENGTH).trim();
  return name.length >= PROJECT_NAME_MIN_LENGTH ? name : null;
}

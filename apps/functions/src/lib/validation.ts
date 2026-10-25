import validator from 'validator';

import { EMAIL_MAX_LENGTH, PROJECT_NAME_MAX_LENGTH, PROJECT_NAME_MIN_LENGTH } from '../config.ts';

/**
 * Basic email check for early feedback; Clerk/Resend do the authoritative validation.
 */
export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && validator.isEmail(email) && email.length <= EMAIL_MAX_LENGTH;
}

/**
 * Normalizes a user-entered project/company name for storage: strips NUL bytes, trims, caps
 * the length. Returns `null` when the result is too short to be a name.
 * The value is stored raw; escape it where it is rendered.
 */
export function normalizeProjectName(input: unknown): string | null {
  if (typeof input !== 'string') return null;

  const name = input.replace(/\0/g, '').trim().slice(0, PROJECT_NAME_MAX_LENGTH).trim();
  return name.length >= PROJECT_NAME_MIN_LENGTH ? name : null;
}

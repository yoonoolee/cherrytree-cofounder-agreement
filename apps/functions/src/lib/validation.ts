import validator from 'validator';

import { EMAIL_MAX_LENGTH } from '../config.ts';

/**
 * Basic email check for early feedback; Clerk/Resend do the authoritative validation.
 */
export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && validator.isEmail(email) && email.length <= EMAIL_MAX_LENGTH;
}

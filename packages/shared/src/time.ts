import { z } from 'zod';

/**
 * A Firestore `Timestamp` from either SDK (`firebase/firestore` or `firebase-admin`).
 * Only the members the app relies on are declared, so both SDK classes satisfy it.
 */
export interface TimestampLike {
  toDate(): Date;
  toMillis(): number;
}

/**
 * JSON Schema of a Firestore timestamp. The agent service's Pydantic models are generated from
 * these schemas (`z.toJSONSchema`), and the Python Firestore client reads timestamps as datetimes.
 */
const DATE_TIME_JSON_SCHEMA = { type: 'string', format: 'date-time' };

export const timestampSchema = z
  .custom<TimestampLike>(
    (value) =>
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Partial<TimestampLike>).toDate === 'function' &&
      typeof (value as Partial<TimestampLike>).toMillis === 'function',
    { message: 'Expected a Firestore Timestamp' },
  )
  .meta(DATE_TIME_JSON_SCHEMA);

/** A value read from Firestore that may already be a `Date` (written server-side) or a `Timestamp`. */
export const storedDateSchema = z.union([timestampSchema, z.date()]).meta(DATE_TIME_JSON_SCHEMA);
export type StoredDate = z.infer<typeof storedDateSchema>;

/** Anything `toDate()` accepts. */
export type DateLike = StoredDate | string | number;

/** Normalizes a Firestore Timestamp or any `Date` constructor input to a `Date`. */
export function toDate(value: DateLike): Date {
  return typeof value === 'object' && 'toDate' in value ? value.toDate() : new Date(value);
}

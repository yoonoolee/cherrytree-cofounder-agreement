import { z } from 'zod';

/**
 * A Firestore `Timestamp` from either SDK (`firebase/firestore` or `firebase-admin`).
 * Only the members the app relies on are declared, so both SDK classes satisfy it.
 */
export interface TimestampLike {
  toDate(): Date;
  toMillis(): number;
}

export const timestampSchema = z.custom<TimestampLike>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<TimestampLike>).toDate === 'function' &&
    typeof (value as Partial<TimestampLike>).toMillis === 'function',
  { message: 'Expected a Firestore Timestamp' },
);

/** A value read from Firestore that may already be a `Date` (written server-side) or a `Timestamp`. */
export const storedDateSchema = z.union([timestampSchema, z.date()]);
export type StoredDate = z.infer<typeof storedDateSchema>;

/** Anything `toDate()` accepts. */
export type DateLike = StoredDate | string | number;

/** Normalizes a Firestore Timestamp or any `Date` constructor input to a `Date`. */
export function toDate(value: DateLike): Date {
  return typeof value === 'object' && 'toDate' in value ? value.toDate() : new Date(value);
}

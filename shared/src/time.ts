/**
 * A Firestore `Timestamp` from either SDK (`firebase/firestore` or `firebase-admin`).
 * Only the members the app relies on are declared, so both SDK classes satisfy it.
 */
export interface TimestampLike {
  toDate(): Date;
  toMillis(): number;
}

/** A value read from Firestore that may already be a `Date` (written server-side) or a `Timestamp`. */
export type StoredDate = TimestampLike | Date;

/** Anything `toDate()` accepts. */
export type DateLike = StoredDate | string | number;

/** Normalizes a Firestore Timestamp or any `Date` constructor input to a `Date`. */
export function toDate(value: DateLike): Date {
  return typeof value === 'object' && 'toDate' in value ? value.toDate() : new Date(value);
}

import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from 'firebase/firestore';
import type { z } from 'zod';

/**
 * Types a collection by its shared schema. Writes go out unchanged (they may carry
 * `serverTimestamp()` sentinels); reads are validated, so a malformed document fails here
 * instead of deep in the UI. Pending server timestamps read as local estimates rather than
 * `null`, so a document the app just wrote still validates.
 */
export function schemaConverter<T extends DocumentData>(
  schema: z.ZodType<T>,
): FirestoreDataConverter<T> {
  return {
    toFirestore: (data: WithFieldValue<T>) => data,
    fromFirestore: (snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) =>
      schema.parse(snapshot.data({ serverTimestamps: 'estimate', ...options })),
  };
}

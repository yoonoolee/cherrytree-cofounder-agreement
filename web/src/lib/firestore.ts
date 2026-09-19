import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from 'firebase/firestore';

/**
 * Types a collection without transforming anything: documents are read and written exactly as
 * stored, and `T` is the shape the app expects (the shared domain types). Reads therefore stay
 * defensive where a document may predate a field.
 */
export function castConverter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data: WithFieldValue<T>) => data,
    fromFirestore: (snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) =>
      snapshot.data(options) as T,
  };
}

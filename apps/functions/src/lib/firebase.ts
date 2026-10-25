/**
 * Admin SDK singletons. Importing this module initializes the default app once.
 *
 * Collections are typed by their shared schemas: reads are validated, writes go out unchanged
 * (they may carry `FieldValue` sentinels).
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  getFirestore,
  type CollectionReference,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { projectSchema, timestampSchema, userDocSchema } from '@cherrytree/shared';
import { z } from 'zod';

if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
export const auth = getAuth();

/** `stripeEvents/{eventId}` — marker that a Stripe webhook event was fully processed. */
const stripeEventRecordSchema = z.object({
  type: z.string(),
  processedAt: timestampSchema,
});

function collection<T extends DocumentData>(
  name: string,
  schema: z.ZodType<T>,
): CollectionReference<T> {
  const converter: FirestoreDataConverter<T> = {
    toFirestore: (data) => data,
    fromFirestore: (snapshot: QueryDocumentSnapshot) => schema.parse(snapshot.data()),
  };
  return db.collection(name).withConverter(converter);
}

export const projects = collection('projects', projectSchema);
export const users = collection('users', userDocSchema);
export const stripeEvents = collection('stripeEvents', stripeEventRecordSchema);

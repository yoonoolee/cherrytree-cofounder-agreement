/**
 * Admin SDK singletons. Importing this module initializes the default app once.
 *
 * Collections are typed with cast-only converters: documents are trusted server-side data,
 * so no runtime validation happens here — the types describe what the writers in this
 * package store.
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
import type { Project, TimestampLike, UserDoc } from '@cherrytree/shared';

if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
export const auth = getAuth();

/** `stripeEvents/{eventId}` — marker that a Stripe webhook event was fully processed. */
export interface StripeEventRecord {
  type: string;
  processedAt: TimestampLike;
}

function converter<T>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data) => data as DocumentData,
    fromFirestore: (snapshot: QueryDocumentSnapshot) => snapshot.data() as T,
  };
}

function collection<T>(name: string): CollectionReference<T> {
  return db.collection(name).withConverter(converter<T>());
}

export const projects = collection<Project>('projects');
export const users = collection<UserDoc>('users');
export const stripeEvents = collection<StripeEventRecord>('stripeEvents');

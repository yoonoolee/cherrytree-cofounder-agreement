/**
 * Firebase SDK singletons and typed references to the collections the app reads and writes.
 * Import `db`/`auth`/`functions` for anything else; prefer the typed refs for documents.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getFirestore,
  type DocumentReference,
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import type { Project, ProWaitlistSignup, UserDoc } from '@cherrytree/shared';

import { env } from './env.ts';
import { castConverter } from './firestore.ts';

const app = initializeApp(env.firebase);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-west2');
export const auth = getAuth(app);

// App Check: every callable enforces it (functions/src/config.ts), so it runs in every mode.
// Built bundles exchange reCAPTCHA v3 for tokens (site key from the reCAPTCHA admin console).
// The dev server uses a debug token instead: the SDK prints one to the browser console on
// first run; register it under App Check → Apps → Manage debug tokens in the Firebase console
// of the dev project. It is stored in this browser profile, so this happens once per browser.
if (env.isDev) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(env.recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
} catch (error) {
  console.error('Error initializing App Check:', error);
}

// Connect to emulators in development
if (env.isDev && env.useEmulators) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099');
}

/** `projects/{clerkOrgId}` */
export const projects = collection(db, 'projects').withConverter(castConverter<Project>());
/** `users/{clerkUserId}` */
export const users = collection(db, 'users').withConverter(castConverter<UserDoc>());
/** `proWaitlist/{autoId}` */
export const proWaitlist = collection(db, 'proWaitlist').withConverter(
  castConverter<ProWaitlistSignup>(),
);

export const projectRef = (projectId: string): DocumentReference<Project> =>
  doc(projects, projectId);
export const userRef = (userId: string): DocumentReference<UserDoc> => doc(users, userId);

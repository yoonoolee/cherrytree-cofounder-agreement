/**
 * Firebase SDK singletons and typed references to the collections the app reads and writes.
 * Import `auth`/`functions` for anything else; documents go through the typed refs.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getFirestore,
  orderBy,
  query,
  type DocumentReference,
  type Query,
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import {
  advisorStateSchema,
  advisorTurnSchema,
  projectSchema,
  proWaitlistSignupSchema,
  userDocSchema,
  type AdvisorState,
  type AdvisorTurn,
  type Project,
  type UserDoc,
} from '@cherrytree/shared';

import { env } from './env.ts';
import { schemaConverter } from './firestore.ts';

const app = initializeApp(env.firebase);
const db = getFirestore(app);
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
function startAppCheck(): AppCheck | null {
  try {
    return initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(env.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.error('Error initializing App Check:', error);
    return null;
  }
}
/** `null` if App Check failed to start; requests to the agent service then cannot be made. */
export const appCheck = startAppCheck();

// Connect to emulators in development
if (env.isDev && env.useEmulators) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099');
}

const projects = collection(db, 'projects').withConverter(schemaConverter(projectSchema));
const users = collection(db, 'users').withConverter(schemaConverter(userDocSchema));

/** `projects/{clerkOrgId}` */
export const projectRef = (projectId: string): DocumentReference<Project> =>
  doc(projects, projectId);
/** `users/{clerkUserId}` */
export const userRef = (userId: string): DocumentReference<UserDoc> => doc(users, userId);
/** `projects/{clerkOrgId}/advisor/state` — written only by the agent service. */
export const advisorStateRef = (projectId: string): DocumentReference<AdvisorState> =>
  doc(db, 'projects', projectId, 'advisor', 'state').withConverter(
    schemaConverter(advisorStateSchema),
  );
/** `projects/{clerkOrgId}/turns`, oldest first — written only by the agent service. */
export const advisorTurnsQuery = (projectId: string): Query<AdvisorTurn> =>
  query(
    collection(db, 'projects', projectId, 'turns').withConverter(
      schemaConverter(advisorTurnSchema),
    ),
    orderBy('index'),
  );
/** `proWaitlist` — append-only from the client (`addDoc`). */
export const proWaitlist = collection(db, 'proWaitlist').withConverter(
  schemaConverter(proWaitlistSignupSchema),
);

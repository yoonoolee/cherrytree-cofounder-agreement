/**
 * Firestore security rules, exercised against the emulator. Runs only via `npm run test:rules`
 * (firebase emulators:exec sets FIRESTORE_EMULATOR_HOST, which enables this project).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';

const ADMIN = 'user_admin';
const STRANGER = 'user_stranger';
const PROJECT = 'org_1';

const project = {
  name: 'Acme',
  members: { [ADMIN]: { role: 'admin' } },
  onboardingCompleted: { [ADMIN]: false },
  currentPlan: 'starter',
  payments: { cs_1: { plan: 'starter' } },
  createdAt: new Date(0),
  lastUpdated: new Date(0),
  lastOpened: new Date(0),
};

let env: RulesTestEnvironment;

const asUser = (uid: string): Firestore => env.authenticatedContext(uid).firestore() as never;
const anonymous = (): Firestore => env.unauthenticatedContext().firestore() as never;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-cherrytree',
    firestore: {
      rules: readFileSync(path.resolve(import.meta.dirname, '../../../../firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore() as never as Firestore;
    await setDoc(doc(db, 'projects', PROJECT), project);
    await setDoc(doc(db, 'users', ADMIN), { userId: ADMIN, email: 'admin@example.com' });
    await setDoc(doc(db, 'users', STRANGER), { userId: STRANGER, email: 'other@example.com' });
    await setDoc(doc(db, 'stripeEvents', 'evt_1'), { type: 'checkout.session.completed' });
  });
});

describe('users', () => {
  it('lets a user read only their own document', async () => {
    await assertSucceeds(getDoc(doc(asUser(ADMIN), 'users', ADMIN)));
    await assertFails(getDoc(doc(asUser(ADMIN), 'users', STRANGER)));
    await assertFails(getDoc(doc(anonymous(), 'users', ADMIN)));
  });

  it('never lets a client write a user document', async () => {
    await assertFails(updateDoc(doc(asUser(ADMIN), 'users', ADMIN), { firstName: 'x' }));
    await assertFails(
      updateDoc(doc(asUser(ADMIN), 'users', ADMIN), { stripeCustomerId: 'cus_victim' }),
    );
    await assertFails(setDoc(doc(asUser(STRANGER), 'users', STRANGER), { email: 'new@x.com' }));
    await assertFails(deleteDoc(doc(asUser(ADMIN), 'users', ADMIN)));
  });
});

describe('projects: reading', () => {
  it('a member can get the project', async () => {
    await assertSucceeds(getDoc(doc(asUser(ADMIN), 'projects', PROJECT)));
  });

  it('strangers and anonymous users cannot', async () => {
    await assertFails(getDoc(doc(asUser(STRANGER), 'projects', PROJECT)));
    await assertFails(getDoc(doc(anonymous(), 'projects', PROJECT)));
  });

  it('nobody can list projects, even with a query on their own uid', async () => {
    await assertFails(getDocs(query(collection(asUser(ADMIN), 'projects'), limit(10))));
    await assertFails(
      getDocs(
        query(collection(asUser(ADMIN), 'projects'), where(`members.${ADMIN}.role`, '==', 'admin')),
      ),
    );
    await assertFails(getDocs(query(collection(asUser(STRANGER), 'projects'), limit(100))));
  });
});

describe('projects: lifecycle', () => {
  it('cannot be created or deleted from the client, not even by a member', async () => {
    await assertFails(setDoc(doc(asUser(ADMIN), 'projects', 'org_new'), { ...project }));
    await assertFails(deleteDoc(doc(asUser(ADMIN), 'projects', PROJECT)));
  });
});

describe('projects: updating', () => {
  it('allows the onboarding flag and lastOpened', async () => {
    const ref = doc(asUser(ADMIN), 'projects', PROJECT);
    await assertSucceeds(updateDoc(ref, { [`onboardingCompleted.${ADMIN}`]: true }));
    await assertSucceeds(updateDoc(ref, { lastOpened: serverTimestamp() }));
  });

  it('locks every server-owned field', async () => {
    const ref = doc(asUser(ADMIN), 'projects', PROJECT);
    await assertFails(updateDoc(ref, { [`members.${STRANGER}`]: { role: 'admin' } }));
    await assertFails(updateDoc(ref, { [`members.${ADMIN}.role`]: 'owner' }));
    await assertFails(updateDoc(ref, { name: 'Renamed' }));
    await assertFails(updateDoc(ref, { payments: {} }));
    await assertFails(updateDoc(ref, { currentPlan: 'pro' }));
    await assertFails(updateDoc(ref, { lastUpdated: serverTimestamp() }));
    await assertFails(updateDoc(ref, { draft: 'x' }));
    // A permitted field does not smuggle a locked one through.
    await assertFails(updateDoc(ref, { lastOpened: serverTimestamp(), currentPlan: 'pro' }));
    // Writing a locked field's current value back is a no-op diff and therefore allowed.
    await assertSucceeds(updateDoc(ref, { currentPlan: 'starter' }));
  });

  it('denies strangers and anonymous users', async () => {
    const update = { lastOpened: serverTimestamp() };
    await assertFails(updateDoc(doc(asUser(STRANGER), 'projects', PROJECT), update));
    await assertFails(updateDoc(doc(anonymous(), 'projects', PROJECT), update));
  });
});

describe('proWaitlist', () => {
  const signup = { email: 'founder@example.com', timestamp: serverTimestamp(), source: 'pricing' };

  it('accepts an anonymous signup with exactly the form fields', async () => {
    await assertSucceeds(addDoc(collection(anonymous(), 'proWaitlist'), signup));
    await assertSucceeds(addDoc(collection(asUser(STRANGER), 'proWaitlist'), signup));
  });

  it('rejects extra fields, malformed emails, client timestamps and reads', async () => {
    const waitlist = collection(anonymous(), 'proWaitlist');
    await assertFails(addDoc(waitlist, { ...signup, admin: true }));
    await assertFails(addDoc(waitlist, { ...signup, email: 'not-an-email' }));
    await assertFails(addDoc(waitlist, { ...signup, email: 42 }));
    await assertFails(addDoc(waitlist, { ...signup, email: `${'a'.repeat(250)}@example.com` }));
    await assertFails(addDoc(waitlist, { ...signup, timestamp: new Date(0) }));
    await assertFails(addDoc(waitlist, { ...signup, source: 'x'.repeat(101) }));
    await assertFails(getDocs(query(waitlist, limit(1))));
  });
});

describe('stripeEvents and unknown collections', () => {
  it('are server-side only', async () => {
    await assertFails(getDoc(doc(asUser(ADMIN), 'stripeEvents', 'evt_1')));
    await assertFails(setDoc(doc(asUser(ADMIN), 'stripeEvents', 'evt_2'), { type: 'x' }));
    await assertFails(setDoc(doc(asUser(ADMIN), 'somethingElse', 'x'), { a: 1 }));
  });
});

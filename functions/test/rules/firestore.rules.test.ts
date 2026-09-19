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
const MEMBER = 'user_member';
const FORMER = 'user_former';
const STRANGER = 'user_stranger';
const PROJECT = 'org_1';

const project = {
  name: 'Acme',
  admin: ADMIN,
  collaborators: {
    [ADMIN]: { role: 'admin', isActive: true, history: [{ startAt: new Date(0), endAt: null }] },
    [MEMBER]: {
      role: 'collaborator',
      isActive: true,
      history: [{ startAt: new Date(0), endAt: null }],
    },
    [FORMER]: {
      role: 'collaborator',
      isActive: false,
      history: [{ startAt: new Date(0), endAt: new Date(1) }],
    },
  },
  approvals: { [ADMIN]: false, [MEMBER]: false },
  onboardingCompleted: { [ADMIN]: true },
  surveyData: { companyName: 'Acme' },
  pdfAgreements: [],
  latestPdfUrl: null,
  currentPlan: 'starter',
  payments: { cs_1: { plan: 'starter' } },
  editDeadline: new Date('2027-01-01T00:00:00Z'),
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
      rules: readFileSync(path.resolve(import.meta.dirname, '../../../firestore.rules'), 'utf8'),
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
    await setDoc(doc(db, 'users', MEMBER), { userId: MEMBER, email: 'member@example.com' });
    await setDoc(doc(db, 'stripeEvents', 'evt_1'), { type: 'checkout.session.completed' });
  });
});

describe('users', () => {
  it('lets a user read only their own document', async () => {
    await assertSucceeds(getDoc(doc(asUser(ADMIN), 'users', ADMIN)));
    await assertFails(getDoc(doc(asUser(ADMIN), 'users', MEMBER)));
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
  it('admin and active collaborators can get the project', async () => {
    await assertSucceeds(getDoc(doc(asUser(ADMIN), 'projects', PROJECT)));
    await assertSucceeds(getDoc(doc(asUser(MEMBER), 'projects', PROJECT)));
  });

  it('former collaborators, strangers and anonymous users cannot', async () => {
    await assertFails(getDoc(doc(asUser(FORMER), 'projects', PROJECT)));
    await assertFails(getDoc(doc(asUser(STRANGER), 'projects', PROJECT)));
    await assertFails(getDoc(doc(anonymous(), 'projects', PROJECT)));
  });

  it('nobody can list projects, even with a query on their own uid', async () => {
    await assertFails(getDocs(query(collection(asUser(ADMIN), 'projects'), limit(10))));
    await assertFails(
      getDocs(query(collection(asUser(ADMIN), 'projects'), where('admin', '==', ADMIN))),
    );
    await assertFails(getDocs(query(collection(asUser(STRANGER), 'projects'), limit(100))));
  });
});

describe('projects: lifecycle', () => {
  it('cannot be created or deleted from the client, not even by the admin', async () => {
    await assertFails(setDoc(doc(asUser(ADMIN), 'projects', 'org_new'), { ...project }));
    await assertFails(deleteDoc(doc(asUser(ADMIN), 'projects', PROJECT)));
  });
});

describe('projects: updating', () => {
  it('allows the auto-save write shape from admin and active collaborators', async () => {
    const autoSave = {
      surveyData: { companyName: 'Acme Inc' },
      lastUpdated: serverTimestamp(),
      lastEditedBy: 'member@example.com',
      approvals: {},
    };
    await assertSucceeds(updateDoc(doc(asUser(MEMBER), 'projects', PROJECT), autoSave));
    await assertSucceeds(updateDoc(doc(asUser(ADMIN), 'projects', PROJECT), autoSave));
  });

  it('allows approvals, onboarding flags, lastOpened and updatedAt', async () => {
    const ref = doc(asUser(MEMBER), 'projects', PROJECT);
    await assertSucceeds(updateDoc(ref, { approvals: { [ADMIN]: false, [MEMBER]: true } }));
    await assertSucceeds(updateDoc(ref, { [`onboardingCompleted.${MEMBER}`]: true }));
    await assertSucceeds(updateDoc(ref, { lastOpened: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref, { updatedAt: serverTimestamp() }));
  });

  it('locks every server-owned field, including for the admin', async () => {
    const ref = doc(asUser(ADMIN), 'projects', PROJECT);
    await assertFails(updateDoc(ref, { admin: MEMBER }));
    await assertFails(updateDoc(ref, { name: 'Renamed' }));
    await assertFails(updateDoc(ref, { [`collaborators.${STRANGER}`]: { isActive: true } }));
    await assertFails(updateDoc(ref, { [`collaborators.${FORMER}.isActive`]: true }));
    await assertFails(updateDoc(ref, { payments: {} }));
    await assertFails(updateDoc(ref, { editDeadline: new Date('2099-01-01') }));
    await assertFails(updateDoc(ref, { pdfAgreements: [{ url: 'https://evil.example/x.pdf' }] }));
    await assertFails(updateDoc(ref, { latestPdfUrl: 'https://evil.example/x.pdf' }));
    await assertFails(updateDoc(ref, { currentPlan: 'pro' }));
    await assertFails(updateDoc(ref, { previewPdfUrl: 'https://evil.example/x.pdf' }));
    // A permitted field does not smuggle a locked one through.
    await assertFails(updateDoc(ref, { surveyData: { companyName: 'x' }, currentPlan: 'pro' }));
    // Writing a locked field's current value back is a no-op diff and therefore allowed.
    await assertSucceeds(updateDoc(ref, { currentPlan: 'starter' }));
  });

  it('denies former collaborators and strangers', async () => {
    await assertFails(
      updateDoc(doc(asUser(FORMER), 'projects', PROJECT), { surveyData: { companyName: 'x' } }),
    );
    await assertFails(
      updateDoc(doc(asUser(STRANGER), 'projects', PROJECT), { surveyData: { companyName: 'x' } }),
    );
    await assertFails(
      updateDoc(doc(anonymous(), 'projects', PROJECT), { surveyData: { companyName: 'x' } }),
    );
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

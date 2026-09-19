/**
 * Clerk webhook: keeps Firebase Auth and Firestore in step with Clerk users and organization
 * memberships. Events are verified with Svix over the raw request body; one handler per event.
 * Handlers are idempotent so that a redelivery (Svix retries any non-2xx) is harmless.
 */
import type {
  OrganizationMembershipJSON,
  UserDeletedJSON,
  UserJSON,
  WebhookEvent,
} from '@clerk/backend';
import type express from 'express';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import { Webhook } from 'svix';
import {
  CONDITIONAL_ACKNOWLEDGMENT_FIELDS,
  REQUIRED_ACKNOWLEDGMENT_FIELDS,
  type AcknowledgmentMap,
  type Collaborator,
  type Project,
} from '@cherrytree/shared';

import { CLERK_WEBHOOK_SECRET, WEBHOOK_OPTIONS } from './config.ts';
import { auth, projects, users } from './lib/firebase.ts';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

function primaryEmailOf(user: UserJSON) {
  return user.email_addresses?.find((email) => email.id === user.primary_email_address_id);
}

function displayNameOf(user: UserJSON, emailAddress: string): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || emailAddress.split('@')[0]!;
}

function firebaseAuthProfile(
  user: UserJSON,
  email: NonNullable<ReturnType<typeof primaryEmailOf>>,
) {
  return {
    email: email.email_address,
    displayName: displayNameOf(user, email.email_address),
    photoURL: user.image_url || null,
    emailVerified: email.verification?.status === 'verified',
  };
}

/** `code` of a Firebase Auth error, if any. */
function authErrorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined;
}

async function handleUserCreated(user: UserJSON): Promise<void> {
  const primaryEmail = primaryEmailOf(user);
  if (!user.id || !primaryEmail) return;

  try {
    await auth.createUser({ uid: user.id, ...firebaseAuthProfile(user, primaryEmail) });
  } catch (error) {
    // A redelivered event finds the user already there.
    if (authErrorCode(error) !== 'auth/uid-already-exists') {
      logger.error('Error creating Firebase Auth user:', error);
    }
  }

  // Clerk timestamps; the sign-in time falls back to creation for brand-new users.
  const createdAt = Timestamp.fromMillis(user.created_at || Date.now());
  await users.doc(user.id).set({
    userId: user.id,
    email: primaryEmail.email_address,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    picture: user.image_url || null,
    createdAt,
    lastLoginAt: user.last_sign_in_at ? Timestamp.fromMillis(user.last_sign_in_at) : createdAt,
    deleted: false,
  });
}

async function handleUserUpdated(user: UserJSON): Promise<void> {
  const primaryEmail = primaryEmailOf(user);
  if (!user.id || !primaryEmail) return;

  const profile = firebaseAuthProfile(user, primaryEmail);
  try {
    await auth.updateUser(user.id, profile);
  } catch (error) {
    if (authErrorCode(error) !== 'auth/user-not-found') {
      logger.error('Error updating Firebase Auth user:', error);
    } else {
      // Users that predate the webhook are created on their first update.
      try {
        await auth.createUser({ uid: user.id, ...profile });
      } catch (createError) {
        logger.error('Error creating Firebase Auth user:', createError);
      }
    }
  }

  await users.doc(user.id).set(
    {
      userId: user.id,
      email: primaryEmail.email_address,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      picture: user.image_url || null,
      lastLoginAt: user.last_sign_in_at ? Timestamp.fromMillis(user.last_sign_in_at) : null,
      deleted: false,
    },
    { merge: true },
  );
}

async function handleUserDeleted(user: UserDeletedJSON): Promise<void> {
  if (!user.id) return;

  try {
    await auth.deleteUser(user.id);
  } catch (error) {
    // Nothing to remove when the user never reached Firebase Auth.
    logger.error('Error deleting Firebase Auth user:', error);
  }

  // The document is kept (pseudonymised elsewhere if ever needed); only flagged.
  const userRef = users.doc(user.id);
  if ((await userRef.get()).exists) {
    await userRef.update({ deleted: true, deletedAt: FieldValue.serverTimestamp() });
  }
}

// ---------------------------------------------------------------------------
// Organization memberships (organization id === project id)
// ---------------------------------------------------------------------------

type AcknowledgmentFields = Record<string, AcknowledgmentMap | undefined>;

/** Name fields copied from the user document; `''` when the document is missing. */
async function collaboratorNameOf(
  userId: string,
): Promise<Pick<Collaborator, 'firstName' | 'lastName'>> {
  try {
    const user = (await users.doc(userId).get()).data();
    return { firstName: user?.firstName || '', lastName: user?.lastName || '' };
  } catch (error) {
    logger.error('Error fetching user data:', error);
    return { firstName: '', lastName: '' };
  }
}

/**
 * Adds (or re-activates) a collaborator: open history entry, approval and onboarding flags,
 * and a `false` in every acknowledgment map. Mutates and returns the update payload only.
 */
function membershipCreatedUpdate(
  project: Project,
  userId: string,
  name: Pick<Collaborator, 'firstName' | 'lastName'>,
  joinTime: Date,
) {
  const collaborators = project.collaborators ?? {};
  const approvals = project.approvals ?? {};
  const onboardingCompleted = project.onboardingCompleted ?? {};
  const surveyData = (project.surveyData ?? {}) as AcknowledgmentFields;

  const existing = collaborators[userId];
  if (existing) {
    // Rejoining: a new period only if the previous one was closed.
    const history = existing.history ?? [];
    if (!history.some((entry) => entry.endAt === null)) {
      history.push({ startAt: joinTime, endAt: null });
    }
    existing.history = history;
    existing.isActive = true;
    existing.firstName = name.firstName;
    existing.lastName = name.lastName;
  } else {
    collaborators[userId] = {
      role: 'collaborator',
      isActive: true,
      ...name,
      history: [{ startAt: joinTime, endAt: null }],
    };
  }

  approvals[userId] = false;

  for (const field of REQUIRED_ACKNOWLEDGMENT_FIELDS) {
    surveyData[field] = { ...surveyData[field], [userId]: false };
  }
  // Conditional maps exist only while their parent question is answered.
  for (const field of CONDITIONAL_ACKNOWLEDGMENT_FIELDS) {
    if (surveyData[field]) {
      surveyData[field] = { ...surveyData[field], [userId]: false };
    }
  }

  if (typeof onboardingCompleted[userId] === 'undefined') {
    onboardingCompleted[userId] = false;
  }

  return {
    collaborators,
    approvals,
    onboardingCompleted,
    surveyData: surveyData as Project['surveyData'],
    lastUpdated: FieldValue.serverTimestamp(),
  };
}

/** Closes the collaborator's history entry and removes them from approvals and acknowledgments. */
function membershipDeletedUpdate(project: Project, userId: string, leaveTime: Date) {
  const collaborators = project.collaborators ?? {};
  const approvals = project.approvals ?? {};
  const surveyData = (project.surveyData ?? {}) as AcknowledgmentFields;

  const collaborator = collaborators[userId];
  if (collaborator) {
    const current = (collaborator.history ?? []).find((entry) => entry.endAt === null);
    if (current) current.endAt = leaveTime;
    collaborator.isActive = false;
  }

  delete approvals[userId];

  for (const field of [...REQUIRED_ACKNOWLEDGMENT_FIELDS, ...CONDITIONAL_ACKNOWLEDGMENT_FIELDS]) {
    if (surveyData[field]) {
      delete surveyData[field][userId];
    }
  }

  return {
    collaborators,
    approvals,
    surveyData: surveyData as Project['surveyData'],
    lastUpdated: FieldValue.serverTimestamp(),
  };
}

async function handleMembershipCreated(membership: OrganizationMembershipJSON): Promise<void> {
  const userId = membership.public_user_data.user_id;
  const projectRef = projects.doc(membership.organization.id);
  const project = (await projectRef.get()).data();
  if (!project) return;

  const name = await collaboratorNameOf(userId);
  await projectRef.update(membershipCreatedUpdate(project, userId, name, new Date()));
}

async function handleMembershipDeleted(membership: OrganizationMembershipJSON): Promise<void> {
  const userId = membership.public_user_data.user_id;
  const projectRef = projects.doc(membership.organization.id);
  const project = (await projectRef.get()).data();
  if (!project) return;

  await projectRef.update(membershipDeletedUpdate(project, userId, new Date()));
}

// ---------------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------------

const SVIX_HEADERS = ['svix-id', 'svix-timestamp', 'svix-signature'] as const;

function svixHeaders(req: express.Request): Record<(typeof SVIX_HEADERS)[number], string> | null {
  const headers = {} as Record<(typeof SVIX_HEADERS)[number], string>;
  for (const name of SVIX_HEADERS) {
    const value = req.headers[name];
    if (typeof value !== 'string' || !value) return null;
    headers[name] = value;
  }
  return headers;
}

async function dispatch(event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case 'user.created':
      return handleUserCreated(event.data);
    case 'user.updated':
      return handleUserUpdated(event.data);
    case 'user.deleted':
      return handleUserDeleted(event.data);
    case 'organizationMembership.created':
      return handleMembershipCreated(event.data);
    case 'organizationMembership.deleted':
      return handleMembershipDeleted(event.data);
    default:
      return;
  }
}

export const clerkWebhook = onRequest(
  { ...WEBHOOK_OPTIONS, secrets: [CLERK_WEBHOOK_SECRET] },
  async (req, res: express.Response): Promise<void> => {
    const webhookSecret = CLERK_WEBHOOK_SECRET.value();
    if (!webhookSecret) {
      logger.error('Missing CLERK_WEBHOOK_SECRET');
      res.status(400).send('Missing webhook secret');
      return;
    }

    const headers = svixHeaders(req);
    if (!headers) {
      logger.error('Missing svix headers');
      res.status(400).send('Missing svix headers');
      return;
    }

    let event: WebhookEvent;
    try {
      // The signature covers the exact bytes Clerk sent; re-serialising req.body would break it
      // for any payload whose JSON formatting differs from what the parser reproduces.
      event = new Webhook(webhookSecret).verify(req.rawBody, headers) as WebhookEvent;
    } catch (error) {
      logger.error('Webhook verification failed:', error);
      res.status(400).send('Webhook verification failed');
      return;
    }

    try {
      await dispatch(event);
      res.json({ received: true });
    } catch (error) {
      // 5xx makes Svix retry with backoff instead of silently dropping the sync.
      logger.error('Clerk webhook error:', error);
      res.status(500).send('Webhook handler failed');
    }
  },
);

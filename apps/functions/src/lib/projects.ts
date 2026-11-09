import { FieldValue } from 'firebase-admin/firestore';
import type { Payment, Plan, Project } from '@cherrytree/shared';

import { getClerk } from './auth.ts';
import { projects } from './firebase.ts';

interface NewProject {
  userId: string;
  name: string;
  plan: Plan;
  /** Keyed by Stripe checkout session id; empty for a dev test project. */
  payments: Record<string, Payment>;
}

/**
 * Creates a project: a Clerk organization, whose id is the project id, and the
 * `projects/{clerkOrgId}` document with the user as its only member (admin). Returns the id.
 */
export async function createProject({ userId, name, plan, payments }: NewProject): Promise<string> {
  const organization = await getClerk().organizations.createOrganization({
    name,
    createdBy: userId,
  });

  const project: Omit<Project, 'createdAt' | 'lastUpdated' | 'lastOpened'> = {
    name,
    members: { [userId]: { role: 'admin' } },
    onboardingCompleted: { [userId]: false },
    currentPlan: plan,
    payments,
    draftStatus: null,
  };

  await projects.doc(organization.id).set({
    ...project,
    createdAt: FieldValue.serverTimestamp(),
    lastUpdated: FieldValue.serverTimestamp(),
    lastOpened: FieldValue.serverTimestamp(),
  });
  return organization.id;
}

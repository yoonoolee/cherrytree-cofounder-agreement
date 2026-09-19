/**
 * Firebase Cloud Functions
 *
 * This file contains server-side functions for operations that cannot be performed client-side:
 * - PDF generation via Make.com webhook
 * - Stripe payment processing
 * - Clerk webhook handling for user sync
 * - Organization management (invitations, member removal)
 *
 * Note: Authentication and email invitations are handled by Clerk.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { defineSecret } = require('firebase-functions/params');
const { Webhook } = require('svix');
const {
  REQUIRED_ACKNOWLEDGMENT_FIELDS,
  CONDITIONAL_ACKNOWLEDGMENT_FIELDS,
} = require('@cherrytree/shared');

// Guarded: src/lib/firebase.ts also initializes the app while both files are bundled.
if (getApps().length === 0) initializeApp();
const db = getFirestore();
const auth = getAuth();

// Load secrets from environment config
const CLERK_WEBHOOK_SECRET = defineSecret('CLERK_WEBHOOK_SECRET');

// Shared Cloud Functions configuration
// Optimized for free tier: 256MB memory
const FUNCTION_CONFIG = {
  region: 'us-west2',
  memory: '256MiB',
  serviceAccount: `cloud-functions@${process.env.GCLOUD_PROJECT}.iam.gserviceaccount.com`,
};

// Collaborator field constants
const COLLABORATOR_FIELDS = {
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  ROLE: 'role',
  IS_ACTIVE: 'isActive',
  HISTORY: 'history',
};

// ============================================================================
// ORGANIZATION MANAGEMENT (imported from organizations.js)
// ============================================================================

const { createOrganizationInvitation, removeOrganizationMember } = require('./organizations');

exports.createOrganizationInvitation = createOrganizationInvitation;
exports.removeOrganizationMember = removeOrganizationMember;

// ============================================================================
// CLERK WEBHOOKS
// ============================================================================

// Handle Clerk webhooks for user and organization events
exports.clerkWebhook = onRequest(
  {
    ...FUNCTION_CONFIG,
    cors: false,
    secrets: [CLERK_WEBHOOK_SECRET],
  },
  async (req, res) => {
    try {
      // Verify webhook signature using Svix
      const webhookSecret = CLERK_WEBHOOK_SECRET.value();

      if (!webhookSecret) {
        console.error('Missing CLERK_WEBHOOK_SECRET');
        return res.status(400).send('Missing webhook secret');
      }

      // Get headers
      const svixId = req.headers['svix-id'];
      const svixTimestamp = req.headers['svix-timestamp'];
      const svixSignature = req.headers['svix-signature'];

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('Missing svix headers');
        return res.status(400).send('Missing svix headers');
      }

      // Verify the webhook
      const wh = new Webhook(webhookSecret);
      let evt;

      try {
        evt = wh.verify(JSON.stringify(req.body), {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
      } catch (err) {
        console.error('Webhook verification failed:', err);
        return res.status(400).send('Webhook verification failed');
      }

      // Handle the webhook event
      const eventType = evt.type;
      switch (eventType) {
        case 'user.created': {
          const {
            id,
            email_addresses,
            first_name,
            last_name,
            image_url,
            last_sign_in_at,
            created_at,
          } = evt.data;
          const primaryEmail = email_addresses?.find(
            (e) => e.id === evt.data.primary_email_address_id,
          );

          if (id && primaryEmail) {
            // Create Firebase Auth user with Clerk user ID
            try {
              await auth.createUser({
                uid: id,
                email: primaryEmail.email_address,
                displayName:
                  [first_name, last_name].filter(Boolean).join(' ') ||
                  primaryEmail.email_address.split('@')[0],
                photoURL: image_url || null,
                emailVerified: primaryEmail.verified || false,
              });
            } catch (authError) {
              // User might already exist if this is a retry
              if (authError.code !== 'auth/uid-already-exists') {
                console.error('Error creating Firebase Auth user:', authError);
              }
            }

            // Create user document in Firestore
            // Use Clerk timestamps - created_at for both, last_sign_in_at as fallback for lastLoginAt
            const createdAtDate = created_at ? new Date(created_at) : new Date();
            await db
              .collection('users')
              .doc(id)
              .set({
                userId: id,
                email: primaryEmail.email_address,
                firstName: first_name || '',
                lastName: last_name || '',
                picture: image_url || null,
                createdAt: createdAtDate,
                lastLoginAt: last_sign_in_at ? new Date(last_sign_in_at) : createdAtDate,
                deleted: false,
              });
          }
          break;
        }

        case 'user.updated': {
          const { id, email_addresses, first_name, last_name, image_url, last_sign_in_at } =
            evt.data;
          const primaryEmail = email_addresses?.find(
            (e) => e.id === evt.data.primary_email_address_id,
          );

          if (id && primaryEmail) {
            // Update or create Firebase Auth user
            try {
              await auth.updateUser(id, {
                email: primaryEmail.email_address,
                displayName:
                  [first_name, last_name].filter(Boolean).join(' ') ||
                  primaryEmail.email_address.split('@')[0],
                photoURL: image_url || null,
                emailVerified: primaryEmail.verified || false,
              });
            } catch (authError) {
              if (authError.code === 'auth/user-not-found') {
                try {
                  await auth.createUser({
                    uid: id,
                    email: primaryEmail.email_address,
                    displayName:
                      [first_name, last_name].filter(Boolean).join(' ') ||
                      primaryEmail.email_address.split('@')[0],
                    photoURL: image_url || null,
                    emailVerified: primaryEmail.verified || false,
                  });
                } catch (createError) {
                  console.error('Error creating Firebase Auth user:', createError);
                }
              } else {
                console.error('Error updating Firebase Auth user:', authError);
              }
            }

            // Update or create user document (use set with merge for existing Clerk users)
            await db
              .collection('users')
              .doc(id)
              .set(
                {
                  userId: id,
                  email: primaryEmail.email_address,
                  firstName: first_name || '',
                  lastName: last_name || '',
                  picture: image_url || null,
                  lastLoginAt: last_sign_in_at ? new Date(last_sign_in_at) : null,
                  deleted: false,
                },
                { merge: true },
              );
          }
          break;
        }

        case 'user.deleted': {
          const { id } = evt.data;

          if (id) {
            // Delete Firebase Auth user (authentication only)
            try {
              await auth.deleteUser(id);
            } catch (authError) {
              console.error('Error deleting Firebase Auth user:', authError);
            }

            // Mark user as deleted in Firestore (only if they exist)
            try {
              const userDoc = await db.collection('users').doc(id).get();
              if (userDoc.exists) {
                await db.collection('users').doc(id).update({
                  deleted: true,
                  deletedAt: FieldValue.serverTimestamp(),
                });
              }
            } catch (firestoreError) {
              console.error('Error marking user as deleted in Firestore:', firestoreError);
            }
          }
          break;
        }

        case 'organization.created':
          break;

        case 'organizationMembership.created': {
          const { organization, public_user_data } = evt.data;
          const userId = public_user_data.user_id;
          const orgId = organization.id;
          const joinTime = new Date();

          try {
            const projectDoc = await db.collection('projects').doc(orgId).get();

            if (projectDoc.exists) {
              const projectData = projectDoc.data();
              let collaborators = projectData.collaborators || {};
              const approvals = projectData.approvals || {};

              // Fetch user's name from their profile
              let firstName = '';
              let lastName = '';
              try {
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                  const userData = userDoc.data();
                  firstName = userData[COLLABORATOR_FIELDS.FIRST_NAME] || '';
                  lastName = userData[COLLABORATOR_FIELDS.LAST_NAME] || '';
                }
              } catch (userError) {
                console.error('Error fetching user data:', userError);
              }

              if (collaborators[userId]) {
                // User rejoining - only add new history entry if they previously left
                const history = collaborators[userId][COLLABORATOR_FIELDS.HISTORY] || [];
                const hasActiveEntry = history.some((h) => h.endAt === null);

                if (!hasActiveEntry) {
                  // They left before, so add new history entry
                  collaborators[userId][COLLABORATOR_FIELDS.HISTORY].push({
                    startAt: joinTime,
                    endAt: null,
                  });
                }
                // Always ensure they're marked as active and update name
                collaborators[userId][COLLABORATOR_FIELDS.IS_ACTIVE] = true;
                collaborators[userId][COLLABORATOR_FIELDS.FIRST_NAME] = firstName;
                collaborators[userId][COLLABORATOR_FIELDS.LAST_NAME] = lastName;
              } else {
                // New collaborator
                collaborators[userId] = {
                  [COLLABORATOR_FIELDS.ROLE]: 'collaborator',
                  [COLLABORATOR_FIELDS.IS_ACTIVE]: true,
                  [COLLABORATOR_FIELDS.FIRST_NAME]: firstName,
                  [COLLABORATOR_FIELDS.LAST_NAME]: lastName,
                  [COLLABORATOR_FIELDS.HISTORY]: [{ startAt: joinTime, endAt: null }],
                };
              }

              approvals[userId] = false;

              // Initialize acknowledgment fields for new collaborator
              const surveyData = projectData.surveyData || {};
              for (const field of REQUIRED_ACKNOWLEDGMENT_FIELDS) {
                if (!surveyData[field]) {
                  surveyData[field] = {};
                }
                surveyData[field][userId] = false;
              }
              // Also add to conditional acknowledgment fields if they already exist
              for (const field of CONDITIONAL_ACKNOWLEDGMENT_FIELDS) {
                if (surveyData[field]) {
                  surveyData[field][userId] = false;
                }
              }

              // Get current onboardingCompleted map
              const onboardingCompleted = projectData.onboardingCompleted || {};
              if (typeof onboardingCompleted[userId] === 'undefined') {
                onboardingCompleted[userId] = false;
              }

              await projectDoc.ref.update({
                collaborators: collaborators,
                approvals: approvals,
                onboardingCompleted: onboardingCompleted,
                surveyData: surveyData,
                lastUpdated: FieldValue.serverTimestamp(),
              });
            }
          } catch (error) {
            console.error('Error adding collaborator to project:', error);
          }
          break;
        }

        case 'organizationMembership.deleted': {
          const { organization, public_user_data } = evt.data;
          const userId = public_user_data.user_id;
          const orgId = organization.id;
          const leaveTime = new Date();

          try {
            const projectDoc = await db.collection('projects').doc(orgId).get();

            if (projectDoc.exists) {
              const projectData = projectDoc.data();
              let collaborators = projectData.collaborators || {};
              const approvals = projectData.approvals || {};

              // Update history and set inactive
              if (collaborators[userId]) {
                const history = collaborators[userId][COLLABORATOR_FIELDS.HISTORY] || [];
                const currentEntry = history.find((h) => h.endAt === null);
                if (currentEntry) {
                  currentEntry.endAt = leaveTime;
                }
                collaborators[userId][COLLABORATOR_FIELDS.IS_ACTIVE] = false;
              }

              delete approvals[userId];

              // Remove user from all acknowledgment fields
              const surveyData = projectData.surveyData || {};
              for (const field of [
                ...REQUIRED_ACKNOWLEDGMENT_FIELDS,
                ...CONDITIONAL_ACKNOWLEDGMENT_FIELDS,
              ]) {
                if (surveyData[field]) {
                  delete surveyData[field][userId];
                }
              }

              await projectDoc.ref.update({
                collaborators: collaborators,
                approvals: approvals,
                surveyData: surveyData,
                lastUpdated: FieldValue.serverTimestamp(),
              });
            }
          } catch (error) {
            console.error('Error removing collaborator from project:', error);
          }
          break;
        }

        default:
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Clerk webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  },
);

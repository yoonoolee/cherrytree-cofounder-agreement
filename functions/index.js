/**
 * Firebase Cloud Functions
 *
 * This file contains server-side functions for operations that cannot be performed client-side:
 * - PDF generation via Make.com webhook
 * - Stripe payment processing
 * - Clerk webhook handling for user sync
 * - User management (account deletion, organization management)
 *
 * Note: Authentication and email invitations are handled by Clerk.
 */

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const axios = require('axios');
const { defineString } = require('firebase-functions/params');
const Stripe = require('stripe');
const crypto = require('crypto');
const { createClerkClient, verifyToken: clerkVerifyToken } = require('@clerk/backend');
const { Webhook } = require('svix');

initializeApp();
const db = getFirestore();
const auth = getAuth();

// Load secrets from environment config
const { defineSecret } = require('firebase-functions/params');
const MAKE_WEBHOOK_URL = defineSecret('MAKE_WEBHOOK_URL');
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const CLERK_SECRET_KEY = defineSecret('CLERK_SECRET_KEY');
const CLERK_WEBHOOK_SECRET = defineSecret('CLERK_WEBHOOK_SECRET');

// Lazy-load Clerk instance
let clerkInstance = null;
const getClerk = () => {
  if (!clerkInstance) {
    clerkInstance = createClerkClient({ secretKey: CLERK_SECRET_KEY.value() });
  }
  return clerkInstance;
};

// Shared Cloud Functions configuration
const FUNCTION_CONFIG = {
  region: 'us-west2',
  serviceAccount: `cloud-functions@${process.env.GCLOUD_PROJECT}.iam.gserviceaccount.com`,
};

// ============================================================================
// CLERK AUTHENTICATION HELPERS
// ============================================================================

/**
 * Verify Clerk session token and return user data
 * @param {string} sessionToken - Clerk session token from client
 * @returns {Promise<{userId: string, email: string}>} - User ID and email
 * @throws {HttpsError} - If token is invalid or verification fails
 */
async function verifyClerkToken(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') {
    throw new HttpsError('unauthenticated', 'Missing or invalid session token');
  }

  try {
    const clerk = getClerk();

    // Verify the session token using standalone JWT verification (no network call)
    const payload = await clerkVerifyToken(sessionToken, {
      secretKey: CLERK_SECRET_KEY.value()
    });

    if (!payload || !payload.sub) {
      throw new HttpsError('unauthenticated', 'Invalid session');
    }

    const userId = payload.sub;

    // Get user details
    const user = await clerk.users.getUser(userId);

    if (!user) {
      throw new HttpsError('unauthenticated', 'User not found');
    }

    const primaryEmail = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail) {
      throw new HttpsError('unauthenticated', 'User email not found');
    }

    return {
      userId: user.id,
      email: primaryEmail.emailAddress,
    };
  } catch (error) {
    console.error('Clerk token verification error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('unauthenticated', 'Failed to verify authentication token');
  }
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize user input to prevent XSS and injection attacks
 * @param {string} input - The input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input, maxLength = 100) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, maxLength);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// ============================================================================
// SURVEY & PDF OPERATIONS
// ============================================================================

exports.submitSurvey = onCall({
  ...FUNCTION_CONFIG,
  secrets: [MAKE_WEBHOOK_URL, CLERK_SECRET_KEY],
  invoker: 'public',
  consumeAppCheckToken: true
}, async (request) => {
  // Verify Clerk authentication
  const { sessionToken, projectId } = request.data;
  const { userId, email } = await verifyClerkToken(sessionToken);

  if (!projectId) {
    throw new HttpsError('invalid-argument', 'Project ID is required');
  }

  try {
    // Get project data
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      throw new HttpsError('not-found', 'Project not found');
    }

    const projectData = projectDoc.data();

    // Check if user is the owner (using Clerk user ID)
    if (projectData.ownerId !== userId) {
      throw new HttpsError(
        'permission-denied',
        'Only the project owner can submit'
      );
    }

    // Check if already submitted
    if (projectData.submitted) {
      throw new HttpsError('already-exists', 'Project already submitted');
    }

    // Mark as submitted
    await projectRef.update({
      submitted: true,
      submittedAt: FieldValue.serverTimestamp(),
      submittedBy: userId
    });

    // Prepare data for Make.com
    // Note: User email removed for privacy - Make.com only needs survey data for PDF generation
    const webhookData = {
      projectId: projectId,
      projectName: projectData.name,
      submittedAt: new Date().toISOString(),
      data: {
        companyName: projectData.surveyData?.companyName || '',
        industry: projectData.surveyData?.industry || '',
        targetMarket: projectData.surveyData?.targetMarket || '',
        productDescription: projectData.surveyData?.productDescription || '',
        keyFeatures: projectData.surveyData?.keyFeatures || '',
        competitiveAdvantage: projectData.surveyData?.competitiveAdvantage || '',
        fundingNeeds: projectData.surveyData?.fundingNeeds || '',
        teamSize: projectData.surveyData?.teamSize || '',
        timeline: projectData.surveyData?.timeline || '',
        additionalNotes: projectData.surveyData?.additionalNotes || ''
      }
    };

    // Send to Make.com
    const response = await axios.post(MAKE_WEBHOOK_URL.value(), webhookData, {
      timeout: 30000 // 30 second timeout
    });

    // Update project with PDF URL (with validation)
    if (response.data && response.data.pdfUrl) {
      // Validate PDF URL to prevent malicious URLs
      try {
        const pdfUrl = new URL(response.data.pdfUrl);
        // Only allow HTTPS URLs from trusted domains
        if (pdfUrl.protocol !== 'https:') {
          throw new Error('PDF URL must use HTTPS');
        }
        // Allowlist common cloud storage providers
        const allowedDomains = [
          'drive.google.com',
          'storage.googleapis.com',
          'firebasestorage.googleapis.com',
          's3.amazonaws.com',
          'dropbox.com',
          'onedrive.live.com'
        ];
        const isAllowed = allowedDomains.some(domain => pdfUrl.hostname.includes(domain));
        if (!isAllowed) {
          throw new Error('PDF URL from untrusted domain');
        }

        await projectRef.update({
          pdfUrl: response.data.pdfUrl,
          pdfGeneratedAt: FieldValue.serverTimestamp()
        });
      } catch (urlError) {
        console.error('Invalid PDF URL from Make.com:', urlError);
        throw new HttpsError('internal', 'Invalid PDF URL received');
      }
    }

    return {
      success: true,
      message: 'Survey submitted successfully',
      pdfUrl: response.data?.pdfUrl || null
    };

  } catch (error) {
    console.error('Error submitting survey:', error);
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsError
    }
    // Don't expose internal error details to client
    throw new HttpsError('internal', 'An error occurred while submitting the survey');
  }
});

// Generate preview PDF without submitting
exports.generatePreviewPDF = onCall({
  ...FUNCTION_CONFIG,
  secrets: [MAKE_WEBHOOK_URL, CLERK_SECRET_KEY],
  invoker: 'public',
  consumeAppCheckToken: true
}, async (request) => {
  // Verify Clerk authentication
  const { sessionToken, projectId } = request.data;
  const { userId, email } = await verifyClerkToken(sessionToken);

  if (!projectId) {
    throw new HttpsError('invalid-argument', 'Project ID is required');
  }

  try {
    // Get project data
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      throw new HttpsError('not-found', 'Project not found');
    }

    const projectData = projectDoc.data();

    // Check if user has access to this project (using Clerk user ID)
    const hasAccess =
      projectData.ownerId === userId ||
      (projectData.collaboratorIds || []).includes(userId);

    if (!hasAccess) {
      throw new HttpsError('permission-denied', 'No access to this project');
    }

    // Check if preview PDF already exists and is recent
    if (projectData.previewPdfUrl && projectData.previewPdfGeneratedAt) {
      const generatedAt = projectData.previewPdfGeneratedAt.toDate();
      const lastUpdated = projectData.lastUpdated?.toDate() || new Date(0);

      // If preview PDF is newer than last update, return existing URL
      if (generatedAt > lastUpdated) {
        return {
          success: true,
          pdfUrl: projectData.previewPdfUrl
        };
      }
    }

    // Prepare data for Make.com
    const webhookData = {
      projectId: projectId,
      projectName: projectData.name,
      isPreview: true, // Flag to indicate this is a preview
      data: {
        companyName: projectData.surveyData?.companyName || '',
        industry: projectData.surveyData?.industry || '',
        targetMarket: projectData.surveyData?.targetMarket || '',
        productDescription: projectData.surveyData?.productDescription || '',
        keyFeatures: projectData.surveyData?.keyFeatures || '',
        competitiveAdvantage: projectData.surveyData?.competitiveAdvantage || '',
        fundingNeeds: projectData.surveyData?.fundingNeeds || '',
        teamSize: projectData.surveyData?.teamSize || '',
        timeline: projectData.surveyData?.timeline || '',
        additionalNotes: projectData.surveyData?.additionalNotes || ''
      }
    };

    // Send to Make.com
    const response = await axios.post(MAKE_WEBHOOK_URL.value(), webhookData, {
      timeout: 30000
    });

    // Save preview PDF URL (with validation)
    if (response.data && response.data.pdfUrl) {
      // Validate PDF URL to prevent malicious URLs
      try {
        const pdfUrl = new URL(response.data.pdfUrl);
        // Only allow HTTPS URLs from trusted domains
        if (pdfUrl.protocol !== 'https:') {
          throw new Error('PDF URL must use HTTPS');
        }
        // Allowlist common cloud storage providers
        const allowedDomains = [
          'drive.google.com',
          'storage.googleapis.com',
          'firebasestorage.googleapis.com',
          's3.amazonaws.com',
          'dropbox.com',
          'onedrive.live.com'
        ];
        const isAllowed = allowedDomains.some(domain => pdfUrl.hostname.includes(domain));
        if (!isAllowed) {
          throw new Error('PDF URL from untrusted domain');
        }

        await projectRef.update({
          previewPdfUrl: response.data.pdfUrl,
          previewPdfGeneratedAt: FieldValue.serverTimestamp()
        });
      } catch (urlError) {
        console.error('Invalid PDF URL from Make.com:', urlError);
        throw new HttpsError('internal', 'Invalid PDF URL received');
      }
    }

    return {
      success: true,
      pdfUrl: response.data?.pdfUrl || null
    };

  } catch (error) {
    console.error('Error generating preview PDF:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // Don't expose internal error details to client
    throw new HttpsError('internal', 'An error occurred while generating the preview');
  }
});

// ============================================================================
// STRIPE PAYMENT OPERATIONS
// ============================================================================

// Create Stripe checkout session
exports.createCheckoutSession = onCall({
  ...FUNCTION_CONFIG,
  secrets: [STRIPE_SECRET_KEY, CLERK_SECRET_KEY],
  invoker: 'public',
  consumeAppCheckToken: true
}, async (request) => {
  // Verify Clerk authentication
  const { sessionToken, priceId, plan, projectName } = request.data;
  const { userId, email } = await verifyClerkToken(sessionToken);

  // Initialize Stripe
  const stripe = Stripe(STRIPE_SECRET_KEY.value());

  if (!priceId || !plan) {
    throw new HttpsError('invalid-argument', 'Price ID and plan are required');
  }

  if (!projectName) {
    throw new HttpsError('invalid-argument', 'Project name is required');
  }

  // Validate and sanitize project name
  const sanitizedProjectName = sanitizeInput(projectName, 100);
  if (!sanitizedProjectName || sanitizedProjectName.length < 2) {
    throw new HttpsError('invalid-argument', 'Invalid project name');
  }

  // Validate plan is one of the allowed values
  if (!['starter', 'pro'].includes(plan)) {
    throw new HttpsError('invalid-argument', 'Invalid plan type');
  }

  try {
    // Create or retrieve Stripe customer
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    let stripeCustomerId;

    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      stripeCustomerId = userDoc.data().stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          clerkUserId: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save to Firestore
      await userRef.set({
        stripeCustomerId: stripeCustomerId,
      }, { merge: true });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // one-time payment
      success_url: `${request.data.successUrl || 'https://my.cherrytree.app/dashboard'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.data.cancelUrl || 'https://my.cherrytree.app/dashboard'}?payment=cancelled`,
      metadata: {
        userId: userId,
        plan: plan,
        projectName: sanitizedProjectName,
        userEmail: email,
      },
      client_reference_id: userId,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // Don't expose internal error details to client
    throw new HttpsError('internal', 'An error occurred while creating the checkout session');
  }
});

// Handle Stripe webhooks
exports.stripeWebhook = onRequest({
  ...FUNCTION_CONFIG,
  cors: false,
  secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLERK_SECRET_KEY]
}, async (req, res) => {
  // Initialize Stripe
  const stripe = Stripe(STRIPE_SECRET_KEY.value());

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature for security
    // This ensures the request actually came from Stripe
    if (!sig) {
      console.error('Missing stripe-signature header');
      return res.status(400).send('Missing signature');
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const plan = session.metadata?.plan;
        const projectName = session.metadata?.projectName;
        const userEmail = session.metadata?.userEmail || session.customer_email || session.customer_details?.email;

        // Sanitize project name from metadata (defense in depth)
        const sanitizedProjectName = sanitizeInput(projectName || 'New Project', 100);

        if (userId && plan && sanitizedProjectName && userEmail) {
          try {
            // Create Clerk Organization for this project
            const clerk = getClerk();
            let clerkOrgId = null;

            try {
              const organization = await clerk.organizations.createOrganization({
                name: sanitizedProjectName,
                createdBy: userId,
              });
              clerkOrgId = organization.id;
              console.log(`Clerk Organization created: ${clerkOrgId} for project: ${sanitizedProjectName}`);
            } catch (clerkError) {
              console.error('Error creating Clerk Organization:', clerkError);
              // Continue creating project even if org creation fails
            }

            // Create a project for the user with proper structure
            const projectRef = db.collection('projects').doc();
            await projectRef.set({
              name: sanitizedProjectName,
              ownerId: userId,
              ownerEmail: userEmail,
              collaborators: [userEmail],
              collaboratorIds: [userId],
              clerkOrgId: clerkOrgId, // Store Clerk Organization ID
              approvals: {
                [userEmail]: true
              },
              onboardingCompleted: {
                [userId]: false
              },
              requiresApprovals: true,
              surveyData: {
                companyName: sanitizedProjectName
              },
              activeUsers: [],
              submitted: false,
              submittedAt: null,
              submittedBy: null,
              pdfUrl: null,
              pdfGeneratedAt: null,
              plan: plan,
              createdAt: FieldValue.serverTimestamp(),
              lastUpdated: FieldValue.serverTimestamp(),
              lastOpened: FieldValue.serverTimestamp()
            });

            console.log(`User ${userId} paid for ${plan}, project created: ${projectRef.id} - ${sanitizedProjectName}`);
          } catch (error) {
            console.error('Error in project creation:', error);
          }
        } else {
          console.error('Missing required metadata in checkout session:', { userId, plan, projectName: sanitizedProjectName, userEmail });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ============================================================================
// FIREBASE AUTH TOKEN EXCHANGE
// ============================================================================

// Exchange Clerk session token for Firebase custom token
// This allows Clerk-authenticated users to access Firestore with security rules
exports.getFirebaseToken = onCall({
  ...FUNCTION_CONFIG,
  secrets: [CLERK_SECRET_KEY],
  invoker: 'public',
}, async (request) => {
  try {
    const { sessionToken } = request.data;

    if (!sessionToken) {
      throw new HttpsError('invalid-argument', 'Session token is required');
    }

    // Verify Clerk session token
    const { userId } = await verifyClerkToken(sessionToken);

    // Create Firebase custom token for this user
    const firebaseToken = await auth.createCustomToken(userId);

    return {
      firebaseToken,
      userId
    };
  } catch (error) {
    console.error('Error creating Firebase token:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to create Firebase token');
  }
});

// ============================================================================
// ACCOUNT DELETION (GDPR/CCPA Compliant Pseudonymization)
// ============================================================================

// Delete user account with proper pseudonymization for legal compliance
exports.deleteAccount = onCall({
  ...FUNCTION_CONFIG,
  secrets: [CLERK_SECRET_KEY],
  invoker: 'public',
}, async (request) => {
  try {
    const { sessionToken } = request.data;

    if (!sessionToken) {
      throw new HttpsError('invalid-argument', 'Session token is required');
    }

    // Verify Clerk session token
    const { userId, email } = await verifyClerkToken(sessionToken);

    console.log(`Account deletion requested for user: ${userId} (${email})`);

    // Generate pseudonymized identifier
    const pseudoId = `deleted_user_${userId.substring(0, 8)}`;
    const pseudoEmail = `${pseudoId}@cherrytree.internal`;

    // Get all projects owned by this user
    const projectsSnapshot = await db.collection('projects')
      .where('ownerId', '==', userId)
      .get();

    const clerk = getClerk();
    const transferredProjects = [];
    const archivedProjects = [];

    // Handle each project
    for (const projectDoc of projectsSnapshot.docs) {
      const project = projectDoc.data();

      // Get other collaborators (excluding the owner)
      const otherCollaborators = project.collaboratorIds?.filter(id => id !== userId) || [];

      if (otherCollaborators.length > 0) {
        // Transfer ownership to first collaborator
        const newOwnerId = otherCollaborators[0];
        const newOwnerEmail = project.collaborators?.find(e => e !== project.ownerEmail) || '';

        await projectDoc.ref.update({
          ownerId: newOwnerId,
          ownerEmail: newOwnerEmail,
          collaboratorIds: otherCollaborators,
          collaborators: project.collaborators?.filter(e => e !== project.ownerEmail) || [],
          transferredFrom: userId,
          transferredAt: FieldValue.serverTimestamp()
        });

        // Transfer Clerk organization ownership if it exists
        if (project.clerkOrgId) {
          try {
            await clerk.organizations.updateOrganizationMembership({
              organizationId: project.clerkOrgId,
              userId: newOwnerId,
              role: 'admin'
            });
            console.log(`Clerk org ${project.clerkOrgId} transferred to ${newOwnerId}`);
          } catch (clerkError) {
            console.error('Error updating Clerk org ownership:', clerkError);
          }
        }

        transferredProjects.push({
          name: project.name,
          transferredTo: newOwnerEmail
        });

        console.log(`Project "${project.name}" transferred to ${newOwnerEmail}`);
      } else {
        // No collaborators - pseudonymize and archive the project
        await projectDoc.ref.update({
          ownerEmail: pseudoEmail,
          collaborators: [pseudoEmail],
          archived: true,
          archivedReason: 'owner_deleted',
          archivedAt: FieldValue.serverTimestamp()
        });

        // Delete Clerk organization (no members left)
        if (project.clerkOrgId) {
          try {
            await clerk.organizations.deleteOrganization(project.clerkOrgId);
            console.log(`Clerk org ${project.clerkOrgId} deleted (no collaborators)`);
          } catch (clerkError) {
            console.error('Error deleting Clerk org:', clerkError);
          }
        }

        archivedProjects.push(project.name);
        console.log(`Project "${project.name}" archived and pseudonymized`);
      }
    }

    // Pseudonymize user document in Firestore
    await db.collection('users').doc(userId).update({
      email: pseudoEmail,
      name: 'Deleted User',
      picture: null,
      deleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      originalEmail: email // Keep for audit trail only
    });

    console.log(`User document pseudonymized: ${userId}`);

    // Delete user from Clerk (triggers webhook that deletes Firebase Auth)
    try {
      await clerk.users.deleteUser(userId);
      console.log(`Clerk user deleted: ${userId}`);
    } catch (clerkError) {
      console.error('Error deleting Clerk user:', clerkError);
      throw new HttpsError('internal', 'Failed to delete user account');
    }

    return {
      success: true,
      message: 'Account deleted successfully',
      transferredProjects,
      archivedProjects
    };

  } catch (error) {
    console.error('Error deleting account:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to delete account');
  }
});

// ============================================================================
// ORGANIZATION MEMBER MANAGEMENT
// ============================================================================

// Remove a member from an organization using Clerk backend API
exports.removeOrganizationMember = onCall({
  ...FUNCTION_CONFIG,
  secrets: [CLERK_SECRET_KEY],
  invoker: 'public',
}, async (request) => {
  try {
    const { sessionToken, userId, organizationId } = request.data;

    if (!sessionToken) {
      throw new HttpsError('invalid-argument', 'Session token is required');
    }

    if (!userId) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    if (!organizationId) {
      throw new HttpsError('invalid-argument', 'Organization ID is required');
    }

    // Verify Clerk session token and get requesting user's ID
    const { userId: requestingUserId } = await verifyClerkToken(sessionToken);

    // Get Clerk client
    const clerk = getClerk();

    // Verify requesting user is admin of the organization
    const requestingMembership = await clerk.organizations.getOrganizationMembership({
      organizationId,
      userId: requestingUserId
    });

    if (requestingMembership.role !== 'org:admin') {
      throw new HttpsError('permission-denied', 'Only admins can remove members');
    }

    // Remove the member using Clerk's backend API
    await clerk.organizations.deleteOrganizationMembership({
      organizationId,
      userId
    });

    return {
      success: true,
      message: 'Member removed successfully'
    };
  } catch (error) {
    console.error('Error removing organization member:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to remove member: ${error.message}`);
  }
});

// ============================================================================
// CLERK WEBHOOKS
// ============================================================================

// Handle Clerk webhooks for user and organization events
exports.clerkWebhook = onRequest({
  ...FUNCTION_CONFIG,
  cors: false,
  secrets: [CLERK_WEBHOOK_SECRET]
}, async (req, res) => {
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
    console.log('Clerk webhook event:', eventType);

    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses?.find(e => e.id === evt.data.primary_email_address_id);

        if (id && primaryEmail) {
          // Create Firebase Auth user with Clerk user ID
          try {
            await auth.createUser({
              uid: id,
              email: primaryEmail.email_address,
              displayName: [first_name, last_name].filter(Boolean).join(' ') || primaryEmail.email_address.split('@')[0],
              photoURL: image_url || null,
              emailVerified: primaryEmail.verified || false,
            });
            console.log(`Firebase Auth user created: ${id}`);
          } catch (authError) {
            // User might already exist if this is a retry
            if (authError.code !== 'auth/uid-already-exists') {
              console.error('Error creating Firebase Auth user:', authError);
            }
          }

          // Create user document in Firestore
          await db.collection('users').doc(id).set({
            userId: id,
            email: primaryEmail.email_address,
            firstName: first_name || '',
            lastName: last_name || '',
            picture: image_url || null,
            createdAt: FieldValue.serverTimestamp(),
            deleted: false,
          });

          console.log(`User created in Firestore: ${id} (${primaryEmail.email_address})`);
        }
        break;
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses?.find(e => e.id === evt.data.primary_email_address_id);

        if (id && primaryEmail) {
          // Update or create Firebase Auth user
          try {
            await auth.updateUser(id, {
              email: primaryEmail.email_address,
              displayName: [first_name, last_name].filter(Boolean).join(' ') || primaryEmail.email_address.split('@')[0],
              photoURL: image_url || null,
              emailVerified: primaryEmail.verified || false,
            });
            console.log(`Firebase Auth user updated: ${id}`);
          } catch (authError) {
            // If user doesn't exist, create them (for existing Clerk users)
            if (authError.code === 'auth/user-not-found') {
              try {
                await auth.createUser({
                  uid: id,
                  email: primaryEmail.email_address,
                  displayName: [first_name, last_name].filter(Boolean).join(' ') || primaryEmail.email_address.split('@')[0],
                  photoURL: image_url || null,
                  emailVerified: primaryEmail.verified || false,
                });
                console.log(`Firebase Auth user created (from update): ${id}`);
              } catch (createError) {
                console.error('Error creating Firebase Auth user:', createError);
              }
            } else {
              console.error('Error updating Firebase Auth user:', authError);
            }
          }

          // Update or create user document (use set with merge for existing Clerk users)
          await db.collection('users').doc(id).set({
            userId: id,
            email: primaryEmail.email_address,
            firstName: first_name || '',
            lastName: last_name || '',
            picture: image_url || null,
            updatedAt: FieldValue.serverTimestamp(),
            // Set defaults for new users (won't overwrite existing due to merge)
            hasCompletedOnboarding: false,
            deleted: false,
          }, { merge: true });

          console.log(`User updated in Firestore: ${id}`);
        }
        break;
      }

      case 'user.deleted': {
        const { id } = evt.data;

        if (id) {
          // Delete Firebase Auth user (authentication only)
          try {
            await auth.deleteUser(id);
            console.log(`Firebase Auth user deleted: ${id}`);
          } catch (authError) {
            console.error('Error deleting Firebase Auth user:', authError);
          }

          // Mark user as deleted in Firestore (only if they exist)
          try {
            const userDoc = await db.collection('users').doc(id).get();
            if (userDoc.exists) {
              await db.collection('users').doc(id).update({
                deleted: true,
                deletedAt: FieldValue.serverTimestamp()
              });
              console.log(`User ${id} marked as deleted in Firestore`);
            } else {
              console.log(`User ${id} doesn't exist in Firestore, skipping deletion marker`);
            }
          } catch (firestoreError) {
            console.error('Error marking user as deleted in Firestore:', firestoreError);
          }
        }
        break;
      }

      case 'organization.created': {
        const { id, name, created_by } = evt.data;
        console.log(`Organization created: ${id} (${name}) by ${created_by}`);
        // Organization data is already in Clerk, no need to duplicate in Firestore
        break;
      }

      case 'organizationMembership.created': {
        const { organization, public_user_data } = evt.data;
        const userId = public_user_data.user_id;
        const userEmail = public_user_data.identifier; // Email address
        const orgId = organization.id;

        console.log(`User ${userId} (${userEmail}) joined org ${orgId}`);

        // Find project with this Clerk org ID and add user to collaboratorIds and collaborators
        try {
          const projectsSnapshot = await db.collection('projects')
            .where('clerkOrgId', '==', orgId)
            .limit(1)
            .get();

          if (!projectsSnapshot.empty) {
            const projectDoc = projectsSnapshot.docs[0];
            await projectDoc.ref.update({
              collaboratorIds: FieldValue.arrayUnion(userId),
              collaborators: FieldValue.arrayUnion(userEmail), // Also add email for legacy compatibility
              lastUpdated: FieldValue.serverTimestamp()
            });
            console.log(`Added user ${userId} (${userEmail}) to project ${projectDoc.id} collaborators`);
          }
        } catch (error) {
          console.error('Error adding collaborator to project:', error);
        }
        break;
      }

      case 'organizationMembership.deleted': {
        const { organization, public_user_data } = evt.data;
        const userId = public_user_data.user_id;
        const userEmail = public_user_data.identifier; // Email address
        const orgId = organization.id;

        console.log(`User ${userId} (${userEmail}) left org ${orgId}`);

        // Find project with this Clerk org ID and remove user from collaboratorIds and collaborators
        try {
          const projectsSnapshot = await db.collection('projects')
            .where('clerkOrgId', '==', orgId)
            .limit(1)
            .get();

          if (!projectsSnapshot.empty) {
            const projectDoc = projectsSnapshot.docs[0];
            await projectDoc.ref.update({
              collaboratorIds: FieldValue.arrayRemove(userId),
              collaborators: FieldValue.arrayRemove(userEmail), // Also remove email for legacy compatibility
              lastUpdated: FieldValue.serverTimestamp()
            });
            console.log(`Removed user ${userId} (${userEmail}) from project ${projectDoc.id} collaborators`);
          }
        } catch (error) {
          console.error('Error removing collaborator from project:', error);
        }
        break;
      }

      default:
        console.log(`Unhandled Clerk event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});


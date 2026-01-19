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
const { Webhook } = require('svix');
const validator = require('validator');
const { getClerk, verifyClerkToken, CLERK_SECRET_KEY } = require('./auth-helpers');

initializeApp();
const db = getFirestore();
const auth = getAuth();

// Load secrets from environment config
const { defineSecret } = require('firebase-functions/params');
const MAKE_WEBHOOK_URL = defineSecret('MAKE_WEBHOOK_URL');
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const CLERK_WEBHOOK_SECRET = defineSecret('CLERK_WEBHOOK_SECRET');

// Note: CLERK_SECRET_KEY and getClerk() are imported from auth-helpers.js

// Shared Cloud Functions configuration
// Optimized for free tier: 256MB memory
const FUNCTION_CONFIG = {
  region: 'us-west2',
  memory: '256MiB',
  serviceAccount: `cloud-functions@${process.env.GCLOUD_PROJECT}.iam.gserviceaccount.com`,
};

// Validation constants
const EMAIL_MAX_LENGTH = 254; // RFC 5321 maximum email length
const PROJECT_NAME_MIN_LENGTH = 2; // Minimum characters for project/company name

/**
 * EDIT WINDOW CONFIGURATION
 *
 * IMPORTANT: This is the ONLY place where edit window duration is defined.
 * Change this single config to modify the edit window for ALL FUTURE projects.
 *
 * Users have this duration from PURCHASE DATE to edit their agreement.
 *
 * Examples:
 * - { amount: 6, unit: 'months' }  // Production (current)
 * - { amount: 1, unit: 'days' }    // Testing
 * - { amount: 1, unit: 'years' }   // 1 year window
 * - { amount: 2, unit: 'hours' }   // Quick testing
 *
 * Supported units: 'months', 'days', 'years', 'hours', 'minutes'
 *
 * NOTE: Each project's editDeadline is calculated ONCE at purchase and stored in Firestore.
 * Existing projects keep their deadline even if you change this config later.
 */
const EDIT_WINDOW_CONFIG = {
  amount: 6,
  unit: 'months'
};

/**
 * Calculate edit deadline from a date and the EDIT_WINDOW_CONFIG
 * Deadline is set to 11:59:59 PM PST (UTC-8) on the final day
 * @param {Date} startDate - The starting date (typically createdAt)
 * @returns {Date} The deadline date
 * @throws {Error} If EDIT_WINDOW_CONFIG has invalid values
 */
function calculateEditDeadline(startDate) {
  if (!startDate || !(startDate instanceof Date)) {
    throw new Error('startDate must be a valid Date object');
  }

  const { amount, unit } = EDIT_WINDOW_CONFIG;

  if (!amount || amount <= 0) {
    throw new Error('EDIT_WINDOW_CONFIG.amount must be a positive number');
  }

  const deadline = new Date(startDate);

  switch (unit) {
    case 'years':
      deadline.setFullYear(deadline.getFullYear() + amount);
      break;
    case 'months':
      deadline.setMonth(deadline.getMonth() + amount);
      break;
    case 'days':
      deadline.setDate(deadline.getDate() + amount);
      break;
    case 'hours':
      deadline.setHours(deadline.getHours() + amount);
      break;
    case 'minutes':
      deadline.setMinutes(deadline.getMinutes() + amount);
      break;
    default:
      throw new Error(`Unsupported unit: ${unit}. Supported units: years, months, days, hours, minutes`);
  }

  // Set to 11:59:59 PM PST (UTC-8) on the deadline day
  // 11:59:59 PM PST = 7:59:59 AM UTC the next day
  const year = deadline.getUTCFullYear();
  const month = deadline.getUTCMonth();
  const day = deadline.getUTCDate();
  return new Date(Date.UTC(year, month, day + 1, 7, 59, 59));
}

// Survey versioning
const CURRENT_SURVEY_VERSION = '1.0.0';

// ============================================================================
// INPUT VALIDATION & SANITIZATION HELPERS
// Note: Authentication helpers (verifyClerkToken, getClerk) are in auth-helpers.js
// ============================================================================

/**
 * Sanitize user input to prevent XSS and injection attacks
 * Used for project names, descriptions, and other user-generated text content
 * @param {string} input - The input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input, maxLength = 100) {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim and enforce length limit
  let sanitized = input.trim().substring(0, maxLength);

  // Use validator.js to escape HTML entities (converts < to &lt;, etc.)
  sanitized = validator.escape(sanitized);

  // Additional security layers
  sanitized = sanitized
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove javascript: protocol (all variants including obfuscated)
    .replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/on\w+\s*=/gi, '');

  return sanitized.trim();
}

/**
 * Validate email format - Basic check for early feedback
 * Note: Clerk handles full email validation. This is just for early user feedback
 * before making API calls to Clerk.
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email has basic valid format
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;

  // Basic validation using validator.js
  return validator.isEmail(email) && email.length <= EMAIL_MAX_LENGTH;
}

/**
 * Validate URL and ensure it's HTTPS from a trusted domain
 * CRITICAL: Prevents malicious URLs from being stored (e.g., PDF URLs from webhooks)
 * Uses exact hostname matching for maximum security
 * @param {string} url - URL to validate
 * @param {string[]} allowedDomains - List of exact allowed hostnames
 * @returns {boolean} - Whether URL is valid and from trusted domain
 */
function isValidTrustedUrl(url, allowedDomains) {
  if (typeof url !== 'string') return false;

  try {
    const parsedUrl = new URL(url);

    // Must be HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Check if hostname exactly matches any allowed domain
    const hostname = parsedUrl.hostname.toLowerCase();
    return allowedDomains.some(domain => domain.toLowerCase() === hostname);
  } catch (error) {
    // Invalid URL format
    return false;
  }
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

    // Check if user is the admin
    if (projectData.admin !== userId) {
      throw new HttpsError(
        'permission-denied',
        'Only the project admin can submit'
      );
    }

    // Check if already submitted
    if (projectData.submitted) {
      throw new HttpsError('already-exists', 'Project already submitted');
    }

    // Mark as submitted
    await projectRef.update({
      submitted: true
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
      // Exact hostname matching - add specific subdomains as needed
      const allowedDomains = [
        'drive.google.com',
        'storage.googleapis.com',
        'firebasestorage.googleapis.com',
        's3.amazonaws.com',
        'www.dropbox.com',
        'dropbox.com',
        'onedrive.live.com'
      ];

      if (!isValidTrustedUrl(response.data.pdfUrl, allowedDomains)) {
        console.error('Invalid or untrusted PDF URL from Make.com:', response.data.pdfUrl);
        throw new HttpsError('internal', 'Invalid PDF URL received from external service');
      }

      const generatedAt = new Date();
      await projectRef.update({
        pdfAgreements: FieldValue.arrayUnion({
          url: response.data.pdfUrl,
          generatedAt: generatedAt,
          generatedBy: userId
        }),
        latestPdfUrl: response.data.pdfUrl
      });
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

    // Check if user has access to this project (active collaborator with endAt: null)
    const collaborator = projectData.collaborators?.[userId];
    const hasAccess = collaborator?.history?.some(h => h.endAt === null);

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
      // Exact hostname matching - add specific subdomains as needed
      const allowedDomains = [
        'drive.google.com',
        'storage.googleapis.com',
        'firebasestorage.googleapis.com',
        's3.amazonaws.com',
        'www.dropbox.com',
        'dropbox.com',
        'onedrive.live.com'
      ];

      if (!isValidTrustedUrl(response.data.pdfUrl, allowedDomains)) {
        console.error('Invalid or untrusted PDF URL from Make.com:', response.data.pdfUrl);
        throw new HttpsError('internal', 'Invalid PDF URL received from external service');
      }

      await projectRef.update({
        previewPdfUrl: response.data.pdfUrl,
        previewPdfGeneratedAt: FieldValue.serverTimestamp()
      });
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
  if (!sanitizedProjectName || sanitizedProjectName.length < PROJECT_NAME_MIN_LENGTH) {
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
            // Fetch receipt URL and payment timestamp from the charge
            let receiptUrl = null;
            let purchasedAt = null;
            if (session.payment_intent) {
              try {
                const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
                if (paymentIntent.latest_charge) {
                  const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
                  receiptUrl = charge.receipt_url;
                  purchasedAt = new Date(charge.created * 1000); // Unix timestamp to JS Date
                }
              } catch (receiptError) {
                console.error('Error fetching charge details:', receiptError);
              }
            }

            // Create Clerk Organization for this project
            // clerkOrgId is used as the Firestore document ID (single source of truth)
            const clerk = getClerk();
            const organization = await clerk.organizations.createOrganization({
              name: sanitizedProjectName,
              createdBy: userId,
            });
            const clerkOrgId = organization.id;
            console.log(`Clerk Organization created: ${clerkOrgId} for project: ${sanitizedProjectName}`);

            // Use clerkOrgId as the Firestore document ID
            const projectRef = db.collection('projects').doc(clerkOrgId);

            // Calculate edit deadline based on EDIT_WINDOW_CONFIG
            // This is calculated ONCE and stored forever - changing config later won't affect existing projects
            const now = new Date();
            const editDeadline = calculateEditDeadline(now);

            await projectRef.set({
              name: sanitizedProjectName,
              admin: userId,
              collaborators: {
                [userId]: {
                  role: 'admin',
                  isActive: true,
                  history: [{ startAt: new Date(), endAt: null }]
                }
              },
              approvals: {
                [userId]: false
              },
              onboardingCompleted: {
                [userId]: false
              },
              surveyVersion: CURRENT_SURVEY_VERSION,
              surveyData: {
                // Initialize acknowledgement fields with owner's userId
                acknowledgeEquityAllocation: { [userId]: false },
                acknowledgeTieResolution: { [userId]: false },
                acknowledgeShotgunClause: { [userId]: false },
                acknowledgeForfeiture: { [userId]: false },
                acknowledgeIPOwnership: { [userId]: false },
                acknowledgeConfidentiality: { [userId]: false },
                acknowledgePeriodicReview: { [userId]: false },
                acknowledgeAmendmentReviewRequest: { [userId]: false },
                acknowledgeEntireAgreement: { [userId]: false },
                acknowledgeSeverability: { [userId]: false }
              },
              submitted: false,
              pdfAgreements: [],
              latestPdfUrl: null,
              plan: plan,
              // Payment info
              stripeCustomerId: session.customer,
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              amountPaidCents: session.amount_total,
              currency: session.currency,
              receiptUrl: receiptUrl,
              purchasedAt: purchasedAt || FieldValue.serverTimestamp(), // From charge.created, fallback to now
              // Timestamps
              createdAt: FieldValue.serverTimestamp(),
              editDeadline: editDeadline, // Edit deadline - locked in at purchase time
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
  consumeAppCheckToken: true
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
  consumeAppCheckToken: true
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

    // Get all projects where this user is admin
    const projectsSnapshot = await db.collection('projects')
      .where('admin', '==', userId)
      .get();

    const clerk = getClerk();
    const transferredProjects = [];
    const archivedProjects = [];

    // Handle each project where user is admin
    for (const projectDoc of projectsSnapshot.docs) {
      const project = projectDoc.data();

      // Get collaborators map and find active members (excluding the admin being deleted)
      const collaborators = project.collaborators || {};
      const activeCollaboratorIds = Object.keys(collaborators).filter(id => {
        if (id === userId) return false;
        const history = collaborators[id].history || [];
        return history.some(h => h.endAt === null);
      });

      if (activeCollaboratorIds.length > 0) {
        // Transfer admin to first remaining active collaborator
        const newAdminId = activeCollaboratorIds[0];
        const newAdminData = collaborators[newAdminId];

        // Mark deleted user as inactive
        if (collaborators[userId]) {
          const currentEntry = collaborators[userId].history?.find(h => h.endAt === null);
          if (currentEntry) currentEntry.endAt = new Date();
          collaborators[userId].isActive = false;
        }

        // Update new admin's role
        collaborators[newAdminId].role = 'admin';

        await projectDoc.ref.update({
          admin: newAdminId,
          collaborators: collaborators,
          transferredFrom: userId,
          transferredAt: FieldValue.serverTimestamp()
        });

        // Transfer Clerk organization ownership (projectDoc.id === clerkOrgId)
        try {
          await clerk.organizations.updateOrganizationMembership({
            organizationId: projectDoc.id,
            userId: newAdminId,
            role: 'admin'
          });
          console.log(`Clerk org ${projectDoc.id} transferred to ${newAdminId}`);
        } catch (clerkError) {
          console.error('Error updating Clerk org ownership:', clerkError);
        }

        transferredProjects.push({
          name: project.name,
          transferredTo: newAdminId
        });

        console.log(`Project "${project.name}" transferred to ${newAdminId}`);
      } else {
        // No other collaborators - pseudonymize and archive the project
        const pseudoCollaborators = {
          [pseudoId]: {
            role: 'admin',
            isActive: true,
            history: [{ startAt: new Date(), endAt: null }]
          }
        };

        await projectDoc.ref.update({
          admin: pseudoId,
          collaborators: pseudoCollaborators,
          archived: true,
          archivedReason: 'admin_deleted',
          archivedAt: FieldValue.serverTimestamp()
        });

        // Delete Clerk organization (no members left, projectDoc.id === clerkOrgId)
        try {
          await clerk.organizations.deleteOrganization(projectDoc.id);
          console.log(`Clerk org ${projectDoc.id} deleted (no collaborators)`);
        } catch (clerkError) {
          console.error('Error deleting Clerk org:', clerkError);
        }

        archivedProjects.push(project.name);
        console.log(`Project "${project.name}" archived and pseudonymized`);
      }
    }

    // Update history endAt for all other projects where user is a collaborator
    const allProjectsSnapshot = await db.collection('projects')
      .where(`collaborators.${userId}`, '!=', null)
      .get();

    for (const projectDoc of allProjectsSnapshot.docs) {
      const project = projectDoc.data();
      if (project.admin === userId) continue; // Already handled above

      const collaborators = project.collaborators || {};
      if (collaborators[userId]) {
        const currentEntry = collaborators[userId].history?.find(h => h.endAt === null);
        if (currentEntry) {
          currentEntry.endAt = new Date();
        }
        collaborators[userId].isActive = false;
        await projectDoc.ref.update({
          collaborators: collaborators,
          lastUpdated: FieldValue.serverTimestamp()
        });
        console.log(`Marked user ${userId} as left in project ${projectDoc.id}`);
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
// ORGANIZATION MANAGEMENT (imported from organizations.js)
// ============================================================================

const {
  createOrganizationInvitation,
  removeOrganizationMember
} = require('./organizations');

exports.createOrganizationInvitation = createOrganizationInvitation;
exports.removeOrganizationMember = removeOrganizationMember;

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
        const { id, email_addresses, first_name, last_name, image_url, last_sign_in_at, created_at } = evt.data;
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
          // Use Clerk timestamps - created_at for both, last_sign_in_at as fallback for lastLoginAt
          const createdAtDate = created_at ? new Date(created_at) : new Date();
          await db.collection('users').doc(id).set({
            userId: id,
            email: primaryEmail.email_address,
            firstName: first_name || '',
            lastName: last_name || '',
            picture: image_url || null,
            createdAt: createdAtDate,
            lastLoginAt: last_sign_in_at ? new Date(last_sign_in_at) : createdAtDate,
            deleted: false,
          });

          console.log(`User created in Firestore: ${id} (${primaryEmail.email_address})`);
        }
        break;
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url, last_sign_in_at } = evt.data;
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
            lastLoginAt: last_sign_in_at ? new Date(last_sign_in_at) : null,
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
        const userEmail = public_user_data.identifier;
        const orgId = organization.id;

        console.log(`User ${userId} (${userEmail}) joined org ${orgId}`);

        try {
          const projectDoc = await db.collection('projects').doc(orgId).get();

          if (projectDoc.exists) {
            const projectData = projectDoc.data();
            const collaborators = projectData.collaborators || {};
            const approvals = projectData.approvals || {};

            if (collaborators[userId]) {
              // User rejoining - add new history entry and set active
              collaborators[userId].history.push({ startAt: new Date(), endAt: null });
              collaborators[userId].isActive = true;
            } else {
              // New collaborator
              collaborators[userId] = {
                role: 'collaborator',
                isActive: true,
                history: [{ startAt: new Date(), endAt: null }]
              };
            }

            approvals[userId] = false;

            await projectDoc.ref.update({
              collaborators: collaborators,
              approvals: approvals,
              lastUpdated: FieldValue.serverTimestamp()
            });
            console.log(`Added user ${userId} (${userEmail}) to project ${projectDoc.id}`);
          }
        } catch (error) {
          console.error('Error adding collaborator to project:', error);
        }
        break;
      }

      case 'organizationMembership.deleted': {
        const { organization, public_user_data } = evt.data;
        const userId = public_user_data.user_id;
        const userEmail = public_user_data.identifier;
        const orgId = organization.id;

        console.log(`User ${userId} (${userEmail}) left org ${orgId}`);

        try {
          const projectDoc = await db.collection('projects').doc(orgId).get();

          if (projectDoc.exists) {
            const projectData = projectDoc.data();
            const collaborators = projectData.collaborators || {};
            const approvals = projectData.approvals || {};

            // Update history and set inactive
            if (collaborators[userId]) {
              const history = collaborators[userId].history || [];
              const currentEntry = history.find(h => h.endAt === null);
              if (currentEntry) {
                currentEntry.endAt = new Date();
              }
              collaborators[userId].isActive = false;
            }

            delete approvals[userId];

            await projectDoc.ref.update({
              collaborators: collaborators,
              approvals: approvals,
              lastUpdated: FieldValue.serverTimestamp()
            });
            console.log(`Marked user ${userId} (${userEmail}) as left in project ${projectDoc.id}`);
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


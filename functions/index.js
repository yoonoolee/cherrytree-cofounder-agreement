/**
 * Firebase Cloud Functions
 *
 * This file contains server-side functions for operations that cannot be performed client-side:
 * - PDF generation via Make.com webhook
 * - Email invitations via Resend
 * - Stripe payment processing
 *
 * Note: User sync and basic CRUD operations are now handled client-side with Firebase Auth + Firestore
 */

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');
const { Resend } = require('resend');
const { defineString } = require('firebase-functions/params');
const Stripe = require('stripe');

initializeApp();
const db = getFirestore();
const auth = getAuth();

// Load secrets from environment config
const { defineSecret } = require('firebase-functions/params');
const MAKE_WEBHOOK_URL = defineSecret('MAKE_WEBHOOK_URL');
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const SENDER_EMAIL = 'onboarding@resend.dev';  // Use Resend's test email

// Lazy-load Resend instance
let resendInstance = null;
const getResend = () => {
  if (!resendInstance) {
    resendInstance = new Resend(RESEND_API_KEY.value());
  }
  return resendInstance;
};

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
  secrets: [MAKE_WEBHOOK_URL],
  invoker: 'public',
  consumeAppCheckToken: true  // Enforce App Check to prevent bots
}, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    console.error('No auth context');
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { projectId } = request.data;

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

    // Check if user is the owner
    if (projectData.ownerEmail !== request.auth.token.email) {
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
      submittedBy: request.auth.token.email
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
  secrets: [MAKE_WEBHOOK_URL],
  invoker: 'public',
  consumeAppCheckToken: true  // Enforce App Check to prevent bots
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { projectId } = request.data;

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

    // Check if user has access to this project
    const userEmail = request.auth.token.email;
    const hasAccess =
      projectData.ownerEmail === userEmail ||
      (projectData.collaborators || []).includes(userEmail);

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
// EMAIL OPERATIONS
// ============================================================================

// Send collaborator invitation email
exports.sendCollaboratorInvite = onCall({
  secrets: [RESEND_API_KEY],
  invoker: 'public',
  consumeAppCheckToken: true  // Enforce App Check to prevent spam
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { projectId, collaboratorEmail, projectName } = request.data;

  if (!projectId || !collaboratorEmail || !projectName) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  // Validate and sanitize inputs
  if (!isValidEmail(collaboratorEmail)) {
    throw new HttpsError('invalid-argument', 'Invalid email address');
  }

  const sanitizedProjectName = sanitizeInput(projectName, 100);
  if (!sanitizedProjectName || sanitizedProjectName.length < 2) {
    throw new HttpsError('invalid-argument', 'Invalid project name');
  }

  try {
    // Verify the user is the project owner
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      throw new HttpsError('not-found', 'Project not found');
    }

    const projectData = projectDoc.data();

    if (projectData.ownerEmail !== request.auth.token.email) {
      throw new HttpsError('permission-denied', 'Only project owner can invite');
    }

    // Create invitation link
    // Use production URL in production, otherwise localhost for testing
    const appUrl = process.env.NODE_ENV === 'production'
      ? 'https://my.cherrytree.app'
      : 'http://localhost:3000';
    const inviteLink = `${appUrl}?project=${projectId}&email=${encodeURIComponent(collaboratorEmail)}`;

    // Send email
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: 'Cherrytree <onboarding@resend.dev>',
      to: collaboratorEmail,
      subject: `${request.auth.token.email} invited you to collaborate on "${sanitizedProjectName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">You've been invited to collaborate!</h2>
          <p style="color: #4b5563; font-size: 16px;">
            <strong>${request.auth.token.email}</strong> has invited you to collaborate on the project:
          </p>
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin: 0;">${sanitizedProjectName}</h3>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>What happens next:</strong></p>
            <ol style="color: #4b5563; line-height: 1.8;">
              <li>Click the button below to access the project</li>
              <li>Create a free Cherry Tree account or sign in</li>
              <li>Start collaborating on the survey!</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
              style="display: inline-block; background-color: #2563eb; color: white; 
                      padding: 14px 28px; text-decoration: none; border-radius: 8px; 
                      font-weight: bold; font-size: 16px;">
              Access Project
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 13px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            This invitation was sent by Cherry Tree. If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new HttpsError('internal', 'Failed to send email');
    }

    return {
      success: true,
      message: 'Invitation email sent successfully'
    };

  } catch (error) {
    console.error('Error sending invitation:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // Don't expose internal error details to client
    throw new HttpsError('internal', 'An error occurred while sending the invitation');
  }
});

// ============================================================================
// STRIPE PAYMENT OPERATIONS
// ============================================================================

// Create Stripe checkout session
exports.createCheckoutSession = onCall({
  secrets: [STRIPE_SECRET_KEY],
  invoker: 'public',
  consumeAppCheckToken: true  // Enforce App Check to prevent payment fraud
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  // Initialize Stripe
  const stripe = Stripe(STRIPE_SECRET_KEY.value());

  const { priceId, plan, projectName } = request.data;

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
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email;

    // Create or retrieve Stripe customer
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    let stripeCustomerId;

    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      stripeCustomerId = userDoc.data().stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUID: userId,
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
        userEmail: userEmail,
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
  cors: false,  // Disable CORS - webhooks are server-to-server only
  secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET]
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
          // Update user's subscription status
          await db.collection('users').doc(userId).set({
            plan: plan,
            subscriptionStatus: 'active',
            stripeCustomerId: session.customer,
            lastPaymentAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          // Create a project for the user with proper structure
          const projectRef = db.collection('projects').doc();
          await projectRef.set({
            name: sanitizedProjectName,
            ownerId: userId,
            ownerEmail: userEmail,
            collaborators: [userEmail],
            collaboratorIds: [userId],
            approvals: {
              [userEmail]: true
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


/**
 * Stripe: checkout session creation (callable) and the payment webhook that creates a project
 * — a Clerk organization plus the `projects/{clerkOrgId}` document — once a checkout completes.
 */
import type express from 'express';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall, onRequest, type CallableRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import {
  REQUIRED_ACKNOWLEDGMENT_FIELDS,
  toErrorMessage,
  type CallableRequest as CallableData,
  type CallableResponse,
  type Payment,
  type Plan,
  type Project,
} from '@cherrytree/shared';

import {
  CALLABLE_OPTIONS,
  CLERK_SECRET_KEY,
  CURRENT_SURVEY_VERSION,
  STRIPE_PRO_PRICE_ID,
  STRIPE_SECRET_KEY,
  STRIPE_STARTER_PRICE_ID,
  STRIPE_WEBHOOK_SECRET,
  WEBHOOK_OPTIONS,
} from './config.ts';
import { resolveAppOrigin } from './lib/appOrigin.ts';
import { getClerk, getClerkPrimaryEmail, requireAuth } from './lib/auth.ts';
import { calculateEditDeadline } from './lib/dates.ts';
import { toHttpsError } from './lib/errors.ts';
import { projects, stripeEvents, users } from './lib/firebase.ts';
import { normalizeProjectName } from './lib/validation.ts';

/** The version the stripe package defaulted to before it was pinned; bump deliberately. */
const STRIPE_API_VERSION = '2025-10-29.clover';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  stripeInstance ??= new Stripe(STRIPE_SECRET_KEY.value(), { apiVersion: STRIPE_API_VERSION });
  return stripeInstance;
}

const PLANS: readonly Plan[] = ['starter', 'pro'];

function isPlan(value: unknown): value is Plan {
  return typeof value === 'string' && (PLANS as readonly string[]).includes(value);
}

/** Price ids come from the per-project parameters; the client only names the plan. */
function priceIdForPlan(plan: Plan): string {
  const priceId = { starter: STRIPE_STARTER_PRICE_ID, pro: STRIPE_PRO_PRICE_ID }[plan].value();
  if (!priceId) {
    throw new HttpsError('internal', `No Stripe price configured for the ${plan} plan`);
  }
  return priceId;
}

/** Expandable Stripe references are stored by id. */
function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

// ---------------------------------------------------------------------------
// createCheckoutSession
// ---------------------------------------------------------------------------

export const createCheckoutSession = onCall(
  { ...CALLABLE_OPTIONS, secrets: [STRIPE_SECRET_KEY, CLERK_SECRET_KEY] },
  async (
    request: CallableRequest<CallableData<'createCheckoutSession'>>,
  ): Promise<CallableResponse<'createCheckoutSession'>> => {
    const userId = requireAuth(request);
    const { plan, projectName } = request.data ?? {};

    if (!plan) {
      throw new HttpsError('invalid-argument', 'Plan is required');
    }
    if (!isPlan(plan)) {
      throw new HttpsError('invalid-argument', 'Invalid plan type');
    }
    if (!projectName) {
      throw new HttpsError('invalid-argument', 'Project name is required');
    }
    const name = normalizeProjectName(projectName);
    if (!name) {
      throw new HttpsError('invalid-argument', 'Invalid project name');
    }

    try {
      const email = await getClerkPrimaryEmail(userId);
      const stripe = getStripe();

      // One Stripe customer per user, created on first purchase.
      const userRef = users.doc(userId);
      let stripeCustomerId = (await userRef.get()).data()?.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { clerkUserId: userId },
        });
        stripeCustomerId = customer.id;
        await userRef.set({ stripeCustomerId }, { merge: true });
      }

      const origin = resolveAppOrigin(request.rawRequest.headers.origin);
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
        mode: 'payment',
        success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard?payment=cancelled`,
        // Read back by stripeWebhook to create the project.
        metadata: { userId, plan, projectName: name, userEmail: email },
        client_reference_id: userId,
      });

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      throw toHttpsError(
        error,
        'Error creating checkout session:',
        'An error occurred while creating the checkout session',
      );
    }
  },
);

// ---------------------------------------------------------------------------
// stripeWebhook
// ---------------------------------------------------------------------------

/** Receipt URL and charge time of a completed checkout; both `null` when unavailable. */
async function fetchChargeDetails(
  stripe: Stripe,
  paymentIntentId: string | null,
): Promise<{ receiptUrl: string | null; purchasedAt: Date | null }> {
  if (!paymentIntentId) return { receiptUrl: null, purchasedAt: null };

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const chargeId = idOf(paymentIntent.latest_charge);
    if (!chargeId) return { receiptUrl: null, purchasedAt: null };

    const charge = await stripe.charges.retrieve(chargeId);
    return { receiptUrl: charge.receipt_url, purchasedAt: new Date(charge.created * 1000) };
  } catch (error) {
    // The receipt is a nicety; the project is still created without it.
    logger.error('Error fetching charge details:', error);
    return { receiptUrl: null, purchasedAt: null };
  }
}

/** Creates the Clerk organization and the project document for a paid checkout. */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.client_reference_id ?? session.metadata?.userId;
  const plan = session.metadata?.plan;
  const name = normalizeProjectName(session.metadata?.projectName ?? 'New Project');
  const userEmail =
    session.metadata?.userEmail ?? session.customer_email ?? session.customer_details?.email;

  if (!userId || !isPlan(plan) || !name || !userEmail) {
    // Not retryable: the session will never gain the metadata. Log and acknowledge.
    logger.error('Missing required metadata in checkout session:', {
      sessionId: session.id,
      userId,
      plan,
      projectName: name,
      userEmail,
    });
    return;
  }

  const stripe = getStripe();
  const { receiptUrl, purchasedAt } = await fetchChargeDetails(
    stripe,
    idOf(session.payment_intent),
  );

  // The Clerk organization id is the project document id.
  const organization = await getClerk().organizations.createOrganization({
    name,
    createdBy: userId,
  });

  const admin = (await users.doc(userId).get()).data();
  const now = new Date();
  const payment: Payment = {
    plan,
    type: 'initial',
    stripeCustomerId: idOf(session.customer),
    stripePaymentIntentId: idOf(session.payment_intent),
    amountPaidCents: session.amount_total,
    currency: session.currency,
    receiptUrl,
    purchasedAt: purchasedAt ?? now,
  };

  const project: Omit<Project, 'createdAt' | 'lastUpdated' | 'lastOpened'> = {
    name,
    admin: userId,
    collaborators: {
      [userId]: {
        role: 'admin',
        isActive: true,
        firstName: admin?.firstName ?? '',
        lastName: admin?.lastName ?? '',
        history: [{ startAt: now, endAt: null }],
      },
    },
    approvals: { [userId]: false },
    onboardingCompleted: { [userId]: false },
    surveyVersion: CURRENT_SURVEY_VERSION,
    surveyData: Object.fromEntries(
      REQUIRED_ACKNOWLEDGMENT_FIELDS.map((field) => [field, { [userId]: false }]),
    ),
    // Submission status is derived from pdfAgreements.length.
    pdfAgreements: [],
    latestPdfUrl: null,
    currentPlan: plan,
    payments: { [session.id]: payment },
    // Locked in now; later changes to EDIT_WINDOW_CONFIG never affect this project.
    editDeadline: Timestamp.fromDate(calculateEditDeadline(now)),
  };

  await projects.doc(organization.id).set({
    ...project,
    createdAt: FieldValue.serverTimestamp(),
    lastUpdated: FieldValue.serverTimestamp(),
    lastOpened: FieldValue.serverTimestamp(),
  });
}

/**
 * Runs `handler` unless `event` was already fully processed. Stripe delivers an event again
 * whenever it does not get a 2xx, so the marker is written only after success; a failure
 * leaves no marker and the retry runs the handler again.
 */
async function processOnce(event: Stripe.Event, handler: () => Promise<void>): Promise<void> {
  const marker = stripeEvents.doc(event.id);
  if ((await marker.get()).exists) {
    logger.info('Duplicate Stripe event ignored', { eventId: event.id, type: event.type });
    return;
  }

  await handler();
  await marker.set({ type: event.type, processedAt: FieldValue.serverTimestamp() });
}

export const stripeWebhook = onRequest(
  { ...WEBHOOK_OPTIONS, secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLERK_SECRET_KEY] },
  async (req, res: express.Response): Promise<void> => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      logger.error('Missing stripe-signature header');
      res.status(400).send('Missing signature');
      return;
    }

    let event: Stripe.Event;
    try {
      // Verifies the request really came from Stripe; needs the raw bytes, not re-serialized JSON.
      event = getStripe().webhooks.constructEvent(
        req.rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET.value(),
      );
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error('Webhook signature verification failed:', message);
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await processOnce(event, () => handleCheckoutCompleted(event.data.object));
          break;
        default:
          break;
      }
      res.json({ received: true });
    } catch (error) {
      // 5xx makes Stripe retry with backoff instead of silently losing the purchase.
      logger.error('Webhook error:', error);
      res.status(500).send('Webhook handler failed');
    }
  },
);

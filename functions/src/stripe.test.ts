import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

import { fakeCollection, type FakeCollection } from '../test/helpers/fakeFirestore.ts';

const stripeMocks = vi.hoisted(() => ({
  customersCreate: vi.fn(),
  sessionsCreate: vi.fn(),
  constructEvent: vi.fn(),
  paymentIntentsRetrieve: vi.fn(),
  chargesRetrieve: vi.fn(),
  constructorArgs: [] as unknown[][],
}));
const clerkMocks = vi.hoisted(() => ({ getUser: vi.fn(), createOrganization: vi.fn() }));
const collections = vi.hoisted(() => ({
  users: null as unknown as FakeCollection,
  projects: null as unknown as FakeCollection,
  stripeEvents: null as unknown as FakeCollection,
}));
const logger = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }));

vi.mock('stripe', () => ({
  default: class StripeMock {
    customers = { create: stripeMocks.customersCreate };
    checkout = { sessions: { create: stripeMocks.sessionsCreate } };
    webhooks = { constructEvent: stripeMocks.constructEvent };
    paymentIntents = { retrieve: stripeMocks.paymentIntentsRetrieve };
    charges = { retrieve: stripeMocks.chargesRetrieve };
    constructor(...args: unknown[]) {
      stripeMocks.constructorArgs.push(args);
    }
  },
}));
vi.mock('@clerk/backend', () => ({
  createClerkClient: () => ({
    users: { getUser: clerkMocks.getUser },
    organizations: { createOrganization: clerkMocks.createOrganization },
  }),
  verifyToken: vi.fn(),
}));
vi.mock('firebase-functions', () => ({ logger }));
vi.mock('./lib/firebase.ts', () => ({
  get users() {
    return collections.users;
  },
  get projects() {
    return collections.projects;
  },
  get stripeEvents() {
    return collections.stripeEvents;
  },
}));

const { createCheckoutSession, stripeWebhook } = await import('./stripe.ts');

const USER = 'user_1';
const APP_ORIGIN = 'https://app.example.com';

function call(uid: string | undefined, data: unknown, origin?: string): CallableRequest<never> {
  return {
    data: data as never,
    auth: uid ? { uid, token: {} as never, rawToken: 'id-token' } : undefined,
    rawRequest: { headers: origin ? { origin } : {} } as never,
    acceptsStreaming: false,
  };
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof HttpsError ? error.code : `not an HttpsError: ${String(error)}`;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(process.env, {
    STRIPE_SECRET_KEY: 'sk_test_x',
    STRIPE_WEBHOOK_SECRET: 'whsec_x',
    CLERK_SECRET_KEY: 'sk_clerk_x',
    APP_ORIGIN,
    STRIPE_STARTER_PRICE_ID: 'price_starter',
    STRIPE_PRO_PRICE_ID: 'price_pro',
  });
  collections.users = fakeCollection({
    [USER]: { userId: USER, email: 'founder@example.com', firstName: 'Ada', lastName: 'Lovelace' },
  });
  collections.projects = fakeCollection();
  collections.stripeEvents = fakeCollection();
  clerkMocks.getUser.mockResolvedValue({
    id: USER,
    primaryEmailAddressId: 'idn_1',
    emailAddresses: [{ id: 'idn_1', emailAddress: 'founder@example.com' }],
  });
  stripeMocks.customersCreate.mockResolvedValue({ id: 'cus_new' });
  stripeMocks.sessionsCreate.mockResolvedValue({
    id: 'cs_test_1',
    url: 'https://checkout.stripe.com/c/pay/cs_test_1',
  });
});

describe('createCheckoutSession', () => {
  const validData = { plan: 'starter', projectName: '  Acme & Co  ' };

  it('pins the Stripe API version', async () => {
    await createCheckoutSession.run(call(USER, validData));
    expect(stripeMocks.constructorArgs.at(-1)).toEqual([
      'sk_test_x',
      { apiVersion: '2025-10-29.clover' },
    ]);
  });

  it('rejects unauthenticated callers', async () => {
    expect(await codeOf(createCheckoutSession.run(call(undefined, validData)))).toBe(
      'unauthenticated',
    );
    expect(stripeMocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it('validates plan and project name', async () => {
    expect(await codeOf(createCheckoutSession.run(call(USER, { projectName: 'Acme' })))).toBe(
      'invalid-argument',
    );
    expect(
      await codeOf(
        createCheckoutSession.run(call(USER, { plan: 'enterprise', projectName: 'Acme' })),
      ),
    ).toBe('invalid-argument');
    expect(await codeOf(createCheckoutSession.run(call(USER, { plan: 'pro' })))).toBe(
      'invalid-argument',
    );
    expect(
      await codeOf(createCheckoutSession.run(call(USER, { plan: 'pro', projectName: ' x ' }))),
    ).toBe('invalid-argument');
    expect(stripeMocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it('creates a session from server-side price and redirect config, storing the raw name', async () => {
    const result = await createCheckoutSession.run(
      call(
        USER,
        {
          ...validData,
          // Everything a client might try to inject is ignored.
          priceId: 'price_attacker',
          successUrl: 'https://evil.example/success',
          cancelUrl: 'https://evil.example/cancel',
          sessionToken: 'stale',
        },
        'http://localhost:3000',
      ),
    );

    expect(stripeMocks.sessionsCreate).toHaveBeenCalledWith({
      customer: 'cus_new',
      payment_method_types: ['card'],
      line_items: [{ price: 'price_starter', quantity: 1 }],
      mode: 'payment',
      success_url:
        'http://localhost:3000/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/dashboard?payment=cancelled',
      metadata: {
        userId: USER,
        plan: 'starter',
        projectName: 'Acme & Co',
        userEmail: 'founder@example.com',
      },
      client_reference_id: USER,
    });
    expect(result).toEqual({
      sessionId: 'cs_test_1',
      url: 'https://checkout.stripe.com/c/pay/cs_test_1',
    });
  });

  it('uses the pro price for the pro plan and the app origin for unknown origins', async () => {
    await createCheckoutSession.run(
      call(USER, { plan: 'pro', projectName: 'Acme' }, 'https://evil.example'),
    );

    expect(stripeMocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_pro', quantity: 1 }],
        success_url: `${APP_ORIGIN}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_ORIGIN}/dashboard?payment=cancelled`,
      }),
    );
  });

  it('creates a Stripe customer on first purchase and persists it on the user', async () => {
    await createCheckoutSession.run(call(USER, validData));

    expect(stripeMocks.customersCreate).toHaveBeenCalledWith({
      email: 'founder@example.com',
      metadata: { clerkUserId: USER },
    });
    expect(collections.users.doc(USER).set).toHaveBeenCalledWith(
      { stripeCustomerId: 'cus_new' },
      { merge: true },
    );
  });

  it('reuses an existing Stripe customer', async () => {
    collections.users = fakeCollection({ [USER]: { stripeCustomerId: 'cus_existing' } });

    await createCheckoutSession.run(call(USER, validData));

    expect(stripeMocks.customersCreate).not.toHaveBeenCalled();
    expect(stripeMocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    );
  });

  it('fails with internal when a price is not configured', async () => {
    process.env.STRIPE_STARTER_PRICE_ID = '';
    expect(await codeOf(createCheckoutSession.run(call(USER, validData)))).toBe('internal');
  });

  it('hides Stripe errors behind an internal error', async () => {
    stripeMocks.sessionsCreate.mockRejectedValue(new Error('Stripe key sk_test_x rejected'));
    const error = await createCheckoutSession.run(call(USER, validData)).catch((e) => e);
    expect(error.code).toBe('internal');
    expect(error.message).not.toContain('sk_test');
  });
});

describe('stripeWebhook', () => {
  type Res = {
    status: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };

  // The onRequest wrapper runs the cors middleware (origin: false) around the handler, which
  // touches these members even when it sets no header.
  function mockRes(): Res {
    const res = {
      status: vi.fn(),
      send: vi.fn(),
      json: vi.fn(),
      on: vi.fn(),
      setHeader: vi.fn(),
      getHeader: vi.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  }

  function request(headers: Record<string, string>, rawBody = Buffer.from('{"raw":true}')) {
    return { method: 'POST', headers, rawBody, body: { parsed: true } };
  }

  function completedSession(overrides: Record<string, unknown> = {}) {
    return {
      id: 'cs_test_1',
      client_reference_id: USER,
      metadata: {
        userId: USER,
        plan: 'starter',
        projectName: 'Acme & Co',
        userEmail: 'founder@example.com',
      },
      customer: 'cus_1',
      payment_intent: 'pi_1',
      amount_total: 9900,
      currency: 'usd',
      ...overrides,
    };
  }

  function event(type: string, object: unknown, id = 'evt_1') {
    return { id, type, data: { object } };
  }

  async function deliver(evt: unknown, res = mockRes()) {
    stripeMocks.constructEvent.mockReturnValue(evt);
    await stripeWebhook(request({ 'stripe-signature': 'sig' }) as never, res as never);
    return res;
  }

  beforeEach(() => {
    clerkMocks.createOrganization.mockResolvedValue({ id: 'org_1' });
    stripeMocks.paymentIntentsRetrieve.mockResolvedValue({ latest_charge: 'ch_1' });
    stripeMocks.chargesRetrieve.mockResolvedValue({
      receipt_url: 'https://pay.stripe.com/receipts/r1',
      created: 1_700_000_000,
    });
  });

  it('rejects requests without a signature', async () => {
    const res = mockRes();
    await stripeWebhook(request({}) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(stripeMocks.constructEvent).not.toHaveBeenCalled();
  });

  it('verifies the signature against the raw body and rejects failures', async () => {
    stripeMocks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });
    const res = mockRes();
    const req = request({ 'stripe-signature': 'sig' });
    await stripeWebhook(req as never, res as never);

    expect(stripeMocks.constructEvent).toHaveBeenCalledWith(req.rawBody, 'sig', 'whsec_x');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(clerkMocks.createOrganization).not.toHaveBeenCalled();
  });

  it('creates the Clerk organization and the project for a completed checkout', async () => {
    const res = await deliver(event('checkout.session.completed', completedSession()));

    expect(clerkMocks.createOrganization).toHaveBeenCalledWith({
      name: 'Acme & Co',
      createdBy: USER,
    });

    const written = collections.projects.store.get('org_1')!;
    expect(written).toMatchObject({
      name: 'Acme & Co',
      admin: USER,
      collaborators: {
        [USER]: {
          role: 'admin',
          isActive: true,
          firstName: 'Ada',
          lastName: 'Lovelace',
          history: [{ startAt: expect.any(Date), endAt: null }],
        },
      },
      approvals: { [USER]: false },
      onboardingCompleted: { [USER]: false },
      surveyVersion: '1.0.0',
      pdfAgreements: [],
      latestPdfUrl: null,
      currentPlan: 'starter',
      payments: {
        cs_test_1: {
          plan: 'starter',
          type: 'initial',
          stripeCustomerId: 'cus_1',
          stripePaymentIntentId: 'pi_1',
          amountPaidCents: 9900,
          currency: 'usd',
          receiptUrl: 'https://pay.stripe.com/receipts/r1',
          purchasedAt: new Date(1_700_000_000 * 1000),
        },
      },
      createdAt: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
      lastOpened: FieldValue.serverTimestamp(),
    });
    expect(written.editDeadline).toBeInstanceOf(Timestamp);
    expect(Object.keys(written.surveyData as object)).toEqual([
      'acknowledgeEquityAllocation',
      'acknowledgeForfeiture',
      'acknowledgeIPOwnership',
      'acknowledgeConfidentiality',
      'acknowledgePeriodicReview',
      'acknowledgeAmendmentReviewRequest',
      'acknowledgeEntireAgreement',
      'acknowledgeSeverability',
    ]);
    expect((written.surveyData as Record<string, unknown>).acknowledgeForfeiture).toEqual({
      [USER]: false,
    });

    expect(collections.stripeEvents.store.get('evt_1')).toEqual({
      type: 'checkout.session.completed',
      processedAt: FieldValue.serverTimestamp(),
    });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('still creates the project when the receipt lookup fails', async () => {
    stripeMocks.paymentIntentsRetrieve.mockRejectedValue(new Error('rate limited'));

    const res = await deliver(event('checkout.session.completed', completedSession()));

    expect(collections.projects.store.get('org_1')).toMatchObject({
      payments: { cs_test_1: { receiptUrl: null, purchasedAt: expect.any(Date) } },
    });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('ignores a redelivered event that was already processed', async () => {
    collections.stripeEvents = fakeCollection({ evt_1: { type: 'checkout.session.completed' } });

    const res = await deliver(event('checkout.session.completed', completedSession()));

    expect(clerkMocks.createOrganization).not.toHaveBeenCalled();
    expect(collections.projects.store.size).toBe(0);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('returns 500 and no marker when project creation fails, so Stripe retries', async () => {
    clerkMocks.createOrganization.mockRejectedValue(new Error('Clerk down'));

    const res = await deliver(event('checkout.session.completed', completedSession()));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).not.toHaveBeenCalled();
    expect(collections.stripeEvents.store.has('evt_1')).toBe(false);
  });

  it('acknowledges but does not create anything for a session without metadata', async () => {
    const res = await deliver(
      event(
        'checkout.session.completed',
        completedSession({ client_reference_id: null, metadata: {} }),
      ),
    );

    expect(clerkMocks.createOrganization).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Missing required metadata in checkout session:',
      expect.objectContaining({ sessionId: 'cs_test_1' }),
    );
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('acknowledges unhandled event types without writing a marker', async () => {
    const res = await deliver(event('payment_intent.succeeded', { id: 'pi_1' }));

    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(collections.stripeEvents.store.size).toBe(0);
  });
});

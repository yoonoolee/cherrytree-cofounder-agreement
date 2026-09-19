/**
 * Deployment options, secrets, per-project parameters and constants shared by every function.
 *
 * Secrets come from Firebase Secret Manager (`firebase functions:secrets:set NAME`) and must be
 * listed in a function's `secrets` array to be readable there. Non-secret parameters come from
 * `functions/.env.<projectId>` (committed) and are resolved by the Firebase CLI at deploy time
 * and by the emulator. Neither is available at import time: call `.value()` inside handlers.
 */
import { defineSecret, defineString } from 'firebase-functions/params';
import type { CallableOptions, HttpsOptions } from 'firebase-functions/v2/https';

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

export const MAKE_WEBHOOK_URL = defineSecret('MAKE_WEBHOOK_URL');
export const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
export const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
export const CLERK_SECRET_KEY = defineSecret('CLERK_SECRET_KEY');
export const CLERK_WEBHOOK_SECRET = defineSecret('CLERK_WEBHOOK_SECRET');
export const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

// ---------------------------------------------------------------------------
// Per-project parameters (functions/.env.<projectId>)
// ---------------------------------------------------------------------------

/** Origin of the deployed web app, e.g. `https://my.cherrytree.app`. No trailing slash. */
export const APP_ORIGIN = defineString('APP_ORIGIN', {
  description:
    'Origin of the web app this project serves (used for Stripe and invitation redirects)',
});

/** Stripe Price ids per plan. Test-mode prices on dev, live prices on prod. */
export const STRIPE_STARTER_PRICE_ID = defineString('STRIPE_STARTER_PRICE_ID', {
  description: 'Stripe Price id of the starter plan',
});
export const STRIPE_PRO_PRICE_ID = defineString('STRIPE_PRO_PRICE_ID', {
  description: 'Stripe Price id of the pro plan',
});

/** The Vite dev server; accepted as a redirect origin so local development round-trips. */
export const LOCAL_DEV_ORIGIN = 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Trigger options
// ---------------------------------------------------------------------------

/** Free-tier sizing; every function runs as the dedicated service account. */
export const FUNCTION_CONFIG = {
  region: 'us-west2',
  memory: '256MiB',
  serviceAccount: `cloud-functions@${process.env.GCLOUD_PROJECT}.iam.gserviceaccount.com`,
} satisfies HttpsOptions;

/**
 * Every `onCall` function: publicly invokable (auth is checked in the handler via
 * `request.auth`), reachable only with a valid App Check token, and the token is consumed
 * so a captured request cannot be replayed. Guarded by test/endpoints.test.ts.
 */
export const CALLABLE_OPTIONS = {
  ...FUNCTION_CONFIG,
  invoker: 'public',
  enforceAppCheck: true,
  consumeAppCheckToken: true,
} satisfies CallableOptions;

/** Every `onRequest` webhook: server-to-server only, so no CORS. Signatures are verified in the handler. */
export const WEBHOOK_OPTIONS = {
  ...FUNCTION_CONFIG,
  cors: false,
} satisfies HttpsOptions;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Survey schema version stamped on new projects. */
export const CURRENT_SURVEY_VERSION = '1.0.0';

/** Edit window granted at purchase (units: 'months', 'days', 'years', 'hours', 'minutes'). */
export const EDIT_WINDOW_CONFIG = { amount: 6, unit: 'months' } as const;

/** Exact hostnames a PDF URL returned by the Make.com webhook may use. */
export const PDF_ALLOWED_DOMAINS: readonly string[] = [
  'drive.google.com',
  'storage.googleapis.com',
  'firebasestorage.googleapis.com',
  's3.amazonaws.com',
  'www.dropbox.com',
  'dropbox.com',
  'onedrive.live.com',
];

export const MAKE_WEBHOOK_TIMEOUT_MS = 30_000;

/** RFC 5321 maximum. */
export const EMAIL_MAX_LENGTH = 254;
export const PROJECT_NAME_MIN_LENGTH = 2;
export const PROJECT_NAME_MAX_LENGTH = 100;

export const CONTACT_RECIPIENT_EMAIL = 'hello@cherrytree.app';
export const CONTACT_NAME_MAX_LENGTH = 200;
export const CONTACT_MESSAGE_MAX_LENGTH = 5000;

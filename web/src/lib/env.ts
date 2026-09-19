/**
 * Build-time environment, read once from `import.meta.env` (typed in vite-env.d.ts; every key
 * must exist in web/.env.example). Vite inlines each key at build time and leaves a missing one
 * `undefined`, which is deliberately not turned into an error here: only the Clerk key is
 * required, and main checks it.
 */

/** A flag is on only for the exact string `true`. */
const flag = (value: string | undefined): boolean => value === 'true';

export const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,

  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  },
  /** reCAPTCHA v3 site key for App Check in built bundles. */
  recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  /** Point the Firebase SDKs at local emulators (dev server only). */
  useEmulators: flag(import.meta.env.VITE_USE_EMULATORS),

  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  /** Sentry is disabled when empty. */
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,

  /** Redirect `http:` to `https:` in production builds. */
  enforceHttps: flag(import.meta.env.VITE_ENFORCE_HTTPS),
  /** Origin of the app host (the marketing pages link into it). */
  appUrl: import.meta.env.VITE_APP_URL,
} as const;

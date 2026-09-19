/// <reference types="vite/client" />

// Build-time environment. Every key must exist in web/.env.example; Vite exposes only
// `VITE_*` keys to the bundle and leaves a missing key `undefined` at runtime.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_STRIPE_STARTER_PRICE_ID: string;
  readonly VITE_STRIPE_PRO_PRICE_ID: string;
  readonly VITE_ENFORCE_HTTPS: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_MARKETING_URL: string;
  readonly VITE_APP_URL: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_USE_EMULATORS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

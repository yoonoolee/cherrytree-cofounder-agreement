import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import { UserProvider } from './contexts/UserContext';
import { Toaster } from 'react-hot-toast';
import * as Sentry from '@sentry/react';
import { env } from './lib/env';

// Initialize Sentry for error tracking
if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.isProd ? 'production' : 'development',
    tracesSampleRate: 0.1,
  });
}

// Enforce HTTPS in production
if (env.enforceHttps && env.isProd && window.location.protocol === 'http:') {
  window.location.href = window.location.href.replace('http:', 'https:');
}

const clerkPubKey = env.clerkPublishableKey;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ClerkProvider
    publishableKey={clerkPubKey}
    appearance={{
      variables: { colorPrimary: '#000000' },
    }}
    signInUrl="/login"
    signUpUrl="/signup"
    signInFallbackRedirectUrl="/dashboard"
    signUpFallbackRedirectUrl="/dashboard"
  >
    <UserProvider>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#333', color: '#fff' },
          success: { duration: 3000 },
          error: { duration: 5000 },
        }}
      />
    </UserProvider>
  </ClerkProvider>,
);

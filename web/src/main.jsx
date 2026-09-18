import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import { UserProvider } from './contexts/UserContext';
import { Toaster } from 'react-hot-toast';
import * as Sentry from '@sentry/react';

// Initialize Sentry for error tracking
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.PROD ? 'production' : 'development',
    tracesSampleRate: 0.1,
  });
}

// Enforce HTTPS in production
if (import.meta.env.VITE_ENFORCE_HTTPS === 'true' &&
    import.meta.env.PROD &&
    window.location.protocol === 'http:') {
  window.location.href = window.location.href.replace('http:', 'https:');
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ClerkProvider
    publishableKey={clerkPubKey}
    appearance={{
      variables: { colorPrimary: '#000000' }
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
  </ClerkProvider>
);

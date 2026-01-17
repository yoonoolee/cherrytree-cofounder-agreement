# Cherrytree - Cofounder Agreement Platform

A SaaS platform that helps startup cofounders create legally sound cofounder agreements through guided surveys and real-time collaboration.

## Tech Stack

- **Frontend**: React 19, React Router, Tailwind CSS
- **Backend**: Firebase (Firestore, Cloud Functions, Hosting)
- **Authentication**: Clerk (handles auth + email invitations)
- **Payments**: Stripe
- **External Services**: Make.com (PDF generation), Google Maps API

## Project Structure

```
├── src/
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts (UserContext, etc.)
│   ├── constants/         # Shared constants (pricing, etc.)
│   ├── firebase.js        # Firebase initialization
│   └── App.js             # Main app component
├── functions/             # Firebase Cloud Functions
├── public/               # Static assets
└── firestore.rules       # Firestore security rules
```

---

## Environment Setup

### Prerequisites
- Node.js 22+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase account with two projects:
  - `cherrytree-cofounder-agree-dev` (development)
  - `cherrytree-cofounder-agreement` (production)

### Environment Files

| File | Purpose | Committed to Git |
|------|---------|------------------|
| `.env.example` | Template with placeholder values | ✅ Yes |
| `.env.development` | Dev keys (localhost) | ❌ No |
| `.env.production` | Prod keys | ❌ No |
| `.env.local` | Local overrides (optional) | ❌ No |

### First-Time Setup

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd cherrytree-cofounder-agreement
   npm install
   cd functions && npm install && cd ..
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.development
   cp .env.example .env.production
   ```
   Then fill in API keys from team members or create new ones.

3. **Login to Firebase**
   ```bash
   firebase login
   firebase use dev
   ```

---

## Local Development

```bash
npm start
```
- Opens http://localhost:3000
- Uses `.env.development` configuration
- Hot reload on file changes

---

## Deployment

### Environments

| Environment | Firebase Project | URL |
|-------------|------------------|-----|
| Development | `cherrytree-cofounder-agree-dev` | https://cherrytree-cofounder-agree-dev.web.app |
| Production | `cherrytree-cofounder-agreement` | https://cherrytree.app / https://my.cherrytree.app |

### Deploy Commands

```bash
# Deploy everything to dev
npm run deploy:dev

# Deploy everything to prod
npm run deploy:prod

# Deploy specific services
npm run deploy:hosting:dev      # Frontend only
npm run deploy:functions:dev    # Backend only
firebase deploy --only firestore:rules  # Rules only
```

### Switch Environments

```bash
firebase use dev    # Switch to dev
firebase use prod   # Switch to prod
firebase use        # Check current
```

---

## Firebase Secrets

Sensitive keys are stored in Firebase Secret Manager (not in .env files).

### Required Secrets (set for both dev and prod)

| Secret | Description |
|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `CLERK_SECRET_KEY` | Clerk API secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `MAKE_WEBHOOK_URL` | Make.com PDF generation webhook |

### Set a Secret

```bash
firebase use dev  # or prod
firebase functions:secrets:set SECRET_NAME
firebase deploy --only functions
```

### View Secrets

```bash
firebase functions:secrets:access SECRET_NAME
```

---

## Webhook Configuration

All Cloud Functions are deployed to **us-west2** region.

### Clerk Webhooks

| Environment | URL |
|-------------|-----|
| Dev | `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/clerkWebhook` |
| Prod | `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/clerkWebhook` |

**Events**: `user.created`, `user.updated`, `user.deleted`, `organization.created`, `organizationMembership.created`, `organizationMembership.deleted`

### Stripe Webhooks

| Environment | URL |
|-------------|-----|
| Dev | `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/stripeWebhook` |
| Prod | `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/stripeWebhook` |

**Events**: `checkout.session.completed`

After configuring webhooks, set the signing secret:
```bash
firebase use dev  # or prod
echo "whsec_..." | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --force --data-file=-
firebase deploy --only functions
```

---

## Google Maps API

Google Maps Places API is used for address autocomplete in Section 1.

### Setup (Already Configured)

1. GCP Project created with Places API enabled
2. API key restricted to HTTP referrers and Places API only
3. Key stored in `.env.development` and `.env.production` as `REACT_APP_GOOGLE_MAPS_API_KEY`

### Restrictions

- **Dev**: `http://localhost:3000/*`
- **Prod**: Production domain(s)

### Cost

$200/month free tier - normal usage stays well within this.

---

## Edit Window Feature

Users have 6 months from purchase date to edit their agreement. The deadline is stored in Firestore as `editDeadline`.

### Configuration

Located in `functions/index.js`:
```javascript
const EDIT_WINDOW_CONFIG = {
  amount: 6,
  unit: 'months'
};
```

### Behavior

- **Within window**: Full editing access
- **After deadline**: Read-only, cannot modify collaborators
- **Legacy projects** (no `editDeadline`): Unlimited editing

---

## Quick Reference

### Important URLs

**External Services:**
- Stripe: https://dashboard.stripe.com
- Clerk: https://dashboard.clerk.com
- Google Cloud: https://console.cloud.google.com
- Firebase Dev: https://console.firebase.google.com/project/cherrytree-cofounder-agree-dev
- Firebase Prod: https://console.firebase.google.com/project/cherrytree-cofounder-agreement

### Common Commands

```bash
# Development
npm start                           # Run local dev server
npm run build                       # Build for production

# Deployment
npm run deploy:dev                  # Deploy all to dev
npm run deploy:prod                 # Deploy all to prod

# Firebase
firebase use dev/prod               # Switch environment
firebase functions:log              # View function logs
firebase functions:secrets:set X    # Set secret
```

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

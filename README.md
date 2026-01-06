# Cherrytree - Cofounder Agreement Platform

A SaaS platform that helps startup cofounders create legally sound cofounder agreements through guided surveys and real-time collaboration.

## Tech Stack

- **Frontend**: React 19, React Router, Tailwind CSS
- **Backend**: Firebase (Firestore, Cloud Functions, Hosting, Auth)
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

### Environment Variables

This project uses environment-specific configuration files:

- **`.env.development`** - Used when running `npm start` (local development)
- **`.env.production`** - Used when running `npm run build` (production builds)
- **`.env.example`** - Template showing all required variables

See [README.env.md](./README.env.md) for detailed environment variable documentation.

### First-Time Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd cherrytree-cofounder-agreement
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.development`
   - Copy `.env.example` to `.env.production`
   - Get API keys from team members or set up new ones

4. **Login to Firebase**
   ```bash
   firebase login
   ```

5. **Select Firebase project**
   ```bash
   firebase use dev    # Use dev project for local development
   ```

---

## Local Development

### Run Development Server

```bash
npm start
```
- Opens [http://localhost:3000](http://localhost:3000)
- Uses `.env.development` configuration
- Hot reload on file changes

### Build for Production

```bash
npm run build
```
- Builds the app for production to the `build` folder
- Uses `.env.production` configuration
- Optimized and minified for deployment

---

## Deployment

### Current Environments

| Environment | Firebase Project ID | Domains | Status |
|-------------|---------------------|---------|--------|
| **Development** | `cherrytree-cofounder-agree-dev` | localhost:3000 | Testing, development |
| **Production** | `cherrytree-cofounder-agreement` | cherrytree.app, my.cherrytree.app | Live |

### Switching Between Environments

```bash
# Switch to dev environment
firebase use dev

# Switch to prod environment
firebase use prod

# Check current environment
firebase use
```

### Deploy to Development

```bash
# 1. Switch to dev environment
firebase use dev

# 2. Build the app
npm run build

# 3. Deploy
firebase deploy

# OR deploy specific services:
firebase deploy --only hosting              # Frontend only
firebase deploy --only functions            # Cloud Functions only
firebase deploy --only firestore:rules      # Firestore security rules only
```

### Deploy to Production

⚠️ **IMPORTANT**: Always test in dev first!

```bash
# 1. Switch to prod environment
firebase use prod

# 2. Build the app
npm run build

# 3. Deploy
firebase deploy

# OR deploy specific services:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

---

## Firebase Configuration

### Secrets Management

Sensitive keys (Stripe secret, Clerk secret, etc.) are stored in Firebase Secret Manager, NOT in .env files.

**Set a secret:**
```bash
firebase use dev
firebase functions:secrets:set STRIPE_SECRET_KEY

firebase use prod
firebase functions:secrets:set STRIPE_SECRET_KEY
```

**View secrets:**
```bash
firebase functions:secrets:access STRIPE_SECRET_KEY
```

**Required secrets** (set separately for dev and prod):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `MAKE_WEBHOOK_URL`

### Webhook Configuration

All Cloud Functions are deployed to **us-west2** region.

#### Clerk Webhooks

**Dev Webhook**:
- **URL**: `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/clerkWebhook`
- **Events**: `user.created`, `user.updated`, `user.deleted`, `organization.created`, `organizationMembership.created`, `organizationMembership.deleted`

**Prod Webhook**:
- **URL**: `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/clerkWebhook`
- **Events**: Same as dev

After configuring each webhook, copy the signing secret and set it:
```bash
firebase use dev  # or prod
echo "whsec_YOUR_SIGNING_SECRET" | firebase functions:secrets:set CLERK_WEBHOOK_SECRET --force --data-file=-
firebase deploy --only functions:clerkWebhook
```

#### Stripe Webhooks

**Dev Webhook**:
- **URL**: `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/stripeWebhook`
- **Events**: `checkout.session.completed`

**Prod Webhook**:
- **URL**: `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/stripeWebhook`
- **Events**: `checkout.session.completed`

After configuring each webhook, copy the signing secret and set it:
```bash
firebase use dev  # or prod
echo "whsec_YOUR_SIGNING_SECRET" | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --force --data-file=-
firebase deploy --only functions:stripeWebhook,createCheckoutSession
```

---

## Git Workflow

### Deployment Process

```bash
# 1. Make changes locally
git checkout -b feature/my-feature

# 2. Test locally
npm start

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/my-feature

# 4. Deploy to dev for testing
firebase use dev
npm run build
firebase deploy

# 5. Test in dev environment
# Open https://cherrytree-cofounder-agree-dev.web.app

# 6. Deploy to prod
firebase use prod
npm run build
firebase deploy

# 7. Merge to master
```

**Note**: Pushing to GitHub does NOT automatically deploy. All deployments are manual.

**Best Practice**: Always test in dev before deploying to prod.

---

## Quick Reference

### Important URLs

**Development:**
- Local: http://localhost:3000
- Hosted: https://cherrytree-cofounder-agree-dev.web.app
- Console: https://console.firebase.google.com/project/cherrytree-cofounder-agree-dev

**Production:**
- Marketing: https://cherrytree.app
- App: https://my.cherrytree.app
- Console: https://console.firebase.google.com/project/cherrytree-cofounder-agreement

**External Services:**
- Stripe: https://dashboard.stripe.com
- Clerk: https://dashboard.clerk.com
- Google Cloud: https://console.cloud.google.com

### Common Commands

```bash
# Switch environments
firebase use dev
firebase use prod

# Deploy
firebase deploy                              # Deploy everything
firebase deploy --only hosting              # Frontend only
firebase deploy --only functions            # Functions only
firebase deploy --only firestore:rules      # Rules only

# View logs
firebase functions:log
firebase functions:log --only clerkWebhook

# Manage secrets
firebase functions:secrets:set SECRET_NAME
firebase functions:secrets:access SECRET_NAME
```

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

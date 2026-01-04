# Cherrytree - Cofounder Agreement Platform

A SaaS platform that helps startup cofounders create legally sound cofounder agreements through guided surveys and real-time collaboration.

## Tech Stack

- **Frontend**: React 19, React Router, Tailwind CSS
- **Backend**: Firebase (Firestore, Cloud Functions, Hosting, Auth)
- **Authentication**: Clerk (handles auth + email invitations)
- **Payments**: Stripe
- **External Services**: Make.com (PDF generation), Google Maps API

## Project Structure

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

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
   - Copy `.env.example` to `.env.development` (already configured)
   - Copy `.env.example` to `.env.production` (already configured)
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

## Deployment

### Current State (January 2026)

**✅ Dev Environment**: Fully configured and operational
- Firebase project: `cherrytree-cofounder-agree-dev`
- Domain: localhost:3000
- All Cloud Functions deployed to **us-west2**
- Stripe: Using **TEST** keys with webhook configured
- Clerk: Using **TEST** instance with webhook configured

**✅ Prod Environment**: Deployed but using test keys (ready for launch)
- Firebase project: `cherrytree-cofounder-agreement`
- Domains: cherrytree.app, my.cherrytree.app
- All Cloud Functions deployed to **us-west2**
- Stripe: Using **TEST** keys (same as dev - will switch to LIVE before launch)
- Clerk: Using **LIVE** instance with webhook configured

**Note**: Both environments currently share the same Stripe TEST keys. The dev Stripe webhook is configured for testing. When you launch, you'll set up separate Stripe LIVE keys and webhook for production (see "Stripe Production Setup" section below).

### Dev vs Prod Environments

This project uses **one codebase** with **two Firebase environments**:

| Environment | Firebase Project ID | Domains | Purpose |
|-------------|---------------------|---------|---------|
| **Development** | `cherrytree-cofounder-agree-dev` | localhost:3000 | Testing, development |
| **Production** | `cherrytree-cofounder-agreement` | cherrytree.app, my.cherrytree.app | Live customer-facing app |

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

# 2. Build the app (uses .env.development)
npm run build

# 3. Deploy everything
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

# 2. Build the app (uses .env.production)
npm run build

# 3. Deploy everything
firebase deploy

# OR deploy specific services:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### Firebase Secrets Management

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

Both Stripe and Clerk use webhooks to notify your backend of events. These must be configured in their respective dashboards.

#### Clerk Webhooks

**Dev Webhook** (Clerk TEST instance):
- **Endpoint URL**: `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/clerkWebhook`
- **Required Events**:
  - `user.created`
  - `user.updated`
  - `user.deleted`
  - `organization.created`
  - `organizationMembership.created`
  - `organizationMembership.deleted`

**Prod Webhook** (Clerk LIVE instance):
- **Endpoint URL**: `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/clerkWebhook`
- **Required Events**: Same as dev (see above)

After configuring each webhook, copy the signing secret and set it:
```bash
firebase use dev  # or prod
echo "whsec_YOUR_SIGNING_SECRET" | firebase functions:secrets:set CLERK_WEBHOOK_SECRET --force --data-file=-
firebase deploy --only functions:clerkWebhook
```

#### Stripe Webhooks

**Dev Webhook** (Stripe TEST mode):
- **Endpoint URL**: `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/stripeWebhook`
- **Required Events**: `checkout.session.completed`
- **Status**: ✅ Currently configured for testing

**Prod Webhook** (Stripe LIVE mode):
- **Endpoint URL**: `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/stripeWebhook`
- **Required Events**: `checkout.session.completed`
- **Status**: ⏳ Will be configured when switching to Stripe LIVE keys (see "Stripe Production Setup" below)

After configuring each webhook, copy the signing secret and set it:
```bash
firebase use dev  # or prod
echo "whsec_YOUR_SIGNING_SECRET" | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --force --data-file=-
firebase deploy --only functions:stripeWebhook,createCheckoutSession
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

### Using Firebase Emulators (Optional)

For local development without hitting production Firebase:

```bash
# 1. Start Firebase emulators
firebase emulators:start

# 2. In .env.development, set:
REACT_APP_USE_EMULATORS=true

# 3. Run the app
npm start
```

This runs Firestore, Cloud Functions, and Auth locally.

---

## Git Workflow

### Current Setup: Manual Deployments

```bash
# 1. Make changes locally on a feature branch
git checkout -b feature/my-feature

# 2. Test locally
npm start  # Test on localhost:3000

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/my-feature

# 4. Deploy to dev for testing in cloud environment
firebase use dev
npm run build
firebase deploy

# 5. Test in dev environment
# Open https://cherrytree-cofounder-agree-dev.web.app
# Run through test scenarios
# Test payments using Stripe test cards

# 6. If everything works, deploy to prod
firebase use prod
npm run build
firebase deploy

# 7. Merge PR to master
# (Optional: verify prod at https://my.cherrytree.app)
```

**Note**: Pushing to GitHub does NOT automatically deploy anything. All deployments are manual.

**Best Practice**: Always test in dev before deploying to prod, even for small changes.

---

## TODO: Future Improvements

### Stripe Production Setup (REQUIRED BEFORE LAUNCH)

**Current State**:
- ✅ Both dev and prod are using the **same** Stripe TEST keys (safe for testing, no real money)
- ✅ Dev Stripe webhook configured and working (`https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/stripeWebhook`)
- ❌ Stripe business profile incomplete (blocking access to live mode)
- ❌ Prod Stripe LIVE webhook not configured (will set up when switching to live keys)
- ❌ Stripe Tax not enabled for production

**When to do this**: Before launching to real customers / accepting real payments

**What this does**: Switches production environment from Stripe TEST keys to Stripe LIVE keys so you can accept real payments

#### Step 1: Complete Stripe Business Profile

Before you can accept real payments, you must complete Stripe onboarding:

1. **Go to**: https://dashboard.stripe.com
2. Click on the banner/message about completing your business profile
3. **Complete all required steps**:
   - Bank account verification
   - Business details confirmation
   - Tax information (EIN, etc.)
   - Identity verification
   - Any other required steps

**Estimated time**: 15-30 minutes
**Processing time**: Stripe may take 1-2 business days to verify

#### Step 2: Set Up Live Webhook

After Stripe approves your account:

1. **Go to**: https://dashboard.stripe.com/webhooks
2. **Switch to LIVE mode** (toggle in top right - orange banner should disappear)
3. Click **"Add destination"**
4. **Endpoint URL**:
   ```
   https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/stripeWebhook
   ```
5. **Description**: `Cherrytree Production - Payment Processing`
6. **Events**: Select `checkout.session.completed`
7. Click **"Create"** or **"Add destination"**
8. **Copy the signing secret** (starts with `whsec_...`)
9. **Update Firebase secret**:
   ```bash
   firebase use prod
   echo "whsec_YOUR_LIVE_WEBHOOK_SECRET" | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --force --data-file=-
   firebase deploy --only functions:stripeWebhook,createCheckoutSession
   ```

#### Step 3: Get Stripe LIVE Keys

1. **Go to**: https://dashboard.stripe.com/apikeys
2. **Make sure you're in LIVE mode** (no orange test banner)
3. **Get Live Publishable Key** (starts with `pk_live_...`)
4. **Get Live Secret Key** (starts with `sk_live_...` - click "Reveal")
5. **Create LIVE Products** (if not done automatically):
   - Go to: https://dashboard.stripe.com/products
   - Create products same as test: Starter ($200), Pro ($800)
   - Copy the LIVE price IDs (starts with `price_...`)
6. **Update `.env.production`**:
   ```bash
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
   REACT_APP_STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_ID
   REACT_APP_STRIPE_PRO_PRICE_ID=price_YOUR_PRO_ID
   ```
7. **Update Firebase secret**:
   ```bash
   firebase use prod
   echo "sk_live_YOUR_SECRET_KEY" | firebase functions:secrets:set STRIPE_SECRET_KEY --force --data-file=-
   firebase deploy --only functions:stripeWebhook,createCheckoutSession
   ```

#### Step 4: Keep Dev Webhook for Testing

Your Stripe TEST webhook should remain pointed at dev for ongoing testing:
- **Keep configured**: `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/stripeWebhook`
- This allows you to continue testing payment flows in development
- Live and test webhooks are separate in Stripe, so they won't conflict

#### Step 5: Enable Stripe Tax for Production

**Steps to enable Stripe Tax for Production**:

1. **Enable Stripe Tax**:
   - Go to: https://dashboard.stripe.com/settings/tax
   - Switch to **Live mode** (toggle in top right)
   - Click **"Turn on Stripe Tax"** or **"Get started"**
   - Choose **"Pay-as-you-go"** plan (0.5% per transaction)

2. **Configure Business Details**:
   - **Legal business name**: Cherrytree Technologies, LLC
   - **Business address**: Your registered business address (from Stripe Atlas)
   - **Tax ID (EIN)**: Your company's EIN

3. **Set Tax Registrations**:
   - Select states/countries where you're registered to collect sales tax
   - At minimum: Your home state (where incorporated)
   - Add more as you expand

4. **Update Product Tax Settings**:
   - Go to: https://dashboard.stripe.com/products
   - Edit both Starter and Pro products
   - **Tax behavior**: Select **"Exclusive"** (tax added at checkout - US standard)
   - **Tax code**: Select **"SaaS - Software as a Service"** (txcd_10504000)

5. **Test in Live Mode**:
   - Create a test checkout session
   - Verify tax is calculated correctly
   - Check that tax appears on Stripe invoices

**Documentation**: [Stripe Tax Setup Guide](https://stripe.com/docs/tax)

#### Summary: Launch Day Stripe Checklist

When you're ready to launch and accept real payments:

- [ ] Complete Stripe business profile (Step 1)
- [ ] Wait for Stripe approval (1-2 business days)
- [ ] Switch to Stripe LIVE mode in dashboard
- [ ] Create LIVE webhook pointing to prod (Step 2)
- [ ] Get LIVE publishable key and secret key (Step 3)
- [ ] Create LIVE products and get price IDs (Step 3)
- [ ] Update `.env.production` with LIVE keys (Step 3)
- [ ] Update Firebase prod secrets with LIVE keys (Step 3)
- [ ] Deploy updated functions to prod
- [ ] Enable Stripe Tax in LIVE mode (Step 5)
- [ ] Test a real payment (use a real card, then refund it)
- [ ] Verify webhook is receiving events in Stripe dashboard
- [ ] Keep TEST webhook pointed at dev for continued development (Step 4)

After launch, you'll have:
- **Dev**: Using Stripe TEST keys + TEST webhook (for development)
- **Prod**: Using Stripe LIVE keys + LIVE webhook (for customers)

---

### CI/CD Automation (Not Implemented Yet)

**Current State**: All deployments are manual (you run `firebase deploy`)

**Future Goal**: Set up GitHub Actions for automated deployments

#### Recommended CI/CD Setup:

1. **Auto-deploy to DEV**
   - Push to `main` branch → Auto-deploys to dev environment
   - Runs tests automatically
   - Fast feedback loop

2. **Manual approval for PROD**
   - Click "Deploy to Production" button in GitHub UI
   - Requires approval from team member
   - Safe, controlled production releases

3. **Automated testing**
   - Run unit tests on every PR
   - Run integration tests before deployment
   - Block deployment if tests fail

#### Example GitHub Actions Workflow:

Create `.github/workflows/deploy-dev.yml`:
```yaml
name: Deploy to Dev
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: firebase use dev
      - run: firebase deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Create `.github/workflows/deploy-prod.yml`:
```yaml
name: Deploy to Production
on:
  workflow_dispatch:  # Manual trigger only!
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: firebase use prod
      - run: firebase deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

**Setup instructions**: See [GitHub Actions Documentation](https://docs.github.com/en/actions)

#### Why We Haven't Set This Up Yet:

- ✅ Manual deployments are safer while learning
- ✅ Full control over when things deploy
- ✅ No risk of accidental production deployments
- ⏰ Can add CI/CD later when ready

---

## Quick Reference

### Important URLs

**Development Environment:**
- Local dev: http://localhost:3000
- Firebase hosting: https://cherrytree-cofounder-agree-dev.web.app
- Firebase console: https://console.firebase.google.com/project/cherrytree-cofounder-agree-dev
- clerkWebhook: `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/clerkWebhook`
- stripeWebhook: `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/stripeWebhook`

**Production Environment:**
- Marketing site: https://cherrytree.app
- App: https://my.cherrytree.app
- Firebase console: https://console.firebase.google.com/project/cherrytree-cofounder-agreement
- clerkWebhook: `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/clerkWebhook`
- stripeWebhook: `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/stripeWebhook`

**External Services:**
- Stripe Dashboard: https://dashboard.stripe.com
- Clerk Dashboard: https://dashboard.clerk.com
- Google Cloud Console: https://console.cloud.google.com

### Common Commands

```bash
# Switch environments
firebase use dev
firebase use prod

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules

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

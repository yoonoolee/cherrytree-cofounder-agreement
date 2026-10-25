# Cherrytree

A SaaS platform that helps startup cofounders create a cofounder agreement with AI agents (Advisor, Drafting, Review, Editing). The agent product is designed but not built yet; its design is linked from [ARCHITECTURE.md](ARCHITECTURE.md).

## Tech Stack

- **Language**: TypeScript everywhere (strict)
- **Frontend**: React 19, React Router 8 (declarative `BrowserRouter`), Tailwind CSS 4 (`@tailwindcss/vite`), built with Vite 8
- **Backend**: Firebase (Firestore, Cloud Functions v2 on Node 24, Hosting, App Check)
- **Tooling**: npm workspaces, ESLint 10, Prettier, Vitest, knip, esbuild (functions bundle)
- **Schemas**: Zod (`packages/shared`), the source for Firestore document types and read validation
- **Authentication**: Clerk (`@clerk/react` 6; one Clerk organization per project)
- **Payments**: Stripe
- **External Services**: Resend (contact form email), Sentry (optional)

## Project Structure

```
├── apps/
│   ├── web/                    # @cherrytree/web (npm workspace): marketing pages + dashboard, Vite + React
│   │   ├── index.html          # Vite entry
│   │   ├── public/             # Static assets
│   │   ├── .env.example        # Template for .env.dev and .env.production
│   │   └── src/
│   │       ├── main.tsx, App.tsx   # Bootstrap + routes
│   │       ├── lib/            # Firebase init + validated collection refs, typed callables, env
│   │       ├── contexts/       # UserContext (Clerk → Firebase session, user profile)
│   │       ├── hooks/, components/, pages/, utils/, constants/
│   ├── functions/              # Cloud Functions — standalone package with its own lockfile
│   │   ├── src/                # index.ts + one module per concern; lib/ helpers; config.ts
│   │   ├── test/               # endpoint golden, rules tests, Admin SDK test helpers
│   │   ├── esbuild.config.ts   # Bundles src/index.ts (+ packages/shared) into lib/index.cjs at deploy
│   │   └── .env.<projectId>    # Non-secret per-project params (committed)
│   └── agent/                  # Reserved for the Python agent service (FastAPI on Cloud Run)
├── packages/
│   └── shared/                 # @cherrytree/shared (npm workspace): Zod schemas + types for both sides
│       └── src/
│           ├── domain/         # Firestore documents (Project, UserDoc, ProWaitlistSignup)
│           └── callables.ts    # Request/response contract of every onCall function
├── ARCHITECTURE.md             # Links to the agent design (Notion Working Doc, FigJam diagram)
├── firestore.rules             # Firestore security rules (tested by npm run test:rules)
├── firestore.indexes.json
├── firebase.json               # Hosting (apps/web/dist, CSP headers), functions source + predeploy build
├── eslint.config.ts, .prettierrc, tsconfig.base.json, vitest.config.ts, knip.json
├── .github/workflows/          # ci.yml (PRs), deploy-prod.yml (master), deploy-dev.yml (manual)
└── package.json                # Root: workspaces + scripts
```

---

## Environment Setup

### Prerequisites

- Node.js 24 (`.nvmrc`; with nvm: `nvm install && nvm use`)
- Firebase CLI: `npm install -g firebase-tools`
- Java 21+ (only for `npm run test:rules`, which runs the Firestore emulator)
- Access to the two Firebase projects:
  - `cherrytree-cofounder-agree-dev` (development)
  - `cherrytree-cofounder-agreement` (production)

### Environment Files

| File | Purpose | Committed to Git |
|------|---------|------------------|
| `apps/web/.env.example` | Template with placeholder values | ✅ Yes |
| `apps/web/.env.dev` | Dev keys (localhost and the dev deploy) | ❌ No |
| `apps/web/.env.production` | Prod keys (CI writes this from GitHub secrets) | ❌ No |
| `apps/web/.env.dev.local` | Local overrides (optional) | ❌ No |
| `apps/functions/.env.cherrytree-cofounder-agree-dev` | Dev functions params (`APP_ORIGIN`, Stripe price ids) | ✅ Yes |
| `apps/functions/.env.cherrytree-cofounder-agreement` | Prod functions params | ✅ Yes |

All browser-exposed variables are prefixed `VITE_` and are typed in `apps/web/src/vite-env.d.ts`. Secrets never go in env files — see [Firebase Secrets](#firebase-secrets).

### First-Time Setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd cherrytree-cofounder-agreement
   nvm use
   npm ci
   npm --prefix apps/functions ci
   ```

2. **Set up environment variables**

   ```bash
   cp apps/web/.env.example apps/web/.env.dev
   ```

   Then fill in the keys (`apps/web/.env.production` is only needed for a local prod build).

3. **Login to Firebase**

   ```bash
   firebase login
   firebase use dev
   ```

4. **Register an App Check debug token** (once per browser profile)

   Every callable enforces App Check. On the first `npm run dev`, the browser console prints `Firebase App Check debug token: …`. Register it in the **dev** Firebase console → App Check → Apps → web app → Manage debug tokens. Until then every callable returns `unauthenticated` on localhost.

---

## Local Development

```bash
npm run dev
```

- Serves http://localhost:3000 (the port is baked into the Clerk dev origins)
- Uses `apps/web/.env.dev`
- Hot reload on file changes

### Quality checks

```bash
npm run check         # lint + format check + typecheck + tests + build — run before every push
npm run lint          # ESLint (npm run lint:fix to autofix)
npm run format        # Prettier (write); format:check to verify
npm run typecheck     # tsc for apps/web, packages/shared and apps/functions
npm test              # Vitest: apps/web (jsdom), packages/shared, apps/functions
npm run test:rules    # Firestore rules under the emulator (Java required)
npm run knip          # unused files / exports / dependencies
```

Single test file: `cd apps/web && npx vitest run src/pages/DashboardPage.test.tsx` (or `cd apps/functions && npx vitest run src/stripe.test.ts`).

### Continuous integration

- **Pull requests to `master`** (`ci.yml`): `npm run check`, `knip`, `npm audit --audit-level=high` in both the root and `apps/functions/`, and the Firestore rules tests.
- **Push to `master`** (`deploy-prod.yml`): the full `ci.yml` job above, then hosting + functions + rules/indexes to prod with `firebase deploy --force` (the `--force` lets the non-interactive CLI delete functions removed from source).
- **`deploy-dev.yml`** (same CI gate) is run by hand from the Actions tab; day to day, dev is deployed locally.

---

## Deployment

### Environments

| Environment | Firebase Project | URL |
|-------------|------------------|-----|
| Development | `cherrytree-cofounder-agree-dev` | https://cherrytree-cofounder-agree-dev.web.app |
| Production | `cherrytree-cofounder-agreement` | https://cherrytree.app / https://my.cherrytree.app |

### Deploy to dev (local)

```bash
firebase use                    # must say cherrytree-cofounder-agree-dev
npm run deploy:dev              # build:dev + functions + hosting + rules + indexes
npm run deploy:hosting:dev      # Frontend only
npm run deploy:functions:dev    # Backend only
firebase deploy --only firestore:rules
```

Deploy functions and hosting **together** whenever either changes: the web app sends limited-use App Check tokens that the functions consume, so a mismatched pair breaks every callable.

### Deploy to prod

Only through GitHub Actions, by merging to `master`. `firebase deploy --project cherrytree-cofounder-agreement` works from a laptop, but don't — it bypasses CI and git history. Before launch, revoke prod deploy roles from personal accounts (see `TODO.md`).

### Switch Environments

```bash
firebase use dev    # Switch to dev
firebase use prod   # Switch to prod
firebase use        # Check current
```

### Functions runtime service account

Every function runs as `cloud-functions@<projectId>.iam.gserviceaccount.com` (set in `apps/functions/src/config.ts`) with: `roles/datastore.user`, `roles/firebaseauth.admin`, `roles/iam.serviceAccountTokenCreator`, `roles/serviceusage.serviceUsageConsumer`, and `roles/firebaseappcheck.tokenVerifier` (needed to verify App Check tokens; without it every callable fails with `app-check/permission-denied`).

```bash
gcloud projects add-iam-policy-binding <projectId> \
  --member=serviceAccount:cloud-functions@<projectId>.iam.gserviceaccount.com \
  --role=roles/firebaseappcheck.tokenVerifier
```

---

## Firebase Secrets

Sensitive keys are stored in Firebase Secret Manager and declared with `defineSecret` in `apps/functions/src/config.ts`.

### Required Secrets (set for both dev and prod)

| Secret | Source |
|--------|--------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys (`sk_test_…` on dev; prod is also test mode until launch) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of that environment's webhook endpoint (`whsec_…`) |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API keys of the matching Clerk instance |
| `CLERK_WEBHOOK_SECRET` | Signing secret of the Clerk webhook endpoint (Svix) |
| `RESEND_API_KEY` | Resend → API keys (contact form → `hello@cherrytree.app`) |

Non-secret parameters (`APP_ORIGIN`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`) live in the committed `apps/functions/.env.<projectId>` files instead.

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

All Cloud Functions are deployed to **us-west2**.

### Clerk Webhooks

| Environment | URL |
|-------------|-----|
| Dev | `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/clerkWebhook` |
| Prod | `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/clerkWebhook` |

**Events**: `user.created`, `user.updated`, `user.deleted`

### Stripe Webhooks

| Environment | URL |
|-------------|-----|
| Dev | `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/stripeWebhook` |
| Prod | `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/stripeWebhook` |

**Events**: `checkout.session.completed`

The canonical Stripe account is **"Cherrytree Technologies, LLC"** (`acct_1Si69sEbFwh64Boe`). Its test mode holds both endpoints today: `cherrytree-dev` → dev, `cherrytree-prod-dev` → prod. Because prod runs on test mode until launch, every test-card purchase on dev also reaches prod's webhook and creates a project there too. The account "Cherrytree, LLC" (`acct_1UHlbcH5jV6VeEcj`) and its sandbox are not used by any environment. Go-live steps are in `TODO.md`.

After configuring a webhook, set the signing secret:

```bash
firebase use dev  # or prod
echo "whsec_..." | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --force --data-file=-
firebase deploy --only functions
```

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
npm run dev                         # Run local dev server
npm run check                       # Everything CI checks, minus knip/audit/rules
npm run build                       # Production build → apps/web/dist

# Deployment
npm run deploy:dev                  # Deploy all to dev

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

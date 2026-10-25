# TODO

Outstanding tasks for the Cherrytree platform.

---

## Manual cleanup and next deploy (do once)

- [ ] **Prod IAM:** grant `roles/firebaseappcheck.tokenVerifier` to `cloud-functions@cherrytree-cofounder-agreement.iam.gserviceaccount.com` (command in `README.md` → Functions runtime service account). App Check is enforced on every callable, so without it every callable rejects with `app-check/permission-denied`. Already granted on dev.
- [ ] **Removed functions:** on dev, `npm run deploy:dev` asks to delete `submitSurvey`, `generatePreviewPDF`, `createOrganizationInvitation` and `removeOrganizationMember` — confirm. On prod, the workflow's `--force` deletes them (and `deleteAccount` and the unused Firestore indexes) automatically.
- [ ] Delete the `MAKE_WEBHOOK_URL` secret on dev and prod: `firebase functions:secrets:destroy MAKE_WEBHOOK_URL --project <id>`.
- [ ] Clerk webhook endpoints (dev and prod): unsubscribe `organization.created`, `organizationMembership.created` and `organizationMembership.deleted`; only `user.*` events are handled.
- [ ] Delete the unused Google Maps key: GitHub secrets `DEV_GOOGLE_MAPS_API_KEY` / `PROD_GOOGLE_MAPS_API_KEY` and the key itself in Google Cloud.
- [ ] Delete the existing project documents on dev and prod: they predate `members` (old `admin`/`collaborators`/survey shape), so the rules deny them and the schema rejects them.
- [x] Local files (git-ignored): delete `apps/functions/.env` (only a stale comment); remove the `VITE_GOOGLE_MAPS_API_KEY` lines from `apps/web/.env.dev` and `apps/web/.env.production`.

### Not yet smoke-tested on dev

- [ ] Signed-out visit to a protected route on a real session (`ProtectedRoute` → `RedirectToSignIn`, Clerk 6)

---

## Before Launch

### Stripe go-live (prod is on test mode today)

The canonical account is "Cherrytree Technologies, LLC" (`acct_1Si69sEbFwh64Boe`). Its **test-mode** endpoint `cherrytree-prod-dev` points at prod's `stripeWebhook`, so every test-card purchase on dev also creates a project + Clerk org in prod. To go live:

1. Live mode → Developers → Webhooks → add an endpoint for prod's `stripeWebhook` with `checkout.session.completed`
2. `firebase functions:secrets:set STRIPE_SECRET_KEY --project cherrytree-cofounder-agreement` (`sk_live_…`)
3. `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project cherrytree-cofounder-agreement` (that endpoint's `whsec_…`)
4. Fill the live price ids in `apps/functions/.env.cherrytree-cofounder-agreement` (Stripe → Product catalog)
5. Disable the test-mode `cherrytree-prod-dev` endpoint
6. Merge to `master` → the prod workflow redeploys functions

Optional: a `livemode`-mismatch guard in `stripeWebhook` so a test event can never reach a live-mode deployment (and vice versa). Consider deleting the unused account "Cherrytree, LLC" (`acct_1UHlbcH5jV6VeEcj`) and its sandbox.

### Lock down prod deployments

Anyone with Firebase CLI auth can run `firebase deploy --project cherrytree-cofounder-agreement` and bypass CI. The `deploy:prod` npm scripts were removed as a deterrent, but the access remains:

1. Replace the service-account JSON keys in the `FIREBASE_SERVICE_ACCOUNT_PROD` / `_DEV` GitHub secrets with Workload Identity Federation: a workload identity pool and provider limited to this repo (and `master` for prod), `google-github-actions/auth` in the deploy workflows, then delete the keys in IAM and the GitHub secrets. The hosting step (`FirebaseExtended/action-hosting-deploy`) takes a key, so deploy hosting with `firebase deploy --only hosting` instead.
2. Google Cloud Console → IAM (prod project) → remove `Firebase Hosting Admin` and `Cloud Functions Admin` from personal accounts
3. Personal accounts keep full access to dev

### Prerender the marketing pages

Crawlers and link-preview bots that don't run JavaScript see `index.html`'s defaults (title, description, canonical, og:*) on every route; `usePageMeta` only fixes them for browsers. Prerender the public routes (`/`, `/pricing`, `/about`, `/contact`, `/attorney`, `/equity-calculator`, `/privacy`, `/terms`) to static HTML at build time so each serves its own meta tags and content.

---

## Hardening (few users today — deferred)

- `sendContactMessage` is unauthenticated and un-rate-limited (App Check only). Add rate limiting before marketing pushes traffic at it.
- `UserContext` has no error state when the Clerk → Firebase exchange fails: `loading` stays `true` forever (pinned by `UserContext.test.tsx`). Surface an error / retry.
- Dependency advisories left open on purpose (both `npm audit --audit-level=high` gates pass):
  - `@grpc/grpc-js` is forced to 1.14.6 by the root `overrides`: `@firebase/firestore` pins `~1.9`, which has two high server-side advisories (GHSA-m9gg-hp2v-232j, GHSA-f596-whhp-79r4) that don't affect a client. Only Node-side Firestore (the rules tests) loads it. **Remove the override once Firebase moves its pin past 1.13.5.**
  - `uuid@9` under `firebase-admin → @google-cloud/storage@8 → gaxios@6` (functions) — Cloud Storage is unused; not fixable without overriding a transitive pin.
- Major upgrades deferred (follow each migration guide; one per commit):
  - Web: `@sentry/react` 10 → 11, `@testing-library/jest-dom` 6 → 7.
  - Functions: `stripe` 19 → 23 (changes the pinned API version: re-test checkout and the webhook on dev, check the Stripe dashboard webhook version), `@clerk/backend` 2 → 3, `resend` 4 → 6, `svix` 1 → 2.
- Web bundle is one large chunk (Vite's >500 kB warning). Code-split the agent product routes when they land.

---

## Agent product

- [ ] Dashboard card progress is fixed at 0% (`PROJECT_PROGRESS_PERCENT`, `apps/web/src/pages/DashboardPage.tsx`). Derive it from the agent conversation.
- [ ] Pro upgrade entry point in the agent UI: a Starter → Pro upgrade with the Pro waitlist form (`ProWaitlistForm`, today only in `PaymentModal`).
- [ ] Marketing copy still describes the survey and inviting cofounders as collaborators (`LandingPage`, `PricingPage`, `constants/pricing.ts`). Rewrite for the agent product.

---

## High Priority

### BigQuery Integration

Set up Firestore to BigQuery export for analytics and reporting.

```bash
firebase ext:install firebase/firestore-bigquery-export --project=cherrytree-cofounder-agreement
```

This enables analytics dashboards, complex queries across projects, historical analysis and joins with other data sources.

---

## Future Enhancements

### Analytics Dashboard

Once BigQuery is set up: projects created per week/month, conversion (started → finalized), average completion time, plan breakdown, geography.

### E2E tests

Unit tests cover web, shared, functions and rules. Still missing: browser E2E for the critical flows (purchase, agent session, finalize).

### Performance Monitoring

- Set up Firebase Performance Monitoring
- Monitor Cloud Function cold start times

---

## Completed

- [x] TypeScript refactor (Sept 2026): Vite 8 + npm workspaces, shared package, functions bundled with esbuild, App Check enforced with limited-use tokens, Clerk → Firebase session exchange, Firestore rules tests, `@clerk/react` 6, `firebase-functions` 7 / `firebase-admin` 14, security audit fixes in both lockfiles, CI runs the full check
- [x] React 19.2.1 security update (CVE-2025-55182)
- [x] Firebase hosting and functions deployed to dev and prod
- [x] Clerk authentication integration
- [x] Stripe payment integration (test mode)
- [x] Firebase secrets configured for both environments
- [x] Webhook configuration for Clerk and Stripe

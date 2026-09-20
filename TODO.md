# TODO

Outstanding tasks for the Cherrytree Cofounder Agreement Platform.

---

## After the TypeScript refactor lands (both developers, once)

The September 2026 refactor moved the app to `web/` + `shared/` + `functions/src/` (all TypeScript, Vite, npm workspaces). On your next pull:

1. `nvm install 22 && nvm use` (tooling needs ≥ 22.22)
2. Move/rename local env files: `.env.development` → `web/.env.dev`, `.env.production` → `web/.env.production`, and rename every key `REACT_APP_*` → `VITE_*` (values unchanged; the full key list is `web/.env.example`)
3. `npm ci && npm --prefix functions ci` (functions now needs its devDependencies — esbuild — for the deploy-time build)
4. Commands changed: `npm run dev` (was `npm start`); run `npm run check` before pushing
5. **App Check debug token:** on the first `npm run dev` the browser console prints `App Check debug token: …`; register it in the **dev** Firebase console → App Check → Apps → web app → Manage debug tokens (once per browser profile). Until then every callable returns `unauthenticated` on localhost.
6. `npm run test:rules` (Firestore rules under the emulator) needs Java 21+
7. GitHub repo settings → secrets: `DEV_/PROD_MARKETING_URL`, `DEV_/PROD_STRIPE_PUBLISHABLE_KEY`, `DEV_/PROD_STRIPE_STARTER_PRICE_ID`, `DEV_/PROD_STRIPE_PRO_PRICE_ID` are no longer read and can be deleted (harmless if left)

---

## Before the next prod deploy

- [ ] **Prod IAM:** grant `roles/firebaseappcheck.tokenVerifier` to `cloud-functions@cherrytree-cofounder-agreement.iam.gserviceaccount.com` (command in `README.md` → Functions runtime service account). App Check is enforced on every callable, so without it every callable rejects with `app-check/permission-denied`. Already granted on dev.
- [ ] **Prod params:** `functions/.env.cherrytree-cofounder-agreement` still has placeholder Stripe price ids. Fill them before the deploy or checkout fails on prod: while prod stays on Stripe test mode, use the ids that were `VITE_STRIPE_STARTER_PRICE_ID` / `VITE_STRIPE_PRO_PRICE_ID` in the old prod `.env.production`; switch to the live ids at go-live.
- [ ] The prod workflow deploys with `--force`, which deletes the retired `deleteAccount` function on the first run — expected.

### Not yet smoke-tested on dev after the refactor

- [ ] Preview PDF for a project whose name contains `&` (dev has "Smith & Jones Co", `projects/org_3JXLRx9weaLVy1A7EUc59WTnj3L`): must render `&`, not `&amp;`. If Make.com treats the field as plain text, drop `escapeHtml` in `buildPdfPayload` (`functions/src/pdf.ts`).
- [ ] Invite + remove a collaborator (`createOrganizationInvitation` / `removeOrganizationMember` against real Clerk after the role/redirect change), accept-invite while already signed in, and Review & Approve after removing a collaborator
- [ ] Signed-out visit to a protected route on a real session (`ProtectedRoute` → `RedirectToSignIn`, Clerk 6)

---

## Before Launch

### Stripe go-live (prod is on test mode today)

The canonical account is "Cherrytree Technologies, LLC" (`acct_1Si69sEbFwh64Boe`). Its **test-mode** endpoint `cherrytree-prod-dev` points at prod's `stripeWebhook`, so every test-card purchase on dev also creates a project + Clerk org in prod. To go live:

1. Live mode → Developers → Webhooks → add an endpoint for prod's `stripeWebhook` with `checkout.session.completed`
2. `firebase functions:secrets:set STRIPE_SECRET_KEY --project cherrytree-cofounder-agreement` (`sk_live_…`)
3. `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project cherrytree-cofounder-agreement` (that endpoint's `whsec_…`)
4. Fill the live price ids in `functions/.env.cherrytree-cofounder-agreement` (Stripe → Product catalog)
5. Disable the test-mode `cherrytree-prod-dev` endpoint
6. Merge to `master` → the prod workflow redeploys functions

Optional: a `livemode`-mismatch guard in `stripeWebhook` so a test event can never reach a live-mode deployment (and vice versa). Consider deleting the unused account "Cherrytree, LLC" (`acct_1UHlbcH5jV6VeEcj`) and its sandbox.

### Lock down prod deployments

Anyone with Firebase CLI auth can run `firebase deploy --project cherrytree-cofounder-agreement` and bypass CI. The `deploy:prod` npm scripts were removed as a deterrent, but the access remains:

1. Keep the deploy-only service account key in the `FIREBASE_SERVICE_ACCOUNT_PROD` GitHub secret (already done)
2. Google Cloud Console → IAM (prod project) → remove `Firebase Hosting Admin` and `Cloud Functions Admin` from developer accounts
3. Developers keep full access to dev

### Edit window production testing

- [ ] Purchase a project via Stripe checkout
- [ ] Verify `editDeadline` is set correctly in Firestore (6 months from now)
- [ ] Verify editing works within the window
- [ ] Manually set a project's `editDeadline` to the past in Firestore
- [ ] Verify that project becomes read-only and collaborator management is blocked
- [ ] Verify legacy projects (without `editDeadline`) still work

---

## Hardening (few users today — deferred)

- `sendContactMessage` is unauthenticated and un-rate-limited (App Check only). Add rate limiting before marketing pushes traffic at it.
- `UserContext` has no error state when the Clerk → Firebase exchange fails: `loading` stays `true` forever (pinned by `UserContext.test.tsx`). Surface an error / retry.
- Dependency advisories left open on purpose (both `npm audit --audit-level=high` gates pass):
  - `react-router-dom` 6.30.6 — two moderates fixed only in 7.17.1+ (backslash open redirect in `<Link>`/`navigate()`; SSR `deserializeErrors`). Unreachable: every `navigate()` target has a literal path prefix, no dynamic `<Link to>`, no SSR. **Revisit if a redirect ever takes a user-supplied path.**
  - `uuid@9` under `firebase-admin → @google-cloud/storage@8 → gaxios@6` (functions) — Cloud Storage is unused; not fixable without overriding a transitive pin.
- Not upgraded in the refactor: Tailwind 4, React Router 7, `stripe`, `resend`, `@sentry/react` majors. Do a screenshot sweep (10 public routes × desktop/tablet/mobile) with the Tailwind bump.
- Web bundle is one 1.5 MB chunk (451 kB gzip; Vite's >500 kB warning). Code-split the survey/preview routes when it matters.

---

## High Priority

### BigQuery Integration

Set up Firestore to BigQuery export for analytics and reporting.

```bash
firebase ext:install firebase/firestore-bigquery-export --project=cherrytree-cofounder-agreement
```

This enables analytics dashboards, complex queries across projects, historical analysis and joins with other data sources.

---

## Medium Priority

### PDF Storage & ID Tracking

Currently PDFs are stored in Google Drive via Make.com and we only store the URL in `pdfAgreements`.

**Add PDF ID to pdfAgreements:**

- Extract Google Drive file ID from URL (format: `/file/d/FILE_ID/` or `?id=FILE_ID`)
- Store `id` field alongside `url`, `generatedAt`, `generatedBy` in each pdfAgreement entry
- Useful for tracking/referencing specific PDFs without relying on full URL

**Consider migrating PDF storage to Firebase Storage / Google Cloud Storage:**

- Pros: Full control, native to Firebase, better security rules, no external dependency on Make.com's Drive
- Cons: Need to update Make.com integration, slightly less convenient for manual browsing
- Cost is negligible (~$0.026/GB/month, free tier covers ~10,000 PDFs)
- Google Drive URLs are ID-based so moving folders won't break links, but moving to different storage would

---

## Survey (slated for replacement — do not refactor or add tests)

Known quirks left as-is, documented inline where they live:

- 4 `react-hooks/set-state-in-effect` warnings (Preview ×2, Survey, SurveyNavigation) — the only lint warnings in the repo
- Completion rules diverge between `useValidation.isSectionCompleted` and `progressCalculation.countCompletedSections`; `firstUnanswered` and `isAckAnswered` disagree on an empty acknowledgment map; `accelerationProtectionMonths` is required by the UI but by no completion rule
- `FIELDS.compensations` shape vs what the code stores; `finalEquityPercentages` declared but never written; `SURVEY_FIELDS.hasOther`/`otherField`/`options` metadata not consumed
- Client (`getSortedCollaboratorIds`, keyed on `isActive`) and server (`isActiveCollaborator`, keyed on the open `history` entry) define "active collaborator" differently — the Clerk webhook sets both together, so they agree today; unify in the rebuild
- Every section repeats the same expand/advance/collapse state machine; Survey and Preview inline the same fixed header — extract when rebuilding
- `EquityCalculatorPage`'s single-click effect never worked (react-spreadsheet needs a second mousedown); `AboutPage` "Apply here." is plain text (content owner)

---

## Future Enhancements

### Analytics Dashboard

Once BigQuery is set up: projects created per week/month, conversion (started → completed), average completion time, plan breakdown, geography.

### E2E tests

Unit tests cover web, shared, functions and rules (629 + 14). Still missing: browser E2E for the critical flows (purchase, survey completion, PDF generation).

### Performance Monitoring

- Set up Firebase Performance Monitoring
- Add custom traces for PDF generation time
- Monitor Cloud Function cold start times

---

## Completed

- [x] TypeScript refactor (Sept 2026): Vite 8 + npm workspaces, `shared/` package, functions bundled with esbuild, App Check enforced with limited-use tokens, Clerk → Firebase session exchange, server-side `submitSurvey` approval check, Firestore rules tests, `@clerk/react` 6, `firebase-functions` 7 / `firebase-admin` 14, security audit fixes in both lockfiles, CI runs the full check
- [x] React 19.2.1 security update (CVE-2025-55182)
- [x] Firebase hosting and functions deployed to dev and prod
- [x] Clerk authentication integration
- [x] Stripe payment integration (test mode)
- [x] Google Maps Places API integration
- [x] Real-time collaboration with Clerk organizations
- [x] PDF generation via Make.com
- [x] Edit window feature (6-month deadline)
- [x] Firebase secrets configured for both environments
- [x] Webhook configuration for Clerk and Stripe

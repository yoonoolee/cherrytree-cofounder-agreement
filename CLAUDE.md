# cherrytree-cofounder-agreement — Claude Context

Cherrytree is a SaaS platform for startup cofounders to create legally sound cofounder agreements. This repo is the only deployed product: a React web app plus Firebase Cloud Functions. (A Python chat agent used to sit beside it; it was retired in September 2026 and its replacement is still being designed outside this repo.)

## Architecture

```
User → React app (Firebase Hosting, web/dist)
         ├── Firestore — projects, users, proWaitlist (rules: firestore.rules)
         └── Cloud Functions v2 (Node 22, us-west2, functions/src) — callables + webhooks
               ├── Clerk (auth, organizations, invitations; webhook → users/)
               ├── Stripe (checkout; webhook → projects/)
               ├── Make.com (PDF generation → Google Drive URL)
               └── Resend (contact form email)
```

Everything is TypeScript. The repo is an npm workspace:

| Package | Path | Role |
|---------|------|------|
| `web` | `web/` | Vite 8 + React 19 app. `src/lib/` (Firebase init, typed callables, env), `src/hooks/`, `src/contexts/UserContext.tsx`, `src/components/`, `src/pages/`, `src/config/` (survey question/section display config), `src/utils/` |
| `@cherrytree/shared` | `shared/` | Types and pure logic used by both sides: Firestore document types (`domain/`), the callable request/response contracts (`callables.ts`), survey schema/fields/sections (`survey/`), error codes, timestamp helpers |
| functions | `functions/` | **Not a workspace** — own `package.json` + lockfile (`npm --prefix functions ci`). `src/index.ts` re-exports one module per concern (`stripe.ts`, `clerkWebhook.ts`, `organizations.ts`, `pdf.ts`, `contact.ts`, `firebaseToken.ts`); `src/lib/` holds auth, App Check, validation, error helpers; `src/config.ts` holds secrets, params and trigger options. esbuild bundles `src/index.ts` (with `shared` inlined) into `lib/index.js` at deploy (`firebase.json` predeploy) |

Web imports `shared` as `@cherrytree/shared`; the `@/` alias points at `web/src`.

## Commands (run from the repo root)

```bash
nvm use                    # Node 22 (.nvmrc)
npm ci && npm --prefix functions ci

npm run dev                # Vite on http://localhost:3000, mode "dev" → web/.env.dev
npm run check              # lint + prettier check + typecheck + tests + production build — run before every commit
npm run typecheck          # tsc per project (web app, web node, shared, functions)
npm test                   # Vitest: web (jsdom), shared, functions (node)
npm run test:rules         # Firestore rules tests under the emulator (needs Java 21+)
npm run knip               # unused files / exports / dependencies (functions excluded)
npm run lint:fix / format  # ESLint --fix / Prettier --write
npm --prefix functions run build   # esbuild bundle → functions/lib/index.js

npm run deploy:dev         # build:dev + firebase use dev + firebase deploy (functions, hosting, rules, indexes)
npm run deploy:functions:dev / deploy:hosting:dev
firebase use               # check the current project — must be dev before any local deploy
firebase functions:log     # runtime logs
```

Single test file: `cd web && npx vitest run src/…test.tsx` or `cd functions && npx vitest run src/pdf.test.ts`.

**Deploy functions and hosting together.** The web app sends limited-use App Check tokens and the functions consume them; a mismatched pair breaks every callable.

## Environments

| Env | Firebase project | URL | Deployed by |
|-----|-----------------|-----|-------------|
| Dev | `cherrytree-cofounder-agree-dev` | cherrytree-cofounder-agree-dev.web.app | `npm run deploy:dev` locally (the `deploy-dev` workflow is manual-only) |
| Prod | `cherrytree-cofounder-agreement` | cherrytree.app / my.cherrytree.app | **GitHub Actions only** — push/merge to `master` runs `npm run check` then deploys with `--force` |

Never deploy to prod locally: it bypasses CI and git history. Prod is still on Stripe **test mode** until launch (see `TODO.md` → Go-live).

## Configuration

| Where | What | Committed |
|-------|------|-----------|
| `web/.env.dev` / `web/.env.production` | `VITE_*` browser keys (Firebase config, Clerk publishable key, reCAPTCHA site key, Maps key, Sentry DSN). Template: `web/.env.example`; typed in `web/src/vite-env.d.ts`; read only through `web/src/lib/env.ts` | No (CI writes them from GitHub secrets) |
| `functions/.env.<projectId>` | Non-secret per-project params: `APP_ORIGIN`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID` (`defineString` in `functions/src/config.ts`) | Yes |
| Firebase Secret Manager | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `MAKE_WEBHOOK_URL`, `RESEND_API_KEY` (`defineSecret`; listed per function) | Never |

`firebase functions:secrets:set NAME` then redeploy functions. Never put a secret in an env file.

## Auth, App Check and trust boundaries

- **Sign-in:** Clerk. The web app exchanges its Clerk session token for a Firebase custom token via the `getFirebaseToken` callable and signs into Firebase Auth with it, so Firestore rules and every other callable identify the caller by `request.auth.uid` = Clerk user id. `functions/src/lib/auth.ts` verifies Clerk tokens with `@clerk/backend`.
- **App Check** is enforced on every callable (`enforceAppCheck` + `consumeAppCheckToken` in `functions/src/config.ts`, guarded by `functions/test/endpoints.test.ts` against `endpoints.golden.json`). Built bundles use reCAPTCHA v3; `npm run dev` uses a debug token printed to the browser console on first run — register it once per browser under the **dev** project → App Check → Apps → Manage debug tokens, or every callable returns `unauthenticated` on localhost.
- **Server-authoritative data.** Firestore rules let the browser update only `surveyData`, `lastUpdated`, `lastEditedBy`, `approvals`, `onboardingCompleted`, `lastOpened` on a project it belongs to, and read its own `users/` doc; everything else (project creation, membership, payments, `editDeadline`, PDFs, `stripeEvents`) is written by Cloud Functions with the Admin SDK. `submitSurvey` re-checks approvals server-side. Keep it that way: new client-writable fields go into `onlyClientFields()` in `firestore.rules` with a rules test.
- **Webhooks** (`stripeWebhook`, `clerkWebhook`) are `onRequest` with `cors: false` and verify signatures; Stripe events are deduplicated in `stripeEvents/{eventId}`.
- Functions run as the least-privilege service account `cloud-functions@<project>.iam.gserviceaccount.com` (roles: `datastore.user`, `firebaseauth.admin`, `iam.serviceAccountTokenCreator`, `serviceusage.serviceUsageConsumer`, `firebaseappcheck.tokenVerifier`). Prod still needs `firebaseappcheck.tokenVerifier` granted before its next deploy (`TODO.md`).

## Firestore data model

Types live in `shared/src/domain/`; the web reads/writes through the typed refs in `web/src/lib/firebase.ts`.

```
projects/{clerkOrgId}         Project — name, admin (Clerk user id), collaborators{uid → role, isActive, history[]},
                              approvals{uid → bool}, onboardingCompleted, surveyVersion, surveyData (Partial<SurveyData>),
                              pdfAgreements[], latestPdfUrl, currentPlan, payments{checkoutSessionId → Payment},
                              createdAt, editDeadline, lastUpdated, lastOpened, previewPdfUrl?
users/{clerkUserId}           UserDoc — userId, email, firstName, lastName, picture, createdAt, lastLoginAt, deleted,
                              stripeCustomerId?, deletedAt?   (written only by the Clerk webhook / checkout)
proWaitlist/{autoId}          ProWaitlistSignup — email, timestamp, source   (anonymous create only)
stripeEvents/{eventId}        webhook idempotency, server-only
```

`editDeadline` is set at purchase from `EDIT_WINDOW_CONFIG` (6 months, `functions/src/config.ts`); collaborator changes are refused after it. Projects predating a field may lack it — reads stay defensive.

## Survey

Ten sections in `shared/src/survey/sections.ts` (formation, cofounders, equity-allocation, vesting, decision-making, ip, compensation, performance, non-competition, general-provisions); each has a `web/src/components/Section*.tsx`, question metadata in `web/src/config/questionConfig.ts`, display config in `sectionConfig.ts`, completion rules in `web/src/hooks/useValidation.ts`. **The survey UI is slated for replacement** — keep changes there minimal, do not add survey tests or refactors, and leave its known quirks alone (they are documented inline). Keep the data model, functions, rules and the marketing/dashboard pages solid.

## Conventions

- `npm run check` must pass before every commit (CI runs it plus knip, `npm audit --audit-level=high` in both roots, and the rules tests on every PR).
- One concern per commit; message prefix by area (`Web:`, `Functions:`, `Shared:`, `CI:`, `Docs:`). No AI attribution lines.
- TypeScript strict; `.ts` extensions in relative imports (`allowImportingTsExtensions`); no new JS files. ESLint 10 flat config (`eslint.config.js`) with `typescript-eslint`, react-hooks (compiler rules), react-refresh; Prettier `singleQuote`, `printWidth: 100`. Formatting-only commits go in `.git-blame-ignore-revs`.
- Tests sit beside the code as `*.test.ts(x)`; functions tests mock the Admin SDK (`functions/test/helpers/`), rules tests use `@firebase/rules-unit-testing`. Bugs found while touching code get a fix commit with a test guarding the corrected behavior.
- Dedupe into `shared/` or a helper rather than patching per file.
- Exact-pinned web dependencies (`web/package.json`); bump deliberately, one per commit.

## Code Standards (Apply to Every Task)

**No hardcoded local paths:** Never hardcode user-specific paths in any committed file — commands, configs, or docs. Always use relative paths or project-root-relative paths so everything works for any teammate on any machine.

**No duplicate work:** Before suggesting or creating anything (commands, files, functions, configs), check if it already exists. If something exists but the user can't find it, help them locate or access it — don't recreate it.

**Best practices:** Always flag if something deviates from best practices — naming conventions, code structure, anti-patterns, performance issues, or anything that would be considered poor engineering. Don't just complete the task silently; call it out and suggest the better approach.

**Security:** On every task, do a quick security check on any code touched — exposed secrets, injection vulnerabilities (NoSQL/SQL/XSS), unauthenticated endpoints, insecure Firestore rules, CORS misconfiguration, hardcoded credentials. Flag anything suspicious even if outside the immediate scope of the change.

**Security-first implementation:** Ask who controls the data, whether it can be tampered with, and whether the server should be the source of truth. The correct architecture here is server-authoritative — don't suggest client-side shortcuts that trade security for convenience.

## Team Collaboration

Two people actively pushing to this repo. When working with Claude:

- **Always confirm the Firebase environment** before deploying — `firebase use` to check current target. Default to dev unless explicitly deploying to prod.
- **Don't assume solo context** — changes may affect the other developer. Flag anything that would break shared state (Firestore schema changes, Cloud Function renames, config changes, `functions/.env.<projectId>` params).
- **Coordinate on secrets** — both devs need matching `web/.env.dev` / `web/.env.production` files locally. These are gitignored; share keys out-of-band.
- **`.claude/settings.json` is committed** — changes to Claude permissions/commands apply to both teammates. Don't add personal preferences here; use `settings.local.json` (gitignored) for those.
- **`.claude/commands/` is committed** — shared slash commands available to both teammates.

## See Also

- `README.md` — setup, deployment, webhooks, external services
- `TODO.md` — open items, go-live checklist

# cherrytree-cofounder-agreement — Claude Context

Cherrytree is a SaaS platform where startup cofounders create a cofounder agreement with AI agents (Advisor, Drafting, Review, Editing). This repo is the whole product: the web app (marketing pages + dashboard), the Firebase Cloud Functions, the shared schemas, and the planned Python agent service. Cherrytree is not live; one engineer works on it.

The agent product is designed but not built. Its design lives outside the repo, linked from `ARCHITECTURE.md` (Notion Working Doc + FigJam diagram). Read it before working on anything agent-related.

## Architecture

```
User → React app (Firebase Hosting, apps/web/dist)
         ├── Firestore — projects, users, proWaitlist (rules: firestore.rules)
         ├── Cloud Functions v2 (Node 24, us-west2, apps/functions/src) — callables + webhooks
         │     ├── Clerk (auth, one organization per project; webhook → users/)
         │     ├── Stripe (checkout; webhook → projects/)
         │     └── Resend (contact form email)
         └── Agent service (planned: Python, FastAPI on Cloud Run, apps/agent)
```

| Package | Path | Role |
|---------|------|------|
| `@cherrytree/web` | `apps/web/` | Vite 8 + React 19 + Tailwind CSS 4 (`@tailwindcss/vite`; theme and base styles in `src/index.css`, no Tailwind/PostCSS config files). `src/lib/` (Firebase init, validated collection refs, typed callables, env), `src/hooks/`, `src/contexts/UserContext.tsx`, `src/components/`, `src/pages/`, `src/utils/` |
| functions | `apps/functions/` | **Not a workspace** — own `package.json` + lockfile (`npm --prefix apps/functions ci`). `src/index.ts` re-exports one module per concern (`stripe.ts`, `clerkWebhook.ts`, `contact.ts`, `firebaseToken.ts`); `src/lib/` holds auth, App Check, validation, error helpers; `src/config.ts` holds secrets, params and trigger options. `esbuild.config.ts` (run by Node's built-in type stripping) bundles `src/index.ts` (with `packages/shared` inlined, runtime deps external) into the CommonJS `lib/index.cjs` at deploy (`firebase.json` predeploy) |
| agent | `apps/agent/` | Reserved for the Python agent service |
| `@cherrytree/shared` | `packages/shared/` | Zod schemas and inferred types for the Firestore documents (`domain/`), the callable request/response contracts (`callables.ts`), error and timestamp helpers. Planned: generate the agent service's Pydantic models from these schemas via JSON Schema (not set up yet) |

Web imports `packages/shared` as `@cherrytree/shared`; the `@/` alias points at `apps/web/src`.

## Commands (run from the repo root)

```bash
nvm use                    # Node 24 (.nvmrc)
npm ci && npm --prefix apps/functions ci

npm run dev                # Vite on http://localhost:3000, mode "dev" → apps/web/.env.dev
npm run check              # lint + prettier check + typecheck + tests + production build — run before every commit
npm run typecheck          # tsc per project (web app, web node, shared, functions)
npm test                   # Vitest: apps/web (jsdom), packages/shared, apps/functions (node)
npm run test:rules         # Firestore rules tests under the emulator (needs Java 21+)
npm run knip               # unused files / exports / dependencies (functions excluded)
npm run lint:fix / format  # ESLint --fix / Prettier --write
npm --prefix apps/functions run build   # esbuild bundle → apps/functions/lib/index.cjs

npm run deploy:dev         # build:dev + firebase use dev + firebase deploy (functions, hosting, rules, indexes)
npm run deploy:functions:dev / deploy:hosting:dev
firebase use               # check the current project — must be dev before any local deploy
firebase functions:log     # runtime logs
```

Single test file: `cd apps/web && npx vitest run src/…test.tsx` or `cd apps/functions && npx vitest run src/stripe.test.ts`.

**Deploy functions and hosting together.** The web app sends limited-use App Check tokens and the functions consume them; a mismatched pair breaks every callable.

## Environments

| Env | Firebase project | URL | Deployed by |
|-----|-----------------|-----|-------------|
| Dev | `cherrytree-cofounder-agree-dev` | cherrytree-cofounder-agree-dev.web.app | `npm run deploy:dev` locally (the `deploy-dev` workflow is manual-only) |
| Prod | `cherrytree-cofounder-agreement` | cherrytree.app / my.cherrytree.app | **GitHub Actions only** — push/merge to `master` runs the full CI job (`ci.yml`) then deploys with `--force` |

Default to dev; confirm with `firebase use` before any deploy. Never deploy to prod locally: it bypasses CI and git history. Prod is still on Stripe **test mode** until launch (see `TODO.md` → Before Launch).

## Configuration

| Where | What | Committed |
|-------|------|-----------|
| `apps/web/.env.dev` / `apps/web/.env.production` | `VITE_*` browser keys (Firebase config, Clerk publishable key, reCAPTCHA site key, Sentry DSN). Template: `apps/web/.env.example`; typed in `apps/web/src/vite-env.d.ts`; read only through `apps/web/src/lib/env.ts` | No (CI writes them from GitHub secrets) |
| `apps/functions/.env.<projectId>` | Non-secret per-project params: `APP_ORIGIN`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID` (`defineString` in `apps/functions/src/config.ts`) | Yes |
| Firebase Secret Manager | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `RESEND_API_KEY` (`defineSecret`; listed per function) | Never |

`firebase functions:secrets:set NAME` then redeploy functions. Never put a secret in an env file.

## Auth, App Check and trust boundaries

- **Sign-in:** Clerk. The web app exchanges its Clerk session token for a Firebase custom token via the `getFirebaseToken` callable and signs into Firebase Auth with it, so Firestore rules and every callable identify the caller by `request.auth.uid` = Clerk user id. `apps/functions/src/lib/auth.ts` verifies Clerk tokens with `@clerk/backend`.
- **App Check** is enforced on every callable (`enforceAppCheck` + `consumeAppCheckToken` in `apps/functions/src/config.ts`, guarded by `apps/functions/test/endpoints.test.ts` against `endpoints.golden.json`). Built bundles use reCAPTCHA v3; `npm run dev` uses a debug token printed to the browser console on first run — register it once per browser under the **dev** project → App Check → Apps → Manage debug tokens, or every callable returns `unauthenticated` on localhost.
- **Server-authoritative data.** Firestore rules let a project member read the project and update only `lastOpened` and `onboardingCompleted`; a user reads only their own `users/` doc. Everything else (project creation, members, payments, plan) is written by Cloud Functions with the Admin SDK, and agent data will be written by the agent service. Keep it that way: a new client-writable field goes into `onlyClientFields()` in `firestore.rules` with a rules test.
- **Webhooks** (`stripeWebhook`, `clerkWebhook`) are `onRequest` with `cors: false` and verify signatures; Stripe events are deduplicated in `stripeEvents/{eventId}`.
- Functions run as the least-privilege service account `cloud-functions@<project>.iam.gserviceaccount.com` (roles: `datastore.user`, `firebaseauth.admin`, `iam.serviceAccountTokenCreator`, `serviceusage.serviceUsageConsumer`, `firebaseappcheck.tokenVerifier`). Prod still needs `firebaseappcheck.tokenVerifier` granted before its next deploy (`TODO.md`).

## Firestore data model

Zod schemas in `packages/shared/src/domain/` are the source of truth; TypeScript types are inferred from them. Both the web (`apps/web/src/lib/firestore.ts`) and the functions (`apps/functions/src/lib/firebase.ts`) validate every document they read against its schema.

```
projects/{clerkOrgId}         Project — name, members{uid → {role}}, onboardingCompleted{uid → bool},
                              currentPlan, payments{checkoutSessionId → Payment}, createdAt, lastUpdated, lastOpened
users/{clerkUserId}           UserDoc — userId, email, firstName, lastName, picture, createdAt, lastLoginAt, deleted,
                              stripeCustomerId?, deletedAt?   (written only by the Clerk webhook / checkout)
proWaitlist/{autoId}          ProWaitlistSignup — email, timestamp, source   (anonymous create only)
stripeEvents/{eventId}        webhook idempotency, server-only
```

- **Members:** one map per project, keyed by Clerk user id, each with a `role`. v1: exactly one member, the purchaser, with role `admin` (talks to the agents, edits, finalizes), written by `stripeWebhook` at creation; there is no way to add members. Adding members or roles later is a new entry or a new `memberRoleSchema` value, not a schema change.
- **Plans:** Starter and Pro both unlock the agent product.
- The dashboard lists projects through the user's Clerk organization memberships (client `list` on `projects` is denied) and opens `/projects/:projectId`, a placeholder until the agent product UI is built.

## Conventions

- `npm run check` must pass before every commit (CI runs it plus knip, `npm audit --audit-level=high` in both roots, and the rules tests on every PR and before every deploy).
- One concern per commit; message prefix by area (`Web:`, `Functions:`, `Shared:`, `CI:`, `Docs:`). No AI attribution lines.
- TypeScript strict; `.ts` extensions in relative imports (`allowImportingTsExtensions`); no JS files (configs included). ESLint 10 flat config (`eslint.config.ts`, loaded through `jiti`) with `typescript-eslint`, react-hooks (compiler rules), react-refresh; Prettier `singleQuote`, `printWidth: 100`. Formatting-only commits go in `.git-blame-ignore-revs`.
- Tests sit beside the code as `*.test.ts(x)`; functions tests mock the Admin SDK (`apps/functions/test/helpers/`), rules tests use `@firebase/rules-unit-testing`. Bugs found while touching code get a fix commit with a test guarding the corrected behavior.
- Dedupe into `packages/shared` or a helper rather than patching per file.
- Exact-pinned dependencies in `apps/web` and `packages/shared`; bump deliberately, one per commit. `zod` is pinned to the same version in `packages/shared` and `apps/functions` (the functions bundle loads it at runtime).

## Code Standards (Apply to Every Task)

**No hardcoded local paths:** Never hardcode user-specific paths in any committed file — commands, configs, or docs. Always use relative paths or project-root-relative paths.

**No duplicate work:** Before suggesting or creating anything (commands, files, functions, configs), check if it already exists. If something exists but can't be found, help locate it — don't recreate it.

**Best practices:** Always flag if something deviates from best practices — naming conventions, code structure, anti-patterns, performance issues, or anything that would be considered poor engineering. Don't just complete the task silently; call it out and suggest the better approach.

**Security:** On every task, do a quick security check on any code touched — exposed secrets, injection vulnerabilities (NoSQL/SQL/XSS), unauthenticated endpoints, insecure Firestore rules, CORS misconfiguration, hardcoded credentials. Flag anything suspicious even if outside the immediate scope of the change.

**Security-first implementation:** Ask who controls the data, whether it can be tampered with, and whether the server should be the source of truth. The correct architecture here is server-authoritative — don't suggest client-side shortcuts that trade security for convenience.

## See Also

- `ARCHITECTURE.md` — links to the agent design (Notion Working Doc, FigJam diagram)
- `README.md` — setup, deployment, webhooks, external services
- `TODO.md` — open items, go-live checklist

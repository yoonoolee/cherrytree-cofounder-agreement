# TypeScript Refactor — Tracker

Temporary file for the JS → TS refactor. Deleted in Phase 9. Full design lives in the Claude plan; this file is the resume point.

## Status

- Phase: 0 (baseline) — complete
- Step: —
- Last green commit: (set after commit)
- Next action: Phase 1, step 1 — pure `git mv` of `src`, `public`, `postcss.config.js`, `tailwind.config.js` into `web/`
- Blocked on: user "continue"

## How to resume (start of every session)

```
git status --short                      # must be empty
git branch --show-current               # refactor/ts-monorepo
sed -n '/## Status/,/## How to resume/p' docs/REFACTOR_PLAN.md
nvm use && npm ci && npm --prefix functions ci
npm run check                           # must be green (from Phase 1 on)
```

Rules: hard stop at every `⏸` checkpoint and wait for the user's "continue". One concern per commit, every commit green, no Claude attribution in commit messages. Merge `origin/master` locally at the start of every phase. Never push this branch. Mid-step stop → `wip:` commit noted here, squashed by the next session.

## Phases

- [x] **Phase 0 — Baseline** — branch `refactor/ts-monorepo` off `origin/master` (`d12eb6c`); `.nvmrc`; baseline CRA build clean with 0 ESLint warnings (`.refactor-baseline/cra-build.log`); `__endpoint` golden for the 10 functions (`.refactor-baseline/endpoints.golden.json`, generated with `GCLOUD_PROJECT=test-project`); 30 baseline screenshots of the 10 public routes × desktop/tablet/mobile (`.refactor-baseline/screenshots/`). ⏸
- [ ] **Phase 1 — Tooling skeleton (still JS)** — 1. pure move into `web/` + root/web/shared `package.json` + workspaces; 2. pure rename `.js`→`.jsx` (`index.js`→`main.jsx`); 3. Vite 8 + `index.html` + `vite.config.ts` (port 3000) + `VITE_` env rename + `web/.env.dev`/`.env.production` + `lib/env.ts` + workflow heredocs + `firebase.json` hosting `web/dist`; verify dev, `build`, `build:dev`, no dev-bundle markers in dist; 4. ESLint 10 + Prettier, single format commit + `.git-blame-ignore-revs`; 5. Vitest 5 + RTL + jsdom + knip + root scripts + README quick-start. Full smoke. ⏸
- [ ] **Phase 2 — Dead code removal** — knip-verified deletes: `DynamicSection`, `DomainRedirect`, `AppRedirect`, `SectionOnboarding`, `utils/errorHandler`, `App.css`, `.Rhistory`, `.DS_Store`, client `mergeOtherFields`/`OTHER_FIELD_CONFIG`, server `crypto`/`defineString` imports, deps `web-vitals`, `env-cmd`, `react-scripts`, `firebase-functions-test`. ⏸
- [ ] **Phase 3 — Characterization tests (JS)** — pure-logic tests; pairwise-equivalence tests for duplicated logic; `useAutoSave` write-shape; callable request fixtures; `__endpoint` golden + export-set test; 3-layer Section harness for all 10 sections + `SurveyNavigation` with the prefix-fixture matrix. ⏸
- [ ] **Phase 4 — `shared` package + base tsconfig** — `tsconfig.base.json`; `shared/src/{survey,domain,callables.ts,time.ts}`; server `mergeOtherFields` survives; web + functions consume it from JS; `functions/esbuild.config.mjs`; `firebase.json` predeploy. ⏸
- [ ] **Phase 5 — Functions → TS** — 5a mechanical JS split + helper tests + golden green on bundle + emulator lists 10; 5b `.ts` conversion (`toErrorMessage`, `new Stripe` + pinned `apiVersion`, `logger`). Dev deploy only after user confirmation. ⏸
- [ ] **Phase 6 — Web → TS** — 6a non-component modules ⏸ · 6b leaf/mid components ⏸ · 6c Sections + SurveyNavigation ⏸ · 6d Survey/Preview/FinalAgreement ⏸ · 6e pages/App/main, drop `allowJs`, type-checked lint, `TODO(ts-migration)` → 0. ⏸
- [ ] **Phase 7 — Structural cleanup** — `SectionHeading`, `useSectionFlow`, `SurveySection` one section per commit (zero `.snap` changes); proven dedupes; `toDate`; `goToDashboard`; feature folders as a final pure move. `ProjectContext` deferred. ⏸
- [ ] **Phase 8 — Dependency modernization** — React 19.3; Router 6→7→8; firebase-functions 7 / admin 14 (regen golden, reviewed); Clerk/Sentry/firebase; Stripe 22 after `apiVersion` review; axios→fetch; TS bump if allowed; Tailwind 4 last/optional/screenshot-gated. ⏸
- [ ] **Phase 9 — Docs, CI, hand-off** — workflows; `CLAUDE.md`/`README`/`localhost.md`/`TODO.md`; delete this file and all intermediate artifacts; final smoke on dev; `git checkout avery && git merge --ff-only refactor/ts-monorepo`; user runs `/push`. ⏸

## Decisions log

- 2026-09-18 — TypeScript 6.0.x, not 7.0: `typescript-eslint` peer range is `<6.1.0`. Configs written TS-7-clean.
- 2026-09-18 — npm workspaces for `web` + `shared` only; `functions/` stays a standalone package (own lockfile) so `firebase deploy` keeps its deterministic `npm ci` path.
- 2026-09-18 — Functions bundled with esbuild directly (tsup is in maintenance mode), CommonJS output, `@cherrytree/shared` inlined via alias.
- 2026-09-18 — No zod in this refactor; existing validation ported verbatim. zod goes to the hardening phase.
- 2026-09-18 — Vite custom mode `dev` (`web/.env.dev`) so `vite build --mode dev` is a production bundle with dev keys, matching CRA's `build:dev`.
- 2026-09-18 — `__endpoint` golden covers memory/region/secrets/service account/trigger type. `invoker` and `consumeAppCheckToken` are not in the manifest in firebase-functions 6.x → guarded by a source-level test on the shared callable options constant.
- 2026-09-18 — `ProjectContext` (single listener) deferred: `useProjectSync` echo suppression is per-caller.
- 2026-09-18 — No `<StrictMode>`; Sentry `environment` semantics kept; missing env vars stay silently undefined (Clerk key still throws).

## Allowed non-behavioral deviations (user-confirmed once, applied everywhere)

- [ ] server `console.*` → `firebase-functions` `logger.*` with identical messages
- [ ] `Stripe(...)` → `new Stripe(...)` with an explicit `apiVersion` pinned to today's effective version
- [ ] removal of dead imports/files and unused dependencies
- [ ] Prettier formatting (single commit, in `.git-blame-ignore-revs`)

## Both developers must do (after this branch lands)

- `nvm install 22 && nvm use` (tooling needs ≥22.22)
- Move/rename local env files: `.env.development` → `web/.env.dev`, `.env.production` → `web/.env.production`, and rename every key `REACT_APP_*` → `VITE_*` (values unchanged)
- `npm ci && npm --prefix functions ci`
- Commands: `npm run dev` (was `npm start`), `npm run check` before pushing

## Found during refactor — recorded, NOT fixed (behavior must stay identical)

Security
- App Check not enforced: all callables set `consumeAppCheckToken: true` but not `enforceAppCheck: true` (`functions/index.js`, `functions/organizations.js`)
- `sendContactMessage` is unauthenticated and un-rate-limited (`functions/index.js`)
- Clerk session token is passed in the request body, not `Authorization`; Firebase `request.auth` never used server-side (`functions/auth-helpers.js`)
- Firestore `projects` update rule only protects `admin`; collaborators can overwrite `collaborators`, `payments`, `editDeadline`, `pdfAgreements`, `currentPlan` (`firestore.rules`)
- Firestore `projects` `list` rule has no field constraint (`firestore.rules`)
- Stripe webhook is not idempotent (retry → duplicate Clerk org + project) and returns 200 on inner failures (`functions/index.js` stripeWebhook)
- Clerk webhook verifies `JSON.stringify(req.body)` instead of `req.rawBody` (`functions/index.js` clerkWebhook)
- `createOrganizationInvitation` trusts the `Origin` header for `redirectUrl` and accepts `role` from the client (`functions/organizations.js`)
- `createCheckoutSession` accepts arbitrary `successUrl`/`cancelUrl`/`priceId`; `plan` not cross-checked with `priceId` (`functions/index.js`)
- `sanitizeInput` HTML-escapes at storage time (`Acme & Co` → `Acme &amp; Co` in Firestore/Clerk/Stripe) (`functions/index.js`)
- Contact-form submitter email logged (`functions/index.js`)
- `deleteAccount` transfers admin to a nondeterministic first collaborator without consent (`functions/index.js`)

Bugs / inconsistencies
- `CollaboratorManager` shows an error when `!project.id`, but `useProjectSync` never sets `id` (`src/components/CollaboratorManager.js:27`)
- `FIELDS` declares `compensations` as `userId/name/amount/frequency`; code uses `who`/`amount` (`src/config/surveySchema.js`, `src/components/SectionCompensation.js`)
- `lastOpened` written as a JS `Date` client-side vs `serverTimestamp()` server-side (`src/pages/SurveyPage.js:45`)
- `updatedAt` is read in `DashboardPage` but never written anywhere
- `deleteAccount` sets Clerk role `'admin'` while `organizations.js` checks `'org:admin'`
- `firstUnanswered` treats an empty acknowledgment map `{}` as answered (`every` on empty), while `isAckAnswered` treats it as unanswered (all `Section*` components)
- `mergeOtherFields` (server) mutates nested cofounder objects in place through a shallow copy (`functions/surveySchema.js`)
- `finalEquityPercentages` is declared in the schema but never written
- `CLAUDE.md` data model is stale: field is `surveyData` not `formData`; `users` has no `name`/`organizationIds`; there is no `organizations` collection; chat agent references are obsolete; `EquityCalculator.js`/`DynamicSection` references are wrong
- `TODO.md` ESLint-warnings list is stale (baseline build has 0 warnings)

## Intermediate artifacts to delete in Phase 9

- `.refactor-baseline/` (build log, endpoint golden source copy, screenshots) — local only, excluded via `.git/info/exclude`
- `.playwright-mcp/` (Playwright MCP snapshots) — local only, excluded via `.git/info/exclude`
- The `.git/info/exclude` entries themselves
- `docs/REFACTOR_PLAN.md` (this file)
- Local tags `refactor/p<N>-done`

# TypeScript Refactor — Tracker

Temporary file for the JS → TS refactor. Deleted in Phase 9. Full design lives in the Claude plan; this file is the resume point.

## Status

- Phase: 1 (tooling) — code complete, authenticated smoke test pending
- Step: smoke checklist items 2–7 with the user signed in (public routes already pixel-verified)
- Last green commit: 812d837
- Next action: after smoke passes → tag `refactor/p1-done`, then Phase 2 (dead code removal)
- Blocked on: user smoke test + "continue"

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
- [x] **Phase 1 — Tooling skeleton (still JS)** — commits a04005c (move), 4576e4f (.jsx), 856fa7d (Vite), 3309b27 (ESLint), b6d2ffd (Prettier), 36efb68, 812d837 (Vitest/knip/scripts). Public routes pixel-identical to baseline (28/30 exact; 2 animation frames). `npm run check` green. Originally: 1. pure move into `web/` + root/web/shared `package.json` + workspaces; 2. pure rename `.js`→`.jsx` (`index.js`→`main.jsx`); 3. Vite 8 + `index.html` + `vite.config.ts` (port 3000) + `VITE_` env rename + `web/.env.dev`/`.env.production` + `lib/env.ts` + workflow heredocs + `firebase.json` hosting `web/dist`; verify dev, `build`, `build:dev`, no dev-bundle markers in dist; 4. ESLint 10 + Prettier, single format commit + `.git-blame-ignore-revs`; 5. Vitest 5 + RTL + jsdom + knip + root scripts + README quick-start. Full smoke. ⏸
- [ ] **Phase 2 — Dead code removal** — knip-verified deletes: `DynamicSection`, `DomainRedirect`, `AppRedirect`, `SectionOnboarding`, `utils/errorHandler`, `App.css`, `.Rhistory`, `.DS_Store`, client `mergeOtherFields`/`OTHER_FIELD_CONFIG`, server `crypto`/`defineString` imports, deps `web-vitals`, `env-cmd`, `react-scripts`, `firebase-functions-test`. ⏸
- [ ] **Phase 3 — Characterization tests (JS)** — pure-logic tests; pairwise-equivalence tests for duplicated logic; `useAutoSave` write-shape; callable request fixtures; `__endpoint` golden + export-set test; 3-layer Section harness for all 10 sections + `SurveyNavigation` with the prefix-fixture matrix. ⏸
- [ ] **Phase 4 — `shared` package + base tsconfig** — `tsconfig.base.json`; `shared/src/{survey,domain,callables.ts,time.ts}`; server `mergeOtherFields` survives; web + functions consume it from JS; `functions/esbuild.config.mjs`; `firebase.json` predeploy. ⏸
- [ ] **Phase 5 — Functions → TS** — 5a mechanical JS split + helper tests + golden green on bundle + emulator lists 10; 5b `.ts` conversion (`toErrorMessage`, `new Stripe` + pinned `apiVersion`, `logger`). Dev deploy only after user confirmation. ⏸
- [ ] **Phase 6 — Web → TS** — 6a non-component modules ⏸ · 6b leaf/mid components ⏸ · 6c Sections + SurveyNavigation ⏸ · 6d Survey/Preview/FinalAgreement ⏸ · 6e pages/App/main, drop `allowJs`, type-checked lint, `TODO(ts-migration)` → 0. ⏸
- [ ] **Phase 7 — Structural cleanup** — `SectionHeading`, `useSectionFlow`, `SurveySection` one section per commit (zero `.snap` changes); proven dedupes; `toDate`; `goToDashboard`; feature folders as a final pure move. `ProjectContext` deferred. ⏸
- [ ] **Phase 8 — Dependency modernization** — React 19.3; Router 6→7→8; firebase-functions 7 / admin 14 (regen golden, reviewed); Clerk/Sentry/firebase; Stripe 22 after `apiVersion` review; axios→fetch; TS bump if allowed; Tailwind 4 last/optional/screenshot-gated. ⏸
- [ ] **Phase 9 — Docs, CI, hand-off** — workflows; `CLAUDE.md`/`README`/`localhost.md`/`TODO.md`; delete this file and all intermediate artifacts; final smoke on dev; `git checkout avery && git merge --ff-only refactor/ts-monorepo`; user runs `/push`. ⏸

## Decisions log

- 2026-09-18 — Phase 1: Prettier config `singleQuote: true, printWidth: 100`, `*.md` and `web/public` ignored. Format commit verified render-neutral (CSS byte-identical; JS diff = unquoted keys + JSX whitespace normalization; two double spaces in `TermsPage` collapsed to one, invisible under normal whitespace).
- 2026-09-18 — Phase 1: lint rules `no-unused-vars` (with `^_` ignore) and `no-case-declarations` downgraded to warn during migration; React-Compiler rules from react-hooks v7 as warn. Flip all to error in Phase 7. 46 warnings tracked.
- 2026-09-18 — Phase 1: `firebase` CLI stays a global install (knip `ignoreBinaries`), not a devDependency — keeps the team workflow unchanged.
- 2026-09-18 — Phase 1: `@testing-library/user-event` adopted at 14.x (no tests existed on 13.x); Vitest `globals: true`.
- 2026-09-18 — Phase 1: the dead `crypto` require was removed early (it shadowed Node's global and was the only lint error).
- 2026-09-18 — Phase 1: `@clerk/clerk-react` is deprecated upstream in favour of `@clerk/react` (Clerk Core 3) → Phase 8 item.

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

## Phase 7 lint follow-ups (from Phase 1 lint run)

- Flip `@typescript-eslint/no-unused-vars` and `no-case-declarations` back to `error`; fix `useValidation.js` `const`-in-`case` (add braces; verify no cross-case references first)
- Remove unused `eslint-disable` directive in `LandingPage.jsx`
- `react-refresh/only-export-components`: move `calculateSplit` (EquityCalculatorModal), `goToDashboard` (MarketingNav), `useUser` (UserContext) to non-component modules
- React-Compiler warnings (`set-state-in-effect` ×11, `immutability`, `static-components`) stay as warnings → hardening phase
- knip "unused exports" list (18) → prune in Phase 2/7 where the export is genuinely unused

## Intermediate artifacts to delete in Phase 9

- `.refactor-baseline/` (build log, endpoint golden source copy, screenshots) — local only, excluded via `.git/info/exclude`
- `.playwright-mcp/` (Playwright MCP snapshots) — local only, excluded via `.git/info/exclude`
- The `.git/info/exclude` entries themselves
- `docs/REFACTOR_PLAN.md` (this file)
- Local tags `refactor/p<N>-done`

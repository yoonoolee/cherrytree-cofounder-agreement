# TypeScript Refactor — Tracker

Temporary file for the JS → TS refactor. Deleted in Phase 8. Full design lives in the Claude plan; this file is the resume point.

## Status

- Phase: 4 (Cloud Functions → TypeScript) — **code complete, ⏸ checkpoint: awaiting dev deploy confirmation**
- Step: 6 (dev deploy + smoke, then tag `refactor/p4-done`)
- Last green commit: 07ba08c (rules); `npm run check` 0 errors / 36 warnings / 130 tests; `npm run test:rules` 13 tests; emulator lists 9
- Next action: user confirms → `firebase use` (must be dev) → `firebase deploy --only functions,firestore:rules` → register the App Check debug token (browser console → dev Firebase console) → smoke: login, invite/remove, preview PDF (project name with `&`), purchase (Stripe test card) → tag `refactor/p4-done` → Phase 5 in a fresh session
- Blocked on: user go-ahead for the dev deploy (and the "You need to" list in the checkpoint report)

## How to resume (start of every session)

```
git status --short                      # must be empty
git branch --show-current               # refactor/ts-monorepo
sed -n '/## Status/,/## How to resume/p' docs/REFACTOR_PLAN.md
nvm use && npm ci && npm --prefix functions ci
npm run check                           # must be green (from Phase 1 on; includes typecheck from Phase 3)
npm --prefix functions run build        # lib/index.js (esbuild) — what the emulator and deploy load
```

Rules: hard stop at every `⏸` checkpoint and wait for the user's "continue". **Every new file is TypeScript (`.ts`/`.tsx`; `.mjs` only for the esbuild script) — never add `.js`/`.jsx`.** Tests are written in TS as the first step of the phase they guard (before that phase's code is touched); there is no separate test phase. One concern per commit, every commit green, no Claude attribution in commit messages. **Bugs, security gaps, nonsense and poor practice found along the way are fixed, not preserved** (user, 2026-09-18): fix each in the phase that converts that module, as its own commit with a test guarding the *corrected* behavior; when it is unclear whether or how to fix, ask the user rather than guess. Merge `origin/master` locally at the start of every phase. Never push this branch. Mid-step stop → `wip:` commit noted here, squashed by the next session.

## Phases

- [x] **Phase 0 — Baseline** — branch `refactor/ts-monorepo` off `origin/master` (`d12eb6c`); `.nvmrc`; baseline CRA build clean with 0 ESLint warnings (`.refactor-baseline/cra-build.log`); `__endpoint` golden for the 10 functions (`.refactor-baseline/endpoints.golden.json`, generated with `GCLOUD_PROJECT=test-project`); 30 baseline screenshots of the 10 public routes × desktop/tablet/mobile (`.refactor-baseline/screenshots/`). ⏸
- [x] **Phase 1 — Tooling skeleton (still JS)** — commits a04005c (move), 4576e4f (.jsx), 856fa7d (Vite), 3309b27 (ESLint), b6d2ffd (Prettier), 36efb68, 812d837 (Vitest/knip/scripts). Public routes pixel-identical to baseline (28/30 exact; 2 animation frames). `npm run check` green. Originally: 1. pure move into `web/` + root/web/shared `package.json` + workspaces; 2. pure rename `.js`→`.jsx` (`index.js`→`main.jsx`); 3. Vite 8 + `index.html` + `vite.config.ts` (port 3000) + `VITE_` env rename + `web/.env.dev`/`.env.production` + `lib/env.ts` + workflow heredocs + `firebase.json` hosting `web/dist`; verify dev, `build`, `build:dev`, no dev-bundle markers in dist; 4. ESLint 10 + Prettier, single format commit + `.git-blame-ignore-revs`; 5. Vitest 5 + RTL + jsdom + knip + root scripts + README quick-start. Full smoke. ⏸
- [x] **Phase 2 — Dead code removal** — commit c33cf81; also removed unused config helpers, CRA default logos, un-exported internal helpers; `__endpoint` golden re-verified identical. Pre-existing bug fixed with user approval in bcf7b6a (nav Sign in → `/login`). Originally: knip-verified deletes: `DynamicSection`, `DomainRedirect`, `AppRedirect`, `SectionOnboarding`, `utils/errorHandler`, `App.css`, `.Rhistory`, `.DS_Store`, client `mergeOtherFields`/`OTHER_FIELD_CONFIG`, server `crypto`/`defineString` imports, deps `web-vitals`, `env-cmd`, `react-scripts`, `firebase-functions-test`. ⏸
- [x] **Phase 3 — TypeScript foundation + `shared` package** — commits 79fe47a (tsconfigs + `typecheck` gate), e7c6e06 (`@cherrytree/shared` + 16 TS tests + move verification), ef9bd95 (web/functions consume shared; esbuild bundle; emulator lists 10; golden identical), 7d873f3 (functions vitest project). `npm run check` green (0 errors / 40 warnings / 18 tests). Deviations from the original step list: web uses the create-vite layout (`tsconfig.json` solution → `tsconfig.app.json` + `tsconfig.node.json`) so `@types/node` stays out of browser code; `shared/tsconfig.json` landed with the package commit; ack lists live in `survey/acknowledgments.ts`. Originally: 1. `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `isolatedModules`, `moduleResolution: bundler`, ES2022, `skipLibCheck`; `exactOptionalPropertyTypes` off) + `web/tsconfig.json` (`allowJs: true, checkJs: false`, `@/*` alias mirrored in `vite.config.ts`, `vite-env.d.ts` with typed `ImportMetaEnv`) + `functions/tsconfig.json` (`paths` → `../shared/src`) + `shared/tsconfig.json`; root `typecheck` script in `check`. 2. `shared/` (`@cherrytree/shared`, source-exported, zero deps): `domain/` types, `time.ts`, `survey/`, `callables.ts`; tests in TS; one-off move verification. 3. Point web (workspace) and functions (esbuild alias) at shared; delete old copies; `functions/esbuild.config.mjs`, `main: lib/index.js`, `firebase.json` predeploy; temporary `functions/src/index.ts`. 4. Root vitest projects `web`, `shared`, `functions`. ⏸
- [~] **Phase 4 — Functions → TS** — code complete (commits 8647aa1 tests-first … 07ba08c rules; see Decisions log 2026-09-19); pending: dev deploy + smoke + tag. Layout: `src/config.ts` (options/secrets/params/constants), `src/lib/{firebase,auth,appOrigin,validation,dates,errors}.ts`, `src/{pdf,stripe,firebaseToken,contact,organizations,clerkWebhook}.ts`, `src/index.ts`; tests co-located + `test/endpoints.test.ts` + `test/rules/`. Originally: 1. Tests first: `functions/test/endpoints.test.ts` (export set; `__endpoint` deep-equals `functions/test/endpoints.golden.json` via `createRequire` with `GCLOUD_PROJECT=test-project`; guard that every `onCall` uses a shared `CALLABLE_OPTIONS` with `invoker: 'public'` + `enforceAppCheck: true` + `consumeAppCheckToken: true`). 2. Split `index.js` directly into `functions/src/*.ts` one module per commit (`config`, `lib/{firebase,auth,validation,dates,logger,errors}`, `pdf`, `stripe`, `firebaseToken`, `contact`, `organizations`, `clerkWebhook` one handler per event, `index` re-exports) — `deleteAccount` is deleted, not ported (golden → 9 functions); the Phase 4 fixes in the triage list land as their own commits as each module is converted (auth via `request.auth`, App Check enforced, webhook idempotency/rawBody, checkout + invitation inputs server-side, `sanitizeInput` at the output boundary, rules); validation otherwise verbatim; `toErrorMessage(unknown)`; `new Stripe` + pinned `apiVersion`; `logger`; helper tests as each helper is extracted. 3. Delete the old JS files. Gate + golden + emulator; dev deploy only after explicit confirmation → purchase/webhook and preview-PDF on dev. ⏸ (fresh session)
- [ ] **Phase 5 — Web → TS, leaf-first (rename + annotate in one commit; each module's test lands first)** — 5a non-component modules: `lib/firebase.ts` (cast-only `withConverter`), `lib/env.ts`, `lib/functions.ts` (`callFunction<K>`), `constants`, `utils` (tests: progressCalculation, equityCalculation, dateUtils, getPreview, collaboratorPositions), `config/questionConfig.ts` (discriminated union), `hooks` (tests: useValidation, useCollaborators, useAutoSave write-shape), `UserContext.tsx`, `Window` globals; fixtures in `web/src/test/fixtures/` typed with shared types ⏸ · 5b leaf/mid components + `calculateSplit` test ⏸ · 5c Sections + SurveyNavigation ⏸ · 5d Survey/Preview/FinalAgreement ⏸ · 5e pages/App/main, drop `allowJs`, type-checked lint, `TODO(ts-migration)` → 0, `no-explicit-any` → error. Full smoke. ⏸ (fresh session)
- [ ] **Phase 6 — Structural cleanup** — 1. Guards first: 3-layer Section harness for 10 sections + SurveyNavigation (props-contract recording snapshots; interaction tests; DOM snapshots + byte-identical `<h2 style>`/intro) with a programmatic fixture matrix; pairwise-equivalence tests for the duplicated completion rules / name helpers with known divergences pinned. 2. `SectionHeading`, `useSectionFlow`, `SurveySection`; one section per commit, zero `.snap` changes. 3. Proven dedupes; `toDate`; `goToDashboard`; lint rules back to error; react-refresh fixes; `exhaustive-deps` disables annotated. 4. Feature folders as a final pure move. `ProjectContext` deferred. ⏸
- [ ] **Phase 7 — Dependency modernization** — React 19.3; Router 6→7→8; firebase-functions 7 / admin 14 (regen golden, reviewed); `@clerk/react`, Sentry, firebase; Stripe 22 after `apiVersion` review; axios→fetch; TS bump if allowed; Tailwind 4 last/optional/screenshot-gated (user go/no-go). ⏸
- [ ] **Phase 8 — Docs, CI, hand-off** — workflows; `CLAUDE.md`/`README`/`localhost.md`/`TODO.md`; delete this file and all intermediate artifacts; final smoke on dev; `git checkout avery && git merge --ff-only refactor/ts-monorepo`; user runs `/push`. ⏸

## Decisions log

- 2026-09-19 — Phase 4: **golden contract changes** (deliberate, in `functions/test/endpoints.golden.json`): `deleteAccount` gone (9 functions); `submitSurvey`/`generatePreviewPDF` no longer bind `CLERK_SECRET_KEY` (they read `request.auth.uid` only — least privilege). `createCheckoutSession` keeps it: the customer email comes from Clerk (`getClerkPrimaryEmail`) rather than `request.auth.token.email`, so a Firebase Auth user created before the Clerk webhook existed still checks out.
- 2026-09-19 — Phase 4: **non-secret params** `APP_ORIGIN`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID` via `defineString` in committed `functions/.env.<projectId>` files (`.gitignore` un-ignores exactly those two). Price ids were already public in the client bundle. Prod file holds placeholders until someone with the live ids fills it (see "Both developers must do").
- 2026-09-19 — Phase 4: **redirect origins**: `resolveAppOrigin` honours the request `Origin` only when it equals `APP_ORIGIN` or `http://localhost:3000`, else falls back to `APP_ORIGIN`. Keeps the localhost → dev-functions workflow working without trusting the header.
- 2026-09-19 — Phase 4: **Stripe idempotency** = `stripeEvents/{eventId}` marker written after success + 500 on failure (Stripe retries). Not transactional: Stripe does not deliver one event concurrently, and a marker written *before* processing would swallow a retry after a crash. Known residual: a failure between Clerk org creation and the Firestore write leaves an orphan Clerk org on retry (logged).
- 2026-09-19 — Phase 4: **Clerk webhook** also returns 500 on handler failure (membership handlers used to swallow errors → silent missing collaborator). `emailVerified` now from `verification.status` (the old `.verified` field never existed → always false). Not in the original fix list; both are "nonsense → fix".
- 2026-09-19 — Phase 4: `sanitizeInput` → `normalizeProjectName` (NUL strip, trim, cap 100, min 2; stored raw) + `escapeHtml` only in the Make.com payload `projectName`. The old `javascript:`/`data:`/`on*=` stripping is dropped (meaningless once nothing is treated as HTML; the client still rejects those patterns). **Verify on dev** that Make.com renders `&` from `&amp;` — if it treats fields as plain text, drop the escape.
- 2026-09-19 — Phase 4: invitation email format check kept as the verbatim regex (not `isValidEmail`) to avoid a behavior change; Clerk validates for real. Clerk error messages no longer pass through to the client (`internal` + fixed message). Possible UX follow-up: map `ClerkAPIResponseError.errors[0].longMessage` (e.g. "already a member") to `already-exists`.
- 2026-09-19 — Phase 4: **rules** beyond the triage item (all tested): `users` write → false (no client writer; a user could rewrite their own `stripeCustomerId`); project access requires `collaborators[uid].isActive == true` (removed members kept read/write via their history entry); project `delete` → false (no client path); `proWaitlist` create constrained to `{email, timestamp, source}` with types/lengths; dead chat-agent rule removed. `stripeEvents` covered by deny-all.
- 2026-09-19 — Phase 4: `consumeAppCheckToken: true` kept (tracker decision) but it is only replay protection once the client sends limited-use tokens **and** handlers reject `request.app.alreadyConsumed`; today the SDK only flags it. → Phase 5a: `callFunction<K>` passes `{ limitedUseAppCheckTokens: true }`; then add the `alreadyConsumed` check to `requireAuth`. Until then it costs one App Check API call per request for nothing.
- 2026-09-19 — Phase 4: App Check on the dev server uses `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` (SDK-minted token, stored per browser profile, registered once in the dev console) — no token in env files or git.
- 2026-09-19 — Phase 4: no `lib/logger.ts`; modules import `logger` from `firebase-functions` directly (a re-export module added nothing). `functions/test/helpers/fakeFirestore.ts` is the in-memory collection used by handler tests; handler tests call `fn.run(request)` (callables) or `fn(req, res)` (webhooks) with `svix`/`stripe`/`@clerk/backend`/`resend`/`axios` mocked.
- 2026-09-19 — Phase 4: rules tests run only under `npm run test:rules` (`firebase emulators:exec --only firestore --project demo-cherrytree`); the root vitest config adds the `rules` project only when `FIRESTORE_EMULATOR_HOST` is set. Needs Java (present here, Java 25) and downloads the emulator jar on first run.

- 2026-09-18 — **Plan revised**: the standalone JS "characterization tests" phase was double work (write JS tests, then rename/retype). Now: TypeScript foundation first (Phase 3), every test written once in TS as the first step of the phase it guards, no new JS files ever. Phases renumbered 3–8.

- 2026-09-18 — Phase 3: web TS config uses the create-vite layout (`web/tsconfig.json` is a solution file referencing `tsconfig.app.json` for `src` and `tsconfig.node.json` for `vite.config.ts`/`vitest.config.ts`). Reason: mirroring the `@/*` alias in `vite.config.ts` needs `node:url`, and adding `@types/node` to the app project would leak `process`/`Buffer` and make `setTimeout` return `NodeJS.Timeout` in browser code.
- 2026-09-18 — Phase 3: `typecheck` runs `tsc -p` per project (web app, web node, shared, functions) rather than `tsc -b`; `*.tsbuildinfo` git-ignored in case someone runs `-b`.
- 2026-09-18 — Phase 3: `tsconfig.base.json` also carries TS 6.0's recommended `noUncheckedSideEffectImports`, `moduleDetection: force`, `allowImportingTsExtensions` (all projects are `noEmit`), and an explicit `lib: ["ES2023"]` so `shared`/`functions` never see DOM types (web adds `DOM`, `DOM.Iterable`).
- 2026-09-18 — Phase 3: `@types/node` pinned to the 22.x line at the root and in `functions` (matches the runtime; the transitive copy was 26.x). `@types/react`/`@types/react-dom` at 19.2.x to match React 19.2.3 (bump with React in Phase 7).
- 2026-09-18 — Phase 3: `ImportMetaEnv` declares the 18 `VITE_*` keys as `string` (Vite convention; a missing key is still `undefined` at runtime). Unknown keys resolve to `any` because Vite's own `ImportMetaEnv` has a string index signature — a typo in an env key is not a type error.
- 2026-09-18 — Phase 3: `shared` internal imports use explicit `.ts` extensions so the package also runs under plain Node (type stripping) for one-off scripts; consumers import the bare package name.
- 2026-09-18 — Phase 3: option lists are typed `readonly string[]`, not literal unions — stored survey values can be anything (merged "Other" text, older options), so `SurveyData` string fields are `string`.
- 2026-09-18 — Phase 3: `Project` fields written at creation by `stripeWebhook` are required, later-written fields optional, stored `surveyData` is `Partial<SurveyData>`. Reads stay defensive; loosen if legacy documents lacking creation fields turn up.
- 2026-09-18 — Phase 3: `mergeOtherFields` ported with `Array.isArray` guards and one shared helper for the identical top-level/nested branches. Only divergence (malformed data): an array-typed field holding a string that contains "Other" used to throw `TypeError` (→ `internal` HttpsError); it is now left untouched. Server `OTHER_FIELD_NAMES` not ported (unused). `SECTIONS` display copy initially moved with `sectionConfig.js` although only web reads it; **moved back** to `web/src/config/sectionConfig.ts` in 0599087 (presentation stays out of `shared`).
- 2026-09-18 — Phase 3: `CallableMap` covers all 8 `onCall` functions, including `deleteAccount` (no client caller today).
- 2026-09-18 — Phase 3 checkpoint review (user): (1) `SECTIONS` UI copy → web (done, 0599087); (2) keep `Project` creation-time fields required — nothing is in prod yet, no legacy documents to loosen for; (3) `mergeOtherFields` malformed-data divergence accepted as-is; (4) dropping server `OTHER_FIELD_NAMES` confirmed.
- 2026-09-18 — Phase 3: functions bundle: esbuild `external` = keys of `functions/package.json` `dependencies` (esbuild externalizes their subpaths too, verified: `firebase-functions/v2/https` etc. stay `require()`s); `@cherrytree/shared` inlined via `alias`; `absWorkingDir` so the build is cwd-independent. Firebase `predeploy` runs it; **CI must install functions devDependencies (`npm --prefix functions ci`) before `firebase deploy`** — Phase 8 workflow item.

- 2026-09-18 — Phase 1: Prettier config `singleQuote: true, printWidth: 100`, `*.md` and `web/public` ignored. Format commit verified render-neutral (CSS byte-identical; JS diff = unquoted keys + JSX whitespace normalization; two double spaces in `TermsPage` collapsed to one, invisible under normal whitespace).
- 2026-09-18 — Phase 1: lint rules `no-unused-vars` (with `^_` ignore) and `no-case-declarations` downgraded to warn during migration; React-Compiler rules from react-hooks v7 as warn. Flip all to error in Phase 6. 46 warnings tracked (40 after Phase 2).
- 2026-09-18 — Phase 1: `firebase` CLI stays a global install (knip `ignoreBinaries`), not a devDependency — keeps the team workflow unchanged.
- 2026-09-18 — Phase 1: `@testing-library/user-event` adopted at 14.x (no tests existed on 13.x); Vitest `globals: true`.
- 2026-09-18 — Phase 1: the dead `crypto` require was removed early (it shadowed Node's global and was the only lint error).
- 2026-09-18 — Phase 1: `@clerk/clerk-react` is deprecated upstream in favour of `@clerk/react` (Clerk Core 3) → Phase 7 item.

- 2026-09-18 — TypeScript 6.0.x, not 7.0: `typescript-eslint` peer range is `<6.1.0`. Configs written TS-7-clean.
- 2026-09-18 — npm workspaces for `web` + `shared` only; `functions/` stays a standalone package (own lockfile) so `firebase deploy` keeps its deterministic `npm ci` path.
- 2026-09-18 — Functions bundled with esbuild directly (tsup is in maintenance mode), CommonJS output, `@cherrytree/shared` inlined via alias.
- 2026-09-18 — No zod in this refactor; existing validation ported verbatim. zod goes to the hardening phase.
- 2026-09-18 — Vite custom mode `dev` (`web/.env.dev`) so `vite build --mode dev` is a production bundle with dev keys, matching CRA's `build:dev`.
- 2026-09-18 — `__endpoint` golden covers memory/region/secrets/service account/trigger type. `invoker` and `consumeAppCheckToken` are not in the manifest in firebase-functions 6.x → guarded by a source-level test on the shared callable options constant.
- 2026-09-18 — `ProjectContext` (single listener) deferred: `useProjectSync` echo suppression is per-caller.
- 2026-09-18 — No `<StrictMode>`; Sentry `environment` semantics kept; missing env vars stay silently undefined (Clerk key still throws).

## Allowed non-behavioral deviations (user-confirmed once, applied everywhere)

- [x] server `console.*` → `firebase-functions` `logger.*` with identical messages (Phase 4)
- [x] `Stripe(...)` → `new Stripe(...)` with `apiVersion: '2025-10-29.clover'` (the stripe 19.3 default — requests unchanged) (Phase 4)
- [ ] removal of dead imports/files and unused dependencies
- [ ] Prettier formatting (single commit, in `.git-blame-ignore-revs`)

## Both developers must do (after this branch lands)

- `nvm install 22 && nvm use` (tooling needs ≥22.22)
- Move/rename local env files: `.env.development` → `web/.env.dev`, `.env.production` → `web/.env.production`, and rename every key `REACT_APP_*` → `VITE_*` (values unchanged)
- `npm ci && npm --prefix functions ci` (functions now needs its devDependencies — esbuild — for `firebase deploy`'s predeploy build)
- Commands: `npm run dev` (was `npm start`), `npm run check` before pushing
- **App Check debug token (Phase 4):** on first `npm run dev` the browser console prints `App Check debug token: …`; register it in the **dev** Firebase console → App Check → Apps → web app → Manage debug tokens. Once per browser profile. Until then every callable returns `unauthenticated` on localhost.
- **Prod params (Phase 4):** fill `functions/.env.cherrytree-cofounder-agreement` with the LIVE Stripe price ids (placeholders today) before the next prod deploy; `APP_ORIGIN` is already set.
- **Prod IAM (Phase 4):** the functions runtime service account `cloud-functions@cherrytree-cofounder-agreement.iam.gserviceaccount.com` needs `roles/firebaseappcheck.tokenVerifier` before the next prod deploy — with App Check enforced, every callable rejects until it can verify tokens (`app-check/permission-denied` in the logs). Granted on dev 2026-09-19 via `gcloud projects add-iam-policy-binding <project> --member=serviceAccount:cloud-functions@<project>.iam.gserviceaccount.com --role=roles/firebaseappcheck.tokenVerifier`.
- `npm run test:rules` (Firestore rules under the emulator) needs Java on the machine

## Found during refactor — triaged 2026-09-18

Rule (user, 2026-09-18): bugs, security gaps and poor practice found while refactoring are **fixed**, not preserved — each as its own commit with a test guarding the corrected behavior. Scope: the *broader* stuff (auth, webhooks, rules, config, dead code). **Survey logic stays as-is for now** (validation/completion rules, field schema quirks, "Other" merging, display names, ordering). Abuse/scale hardening (rate limits etc.) is deferred — few users today. Ask for confirmation when unsure.

### Fix — Phase 4 (functions + rules)
- [x] **App Check enforced**: `enforceAppCheck: true` on every callable; web initializes App Check in all modes (debug token for localhost/dev, reCAPTCHA v3 in prod). Currently `consumeAppCheckToken: true` without enforcement (`functions/index.js`, `functions/organizations.js`, `web/src/firebase.js`)
- [x] **Callables use `request.auth`**: web already signs into Firebase with a Clerk-minted custom token (`UserContext.jsx`), so `request.auth.uid` is available; delete the Clerk-session-token-in-body path (`functions/auth-helpers.js`) and the client code that sends it
- [x] **`deleteAccount` deleted** (no client caller; nondeterministic admin transfer; sets Clerk role `'admin'` vs `'org:admin'` check). Remove from `CallableMap` and the endpoint golden (→ 9 functions)
- [x] **Stripe webhook idempotent** on `event.id`; return 5xx on inner failure so Stripe retries (today: duplicate Clerk org + project on retry, 200 on failure)
- [x] **Clerk webhook verifies `req.rawBody`**, not `JSON.stringify(req.body)`
- [x] **`createCheckoutSession`**: server-side `plan → priceId` map; `successUrl`/`cancelUrl` from config, not the client
- [x] **`createOrganizationInvitation`**: `redirectUrl` from config, not the `Origin` header; role forced to member server-side
- [x] **`sanitizeInput`**: store raw; HTML-escape only when building the Make.com PDF payload (today `Acme & Co` → `Acme &amp; Co` in Firestore/Clerk/Stripe)
- [x] **Contact-form submitter email no longer logged**
- [x] **Firestore rules**: `projects` update locks `collaborators`/`payments`/`editDeadline`/`pdfAgreements`/`currentPlan` to server/admin; `list` gets a field constraint — verify client write/query paths first (`firestore.rules`)
- [x] `console.*` → `logger.*`; pinned Stripe `apiVersion` (allowed deviations, tick when applied)

### Fix — Phase 5 (web)
- [ ] `useProjectSync` sets `project.id` (`CollaboratorManager` error branch is currently unreachable-by-design, `src/components/CollaboratorManager.js:27`)
- [ ] `lastOpened` → `serverTimestamp()` (today a JS `Date` client-side, `src/pages/SurveyPage.js:45`); `updatedAt` written on every project save (today read in `DashboardPage`, never written)
- [ ] `migrateCollaboratorPositions` (documented no-op) removed
- [ ] `VITE_MARKETING_URL` / `VITE_STRIPE_PUBLISHABLE_KEY` removed from `web/.env.example` and `vite-env.d.ts` (nothing reads them) — `VITE_STRIPE_*_PRICE_ID` already removed in Phase 4
- [ ] `lib/functions.ts` `callFunction<K>` passes `{ limitedUseAppCheckTokens: true }` (then server: reject `request.app.alreadyConsumed` in `requireAuth`) — see decisions 2026-09-19
- [ ] `PaymentModal` `sessionStorage.paymentStartTime` is written and never read — remove
- [ ] Callables must only be invoked once `UserContext` `firebaseAuthReady` is true (they rely on the Firebase session now); today the buttons are only reachable after load, but `callFunction` should guard it explicitly

### Fix — Phase 8 (docs)
- [ ] `CLAUDE.md` data model stale: field is `surveyData` not `formData`; `users` has no `name`/`organizationIds`; no `organizations` collection; chat-agent references obsolete; `EquityCalculator.js`/`DynamicSection` wrong; still documents `functions/surveySchema.js` and `src/config/surveySchema.js`/`sectionConfig.js`
- [ ] `TODO.md` ESLint-warnings list stale (baseline build has 0 warnings)
- [ ] `.claude/commands/localhost.md` says `npm start` (CRA) and references the retired chat agent
- [ ] `CLAUDE.md` (web app) still documents `functions/index.js`, `auth-helpers.js`, `organizations.js` and the "Auth Flow" via Clerk JWT in callables; now `functions/src/*.ts`, Firebase session via `getFirebaseToken`, App Check enforced, params in `functions/.env.<projectId>`, `npm run test:rules`
- [ ] Workflows: `firebase deploy` now needs `npm --prefix functions ci` (esbuild) and picks up `functions/.env.<projectId>`; document the App Check debug-token step in README

### Deferred — survey logic, leave as-is (user, 2026-09-18); pin current behavior in Phase 6 tests
- `FIELDS` declares `compensations` as `userId/name/amount/frequency`; code stores `{who, amount}`; `FIELDS.COMPENSATION_*` unused (`shared/src/survey/fields.ts`, `SectionCompensation`)
- `firstUnanswered` treats an empty acknowledgment map `{}` as answered (`every` on empty) while `isAckAnswered` treats it as unanswered (all `Section*` components)
- `mergeOtherFields` mutates nested cofounder objects in place through a shallow copy (`shared/src/survey/otherFields.ts`; pinned by a shared test)
- `finalEquityPercentages` declared in the schema but never written
- Completion rules diverge between `useValidation.isSectionCompleted` and `progressCalculation.countCompletedSections` (zero-collaborator acks; equity `0` vs `''`) — do not dedupe
- `getCollaboratorName` (SectionEquityAllocation) vs `useCollaborators().getDisplayName` diverge for inactive/unknown users — do not replace one with the other
- `collaboratorPositions.getSortedCollaboratorIds` sorts by name although its doc says "by join time"
- `INITIAL_FORM_DATA` default arrays/objects shared by reference through `getInitialFormData()` = `{ ...INITIAL_FORM_DATA }`
- `SURVEY_FIELDS.hasOther`/`otherField`/`options` metadata not consumed (the "Other" merge is driven by `OTHER_FIELD_CONFIG`; options by `questionConfig`)

### Deferred — abuse/scale hardening (few users today)
- `sendContactMessage` unauthenticated and un-rate-limited

## Phase 6 lint follow-ups (from the Phase 1 lint run)

- Flip `@typescript-eslint/no-unused-vars` and `no-case-declarations` back to `error`; fix `useValidation.js` `const`-in-`case` (add braces; verify no cross-case references first)
- Remove unused `eslint-disable` directive in `LandingPage.jsx`
- `react-refresh/only-export-components`: move `calculateSplit` (EquityCalculatorModal), `goToDashboard` (MarketingNav), `useUser` (UserContext) to non-component modules
- React-Compiler warnings (`set-state-in-effect` ×11, `immutability`, `static-components`) stay as warnings → hardening phase
- knip: `@testing-library/user-event` and the `calculateSplit` export are consumed by Phase 5/6 tests

## Intermediate artifacts to delete in Phase 8

- `.refactor-baseline/` (build log, endpoint golden source copy, screenshots) — local only, excluded via `.git/info/exclude`
- `../.playwright-mcp/` (Playwright MCP snapshots; lives in the parent `Cherrytree/` folder, outside the repo)
- The `.git/info/exclude` entries themselves
- `docs/REFACTOR_PLAN.md` (this file)
- Local tags `refactor/p<N>-done`

# cherrytree-cofounder-agreement — Claude Context

## Platform Overview

Cherrytree is a SaaS platform for startup cofounders to create legally sound cofounder agreements. Two subprojects work together:

| Directory | Role | Stack |
|-----------|------|-------|
| `cherrytree-cofounder-agreement/` | Main web app (frontend + backend) | React 19, Firebase, Clerk, Stripe |
| `cherrytree-chat-agent/` | AI advisor chatbot service | Python, FastAPI, LangGraph, Claude, Pinecone |

The web app embeds the chat agent as a sidebar. The agent reads the user's in-progress agreement from Firestore and advises on equity, vesting, IP, decision-making, etc.

## High-Level Architecture

```
User → React app (Firebase Hosting)
         ├── Firestore (form data, chat history, orgs)
         ├── Cloud Functions (Node.js, us-west2) — business logic, webhooks
         └── Chat sidebar → Cloud Run (Python FastAPI) — LangGraph agent
                               ├── Claude Sonnet 4.5 (LLM)
                               ├── Pinecone (RAG knowledge base)
                               └── Firestore (chat history)
```

## Environments

| Env | Firebase Project | Frontend URL |
|-----|-----------------|-------------|
| Dev | `cherrytree-cofounder-agree-dev` | cherrytree-cofounder-agree-dev.web.app |
| Prod | `cherrytree-cofounder-agreement` | cherrytree.app / my.cherrytree.app |

Switch with: `firebase use dev` or `firebase use prod`

## Secrets

Never commit API keys. All keys are in:
- `.env.development` / `.env.production` (frontend, git-ignored)
- Firebase Secret Manager (Cloud Functions)
- Cloud Run Secret Manager (Python agent: Anthropic, Pinecone, LangSmith keys)

## Code Standards (Apply to Every Task)

**No hardcoded local paths:** Never hardcode user-specific paths in any committed file — commands, configs, or docs. Always use relative paths or project-root-relative paths so everything works for any teammate on any machine.

**No duplicate work:** Before suggesting or creating anything (commands, files, functions, configs), check if it already exists. If something exists but the user can't find it, help them locate or access it — don't recreate it.

**Best practices:** Always flag if something deviates from best practices — naming conventions, code structure, anti-patterns, performance issues, or anything that would be considered poor engineering. Don't just complete the task silently; call it out and suggest the better approach.

**Security:** On every task, do a quick security check on any code touched — exposed secrets, injection vulnerabilities (NoSQL/SQL/XSS), unauthenticated endpoints, insecure Firestore rules, CORS misconfiguration, hardcoded credentials. Flag anything suspicious even if outside the immediate scope of the change.

## Team Collaboration

Two people actively pushing to this repo. When working with Claude:

- **Always confirm the Firebase environment** before deploying — `firebase use` to check current target. Default to dev unless explicitly deploying to prod.
- **Don't assume solo context** — changes may affect the other developer. Flag anything that would break shared state (Firestore schema changes, Cloud Function renames, config changes).
- **Coordinate on secrets** — both devs need matching `.env.development` / `.env.production` files locally. These are gitignored; share keys out-of-band.
- **`.claude/settings.json` is committed** — changes to Claude permissions/commands apply to both teammates. Don't add personal preferences here; use `settings.local.json` (gitignored) for those.
- **`.claude/commands/` is committed** — shared slash commands available to both teammates.

React 19 frontend + Firebase backend for the Cherrytree cofounder agreement SaaS platform.

## Stack

- **Frontend:** React 19, React Router, Tailwind CSS
- **Auth:** Clerk (OAuth, org invitations, JWT)
- **Backend:** Firebase Cloud Functions (Node.js, us-west2)
- **Database:** Firestore (real-time listeners in React)
- **Payments:** Stripe (test keys in dev, live keys needed for prod — TODO)
- **PDF generation:** Make.com webhook → Google Drive
- **Address autocomplete:** Google Maps Places API (Section 1 only)

## Key Directories

```
src/
  config/
    questionConfig.js   - Config-driven question definitions (add questions here, not in JSX)
    sectionConfig.js    - Section metadata (10 sections)
    surveySchema.js     - Client-side form validation
  components/
    DynamicSection.js   - Renders questions from questionConfig
    QuestionRenderer.js - Renders individual question types (text, radio, checkbox, dropdown)
    Survey.js           - Main survey container
    EquityCalculator.js - Complex equity split UI
    CollaboratorManager.js - Real-time cofounder collaboration
    PaymentModal.js     - Stripe checkout
  pages/              - LandingPage, SurveyPage, EquityCalculatorPage
  contexts/
    UserContext.js      - Global user state, Firestore listeners, Clerk auth
  firebase.js         - Firebase init + emulator setup

functions/
  index.js            - All Cloud Functions (~40KB): business logic, webhooks, auth
  auth-helpers.js     - Clerk JWT verification
  organizations.js    - Org/collaborator management
  surveySchema.js     - Server-side validation (mirrors client schema)
```

## Config-Driven Question System

**Do not add questions by hardcoding JSX.** Questions are defined in `src/config/questionConfig.js` and rendered dynamically by `DynamicSection.js` + `QuestionRenderer.js`.

To add a question: edit `questionConfig.js` with the question type, label, options, and validation — no component changes needed. Supported types: `text`, `radio`, `checkbox`, `dropdown`, and custom types.

## Firestore Data Model

```
projects/{projectId}/
  formData: { ...all survey answers }
  editDeadline: timestamp  # 6 months from purchase; null = unlimited (legacy)
  createdAt, updatedAt

  chats/{chatId}/          # AI advisor conversations
    messages: [{role, content, timestamp}]
    metadata: {section, messageCount, lastTopic}

organizations/{orgId}/
  name, members[], createdBy

users/{userId}/
  email, name, organizationIds[]
```

## Survey Sections (10 total)

1. Formation & Purpose
2. Cofounder Info
3. Equity Allocation
4. Vesting Schedule
5. Decision-Making
6. IP & Ownership
7. Compensation
8. Performance
9. Non-Competition
10. General Provisions

## Commands

```bash
# Dev
npm start                          # localhost:3000, uses .env.development

# Deploy to dev (local is fine)
npm run deploy:dev                 # everything to dev
npm run deploy:hosting:dev         # frontend only
npm run deploy:functions:dev       # Cloud Functions only
firebase deploy --only firestore:rules

# Firebase
firebase use dev / firebase use prod   # switch environment
firebase functions:log                  # view logs
firebase functions:secrets:set X       # set a secret (then redeploy functions)
```

## Prod Deployment Policy

**Prod deploys only happen through GitHub Actions** (push/merge to `master`). Never deploy to prod locally.

The `deploy:prod` npm scripts have been intentionally removed. You can still run `firebase deploy --project cherrytree-cofounder-agreement` directly from the CLI, but **don't** — it bypasses git history, CI checks, and can overwrite work that isn't committed.

**Before launch:** revoke prod Firebase access from developer accounts so only the GitHub Actions service account can deploy to prod. See `TODO.md` for details.

## Environment Files

| File | Use | In Git |
|------|-----|--------|
| `.env.example` | Template | Yes |
| `.env.development` | Dev keys | No |
| `.env.production` | Prod keys | No |

All sensitive keys (Stripe, Clerk, Make.com webhook) → Firebase Secret Manager, not .env files.

## Edit Window Feature

Users get 6 months from purchase to edit their agreement, enforced via `editDeadline` in Firestore. Config in `functions/index.js`:
```js
const EDIT_WINDOW_CONFIG = { amount: 6, unit: 'months' };
```
Legacy projects (no `editDeadline`) have unlimited editing.

## Auth Flow

Frontend → Clerk (sign in/up) → Clerk JWT → Cloud Functions verify JWT via `auth-helpers.js` → Firestore access

## Config-Driven Question System — Full Reference

See `DYNAMIC_SECTIONS_GUIDE.md` for the complete guide including conditional fields, dynamic acknowledgment text, "Other" option handling, and migration checklist for legacy sections.

## Outstanding TODOs

- Switch Stripe to live keys in production (see `TODO.md` for step-by-step)
- BigQuery analytics integration
- PDF storage (currently ephemeral via Make.com → Google Drive; consider Firebase Storage)
- Update `firebase-functions` package version
- ESLint cleanup (unused vars, missing hook deps — see `TODO.md` for full list)
- Edit window production testing (verify `editDeadline` behavior end-to-end)

## AI Advisor Integration (Planned)

The `cherrytree-chat-agent` Python service needs to be wired into this app:

1. **`AdvisorChat.js`** — React sidebar component (not yet built). Slide-out panel, message history, thumbs up/down per response, legal disclaimer footer, suggested questions based on current section.
2. **Firebase Function gateway** — Add `chatWithAdvisor` function to `functions/index.js` that verifies Clerk JWT, extracts `user_id`, and proxies to Cloud Run. This is the same auth pattern used by all existing functions.
3. **Firestore rules** — Chat subcollection rules already set up. Verify they're deployed.

The Cloud Run service URL needs to be stored as a Firebase secret and read by the gateway function.

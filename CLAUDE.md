# cherrytree-cofounder-agreement — Claude Context

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

# Deploy
npm run deploy:dev                 # everything to dev
npm run deploy:prod                # everything to prod
npm run deploy:hosting:dev         # frontend only
npm run deploy:functions:dev       # Cloud Functions only
firebase deploy --only firestore:rules

# Firebase
firebase use dev / firebase use prod   # switch environment
firebase functions:log                  # view logs
firebase functions:secrets:set X       # set a secret (then redeploy functions)
```

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

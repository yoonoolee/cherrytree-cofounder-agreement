# TODO

Outstanding tasks for Cherrytree Cofounder Agreement Platform.

---

## High Priority

### BigQuery Integration
Set up Firestore to BigQuery export for analytics and reporting.

```bash
firebase ext:install firebase/firestore-bigquery-export --project=cherrytree-cofounder-agreement
```

This enables:
- Analytics dashboards
- Complex queries across projects
- Historical data analysis
- Joining with other data sources

---

### Stripe Live Keys (Production)
Currently using test mode keys in production. Before accepting real payments:

1. Get live keys from Stripe Dashboard → Developers → API Keys
2. Update production secret:
   ```bash
   firebase use prod
   firebase functions:secrets:set STRIPE_SECRET_KEY
   # Enter sk_live_... key
   ```
3. Create production webhook in Stripe Dashboard pointing to:
   `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/stripeWebhook`
4. Update webhook secret:
   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   ```
5. Update `.env.production` with `pk_live_...` publishable key
6. Redeploy:
   ```bash
   npm run deploy:prod
   ```

---

## Medium Priority

### Update firebase-functions Package
The deploy shows a warning about outdated firebase-functions. Update when ready to handle breaking changes:

```bash
cd functions
npm install firebase-functions@latest
cd ..
```

Review changelog for breaking changes before updating.

---

### Edit Window Production Testing
Verify the 6-month edit window works correctly in production:

- [ ] Purchase a project via Stripe checkout
- [ ] Verify `editDeadline` is set correctly in Firestore (6 months from now)
- [ ] Verify editing works within the window
- [ ] Manually set a project's `editDeadline` to the past in Firestore
- [ ] Verify that project becomes read-only
- [ ] Verify collaborator management is blocked after deadline
- [ ] Verify legacy projects (without `editDeadline`) still work

---

## Low Priority

### ESLint Warnings
The build shows various eslint warnings (unused variables, missing hook dependencies). These don't affect functionality but should be cleaned up:

**Unused variables:**
- `src/components/ApprovalSection.js:82` - isCurrentUser
- `src/components/Section1Formation.js` - multiple unused handlers
- `src/components/Section3EquityAllocation.js:331,347,537` - allSubmitted, scrollToFinalEquity, percentage
- `src/components/Section4DecisionMaking.js:3` - CustomSelect
- `src/components/Survey.js` - multiple unused imports and variables
- `src/components/SurveyNavigation.js` - allProjects, handleCreateProject, handleProjectSwitch, handleLogout
- `src/components/Tooltip.js:18` - containerRect
- `src/pages/AboutPage.js:9` - navigate
- `src/pages/EquityCalculatorPage.js:229` - handleNumCofoundersChange
- `src/pages/LandingPage.js` - activeTab, setActiveTab, activeStep, setActiveStep
- `src/pages/SurveyPage.js:7` - orderBy

**Missing hook dependencies:**
- `src/components/EquityCalculator.js:24,351`
- `src/components/Preview.js:146`
- `src/components/Section2Cofounders.js:34`
- `src/components/Section3EquityAllocation.js:99,225`
- `src/components/SurveyNavigation.js:93`
- `src/contexts/UserContext.js:58,88`
- `src/hooks/useProjectSync.js:152`
- `src/pages/EquityCalculatorPage.js:143`
- `src/pages/PricingPage.js:52`

---

## Future Enhancements

### Analytics Dashboard
Once BigQuery is set up, create dashboards for:
- Number of projects created per week/month
- Conversion rate (started → completed)
- Average completion time
- Popular plan breakdown
- Geographic distribution

### Automated Testing
- Add unit tests for Cloud Functions
- Add E2E tests for critical user flows (purchase, survey completion, PDF generation)

### Performance Monitoring
- Set up Firebase Performance Monitoring
- Add custom traces for PDF generation time
- Monitor Cloud Function cold start times

---

## Completed

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

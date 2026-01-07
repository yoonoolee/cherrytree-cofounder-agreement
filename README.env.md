# Environment Variables Setup

## File Structure

- **`.env.example`** - Template file (✅ committed to Git, no real keys)
- **`.env.development`** - Development keys (⛔ gitignored, never committed)
- **`.env.production`** - Production keys (⛔ gitignored, never committed)
- **`.env.local`** - Local overrides (⛔ gitignored, optional)

**Important:** All `.env*` files (except `.env.example`) are gitignored and will NEVER be pushed to Git.

## Environment Workflow

### 1. Local Development (localhost:3000)

```bash
# Run local dev server - automatically uses .env.development
npm start
```

**Connects to:**
- Firebase: `cherrytree-cofounder-agree-dev` (dev project)
- Clerk: Test instance (`pk_test_...`)
- Stripe: Test mode keys
- HTTPS: Disabled
- URL: `http://localhost:3000`

---

### 2. Deploy to DEV

```bash
# Build with dev env vars + deploy to dev Firebase project
npm run deploy:dev

# Or deploy parts separately:
npm run deploy:hosting:dev     # Frontend only
npm run deploy:functions:dev   # Backend only
```

**Deploys to:**
- Firebase Project: `cherrytree-cofounder-agree-dev`
- Hosting URL: `https://cherrytree-cofounder-agree-dev.web.app`
- Functions Region: `us-west2`

---

### 3. Deploy to PRODUCTION

```bash
# Build with prod env vars + deploy to prod Firebase project
npm run deploy:prod

# Or deploy parts separately:
npm run deploy:hosting:prod     # Frontend only
npm run deploy:functions:prod   # Backend only
```

**Deploys to:**
- Firebase Project: `cherrytree-cofounder-agreement`
- Hosting URL: `https://cherrytree.app` (custom domain)
- Functions Region: `us-west2`

---

## Setup Instructions

### First Time Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env.development
   cp .env.example .env.production
   ```

2. **Update `.env.development` with dev credentials:**
   - Firebase: Dev project config
   - Clerk: Test instance keys
   - Stripe: Test mode keys
   - Set `REACT_APP_ENFORCE_HTTPS=false`

3. **Update `.env.production` with prod credentials:**
   - Firebase: Prod project config
   - Clerk: Production instance keys
   - Stripe: Live mode keys (when ready)
   - Set `REACT_APP_ENFORCE_HTTPS=true`

4. **Verify files are gitignored:**
   ```bash
   git check-ignore .env.development .env.production
   # Should show they're ignored
   ```

### Local Development Overrides (Optional)

Create `.env.local` to override any keys for local testing:
```bash
# Override a single value
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_override_key
```

This file is also gitignored.

---

## Current Configuration

### Development Environment (`.env.development`)
- **Firebase:** `cherrytree-cofounder-agree-dev`
- **Clerk:** Test instance (`pk_test_...`)
- **Stripe:** Test mode keys
- **HTTPS:** Disabled
- **Domain:** `http://localhost:3000`

### Production Environment (`.env.production`)
- **Firebase:** `cherrytree-cofounder-agreement`
- **Clerk:** Production instance (`pk_live_...`)
- **Stripe:** ⚠️ Test mode keys (TODO: Update to live keys before launch)
- **HTTPS:** Enabled
- **Domain:** `https://cherrytree.app`

---

## Security Notes

✅ **SAFE** - These files are gitignored and safe:
- `.env.development` (gitignored)
- `.env.production` (gitignored)
- `.env.local` (gitignored)
- `functions/.env` (gitignored)

✅ **SAFE** - These files contain NO secrets and are committed:
- `.env.example` (template only)
- `README.env.md` (this file)
- `README.secrets.md` (instructions only)

⚠️ **NEVER commit** actual API keys or secrets to Git!

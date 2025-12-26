# Environment Variables Setup

## File Structure

- **`.env`** - Template file (committed to Git, no real keys)
- **`.env.development`** - Development keys (committed, used by `npm start`)
- **`.env.production`** - Production keys (committed, used by `npm run build`)  
- **`.env.local`** - Local overrides (gitignored, for personal use)

## How It Works

Create React App automatically loads environment files in this priority order:

### Development (`npm start`):
1. `.env.development.local` (gitignored)
2. `.env.local` (gitignored)
3. `.env.development` (committed)
4. `.env` (committed, template only)

### Production (`npm run build`):
1. `.env.production.local` (gitignored)
2. `.env.local` (gitignored)
3. `.env.production` (committed)
4. `.env` (committed, template only)

## Setup Instructions

1. **First time setup:**
   - Files already exist with proper keys
   - No action needed!

2. **Local development overrides (optional):**
   - Create `.env.local` to override any keys
   - This file is gitignored

3. **Updating keys:**
   - Dev keys → Edit `.env.development`
   - Prod keys → Edit `.env.production`

## Current Configuration

### Development Environment
- Clerk: Development instance (pk_test_...)
- Stripe: Test mode keys
- HTTPS: Disabled

### Production Environment  
- Clerk: Production instance (pk_live_...)
- Stripe: Test mode keys (TODO: Update to live keys when ready)
- HTTPS: Enabled

## No Code Changes Needed

All existing code automatically works with this structure. React loads the correct file based on the command you run.

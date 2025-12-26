# Environment Variables Setup

## File Structure

- **`.env.example`** - Template file (committed to Git, no real keys)
- **`.env.development`** - Development keys (gitignored, used by `npm start`)
- **`.env.production`** - Production keys (gitignored, used by `npm run build`)
- **`.env.local`** - Local overrides (gitignored, for personal use)

## How It Works

Create React App automatically loads environment files in this priority order:

### Development (`npm start`):
1. `.env.development.local` (gitignored)
2. `.env.local` (gitignored)
3. `.env.development` (gitignored)
4. `.env` (gitignored)

### Production (`npm run build`):
1. `.env.production.local` (gitignored)
2. `.env.local` (gitignored)
3. `.env.production` (gitignored)
4. `.env` (gitignored)

## Setup Instructions

1. **First time setup:**
   - Copy `.env.example` to `.env`, `.env.development`, and `.env.production`
   - Update each file with the appropriate API keys
   - All files are gitignored (only `.env.example` is committed)

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

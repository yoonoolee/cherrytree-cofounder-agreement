# Firebase Secrets Setup

Firebase Cloud Functions use **Firebase Secrets** to securely store sensitive API keys and credentials. These secrets are stored per Firebase project and are **NOT** committed to Git.

## Required Secrets

Each Firebase project (dev and prod) needs these 5 secrets configured:

| Secret Name | Description | Where to Get It |
|-------------|-------------|-----------------|
| `MAKE_WEBHOOK_URL` | Make.com webhook for PDF generation | Make.com scenario webhook URL |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard → Developers → Webhooks |
| `CLERK_SECRET_KEY` | Clerk API secret key | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret | Clerk Dashboard → Webhooks |

## Setting Secrets

### For Development Environment

```bash
# Switch to dev Firebase project
firebase use dev

# Set each secret (you'll be prompted to enter the value)
firebase functions:secrets:set MAKE_WEBHOOK_URL
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set CLERK_SECRET_KEY
firebase functions:secrets:set CLERK_WEBHOOK_SECRET

# Deploy functions to apply secrets
firebase deploy --only functions
```

### For Production Environment

```bash
# Switch to prod Firebase project
firebase use prod

# Set each secret with PRODUCTION values
firebase functions:secrets:set MAKE_WEBHOOK_URL
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set CLERK_SECRET_KEY
firebase functions:secrets:set CLERK_WEBHOOK_SECRET

# Deploy functions to apply secrets
firebase deploy --only functions
```

## Viewing Secrets

```bash
# List all secrets for current project
firebase functions:secrets:access --list

# View a specific secret value
firebase functions:secrets:access STRIPE_SECRET_KEY
```

## Important Notes

1. **Secrets are per-project**: Dev and prod have separate secret values
2. **Stripe Keys**:
   - Dev should use **test** mode keys (`sk_test_...`)
   - Prod should use **live** mode keys (`sk_live_...`) when ready
3. **Clerk Keys**:
   - Dev uses test instance keys
   - Prod uses production instance keys
4. **After setting secrets**: Always redeploy functions for changes to take effect
5. **Security**: Never commit secret values to Git or share them publicly

## Troubleshooting

If Cloud Functions fail with "secret not found" errors:

```bash
# Verify secrets are set for current project
firebase functions:secrets:access --list

# If missing, set the secret
firebase functions:secrets:set SECRET_NAME

# Redeploy functions
firebase deploy --only functions
```

## Webhook Configuration

After deploying Cloud Functions, configure webhooks in external services:

### Stripe Webhooks
- Dev: `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/stripeWebhook`
- Prod: `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/stripeWebhook`
- Events to listen for: `checkout.session.completed`

### Clerk Webhooks
- Dev: `https://us-west2-cherrytree-cofounder-agree-dev.cloudfunctions.net/clerkWebhook`
- Prod: `https://us-west2-cherrytree-cofounder-agreement.cloudfunctions.net/clerkWebhook`
- Events to listen for: `user.created`, `user.updated`, `user.deleted`, `organization.created`, etc.

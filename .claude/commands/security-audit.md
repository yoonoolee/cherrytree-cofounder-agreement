Perform a thorough security audit of the Cherrytree codebase. Go through both subprojects systematically and check for the following:

## What to Check

### Secrets & Credentials
- Hardcoded API keys, tokens, or passwords anywhere in the code
- Any keys accidentally committed to .env files that should be in Secret Manager
- Firebase service account JSON files that shouldn't be in the repo

### Authentication & Authorization
- Cloud Functions that don't verify Clerk JWT before executing
- Firestore rules that are too permissive (e.g., allow read, write: if true)
- Any endpoint that trusts user-supplied IDs (e.g., user_id in request body) instead of extracting from verified token
- The chat agent's auth — currently user_id comes from request body in local dev, flag if this is exposed in prod

### Injection & Input Validation
- NoSQL injection via unsanitized Firestore queries
- XSS vulnerabilities in React components (dangerouslySetInnerHTML, etc.)
- Unvalidated user input reaching Cloud Functions or the agent

### CORS & Network
- CORS origins that are too permissive (e.g., allow *)
- Cloud Run or Cloud Functions accessible without authentication

### Firebase Specific
- Firestore security rules — check firestore.rules for gaps
- Storage rules if applicable
- Any Firebase config exposed client-side that shouldn't be

### Dependency Vulnerabilities
- Check package.json and requirements.txt for known vulnerable packages

## Output Format

For each issue found:
- **Severity:** Critical / High / Medium / Low
- **Location:** File and line number
- **Issue:** What the problem is — explain it in plain English as if the reader has zero cybersecurity background. Use an analogy if it helps. Describe exactly what an attacker could do and what real-world harm it would cause (e.g. "someone could read every user's agreement data", "someone could run up $10,000 in API costs").
- **Fix:** Specific recommendation with exact steps. Explain *why* the fix works in plain terms — not just what to do, but why it closes the vulnerability.

If no issues found in a category, say so explicitly.

**IMPORTANT — Do not make any changes to the codebase.** This is a read-only audit. Present all findings and wait for explicit instruction before touching any file. The goal is a full report the user can review and prioritize, not an automated fix.

End with a prioritized list of the top issues to fix first, grouped by: fix immediately, fix before prod launch, fix when time allows.

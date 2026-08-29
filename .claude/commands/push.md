# /push

Commit, sync with master, push, and open a PR to master for prod deployment.
Prod deploys automatically via GitHub Actions on merge to `master`, but the actual deploy job
requires manual approval in GitHub's "production" Environment (reviewers: yoonoolee, timhe2000)
before it runs — merging the PR alone does not ship it.

## Branch setup (one-time, per developer)
Each developer has one persistent personal branch named after them (e.g. `avery`, `tim`).
- Never commit to `master` directly
- Never use the `dev` branch — it is obsolete
- Never create new branches — each developer uses their one persistent branch indefinitely
- PRs always target `master`

## gh CLI gotcha
If a `GITHUB_TOKEN` (or `GH_TOKEN`) environment variable is set in the shell, `gh` uses it instead
of the logged-in keyring account — and that env var's token is often scoped too narrowly to
create or merge PRs ("Resource not accessible by personal access token"). If any `gh pr create` /
`gh pr merge` call fails with that error, retry the exact same command prefixed with
`env -u GITHUB_TOKEN -u GH_TOKEN` to force `gh` to use the keyring-authenticated account instead.

## Steps

1. Run `git pull` to sync your branch with remote. If there are merge conflicts, stop and tell the user to resolve them first. If nothing to commit and nothing to push, tell the user and stop.

2. Run `git diff HEAD` to understand the changes.

3. Draft a concise commit message (imperative mood, under 72 chars, "why" not "what"). Show it to the user and wait for approval before continuing.

4. Stage and commit with the approved message. Never include Claude attribution, co-author lines, or generated-with footers:
   ```
   git add -A && git commit -m "<approved message>"
   ```

5. Sync with latest master so the PR is never "behind":
   ```
   git fetch origin && git merge origin/master
   ```
   If this causes conflicts, stop and tell the user to resolve them.

6. Push to the current branch:
   ```
   git push
   ```
   If no upstream is set: `git push -u origin <branch>`. Never create a new branch or switch branches.

7. Check for an open PR targeting `master` from this branch:
   ```
   gh pr list --head <branch> --base master --state open
   ```
   If one exists, use it. If not, create one (see the gh CLI gotcha above if this fails on auth):
   ```
   gh pr create --base master --fill
   ```

8. Wait for CI, then merge:
   - Poll `gh pr checks <number> --watch --interval 15` until the "Build and Test" check completes. If it fails, stop and tell the user what broke — do not merge.
   - Once CI passes, attempt to merge: `gh pr merge <number> --merge --delete-branch=false` (see the gh CLI gotcha above if this fails on auth). Merging to master is a consequential, hard-to-reverse action — if this is blocked by a permission prompt or the auto-mode classifier, don't try to work around it. Instead tell the user the PR is ready with CI green, give them the PR URL, and ask them to merge it themselves.
   - Either way (you merged it, or the user will), poll `gh pr view <number> --json state,mergedAt` every 15s, up to 10 minutes, until `mergedAt` is set. Don't ask the user whether it merged — just keep polling and detect it yourself.

9. Once merged, find the prod deploy run and open it automatically — don't just print the link, actually open it with the `open` command:
   - Poll `gh run list --branch master --workflow "Deploy to Production" --limit 1 --json databaseId,status,conclusion,url` every ~10s (a couple minutes max) until a run tied to this merge shows up.
   - Run `open <its url>` to open the Actions run page directly in the browser.
   - Tell the user, once: the deploy run is open in their browser; production deploys need manual approval (reviewers: yoonoolee, timhe2000) — click "Review deployments" → Approve. Make clear you'll keep watching from here so they don't need to say anything else.

10. Keep polling `gh run view <databaseId> --json status,conclusion` every ~15s until `status` is `completed` — a long-running "waiting" status is expected and normal, it just means it's sitting on the human approval from step 9. Do not ask the user for updates in the meantime. When it completes, report the final `conclusion` (success/failure) once, unprompted. On failure, pull the log (`gh run view <databaseId> --log-failed`) and summarize what broke.

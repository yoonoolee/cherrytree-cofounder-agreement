# /push

Commit, sync with master, push, and open a PR to master for prod deployment.
Prod deploys automatically via GitHub Actions on merge to `master`.

## Branch setup (one-time, per developer)
Each developer has one persistent personal branch named after them (e.g. `avery`, `tim`).
- Never commit to `master` directly
- Never use the `dev` branch — it is obsolete
- Never create new branches — each developer uses their one persistent branch indefinitely
- PRs always target `master`

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
   If one exists, open it. If not, create one:
   ```
   gh pr create --base master --fill
   ```
   Then open the URL.

8. Poll `gh pr view --json state,mergedAt` every 15 seconds (up to 10 minutes). When merged, run `gh run list --repo <owner>/<repo> --limit 1 --json url`, open the Actions URL, and tell the user the prod deploy is running.

Stage all changes, generate a commit message for approval, commit, push, and open any resulting PR in the browser.

Do the following steps in order:

1. Run `git pull` first to make sure we're on the latest code. If there are merge conflicts, stop and tell the user to resolve them before continuing. Then run `git status` to see what's changed. If there is nothing to commit, tell the user and stop.

2. Run `git diff HEAD` to understand the full set of changes.

3. Based on the diff, draft a concise commit message (imperative mood, under 72 chars, focused on "why" not "what"). Show it to the user and ask them to approve or edit it. Wait for their response before continuing.

4. Once the user approves the message (or provides their own), stage all changes with `git add -A` and commit with the approved message. Never include any Claude Code attribution, co-author lines, or "Generated with Claude Code" footers in the commit message:
   ```
   git commit -m "<approved message>"
   ```

5. Push to the current branch: `git push`. If no upstream is set, use `git push -u origin <branch>`. Never create a new branch — always push to whatever branch we're already on.

6. After pushing, check if an open PR exists for the current branch using `gh pr list --head <branch> --state open --json url`. If one exists, open it. If not, create one with `gh pr create --fill` and open the new URL. Always fetch fresh — never reuse a URL from earlier in the conversation.

7. After opening the PR, poll for merge status by running `gh pr view --json state,mergedAt` every 15 seconds (up to 10 minutes). As soon as the PR is merged, run `gh run list --repo <owner>/<repo> --limit 1 --json url` to get the specific Actions run URL, then open it with `open "<url>"`. Tell the user the PR was merged and that the deploy is now running.

Deploy Cloud Functions to the dev Firebase environment. Never deploys to prod — prod functions deploy automatically via GitHub Actions when changes are pushed to master.

Do the following:

1. Run `firebase use` inside `cherrytree-cofounder-agreement/` to confirm the current Firebase environment. If it's set to prod, switch to dev first with `firebase use dev`.

2. Run the functions deploy from inside `cherrytree-cofounder-agreement/`:
   ```
   cd cherrytree-cofounder-agreement && firebase use dev && firebase deploy --only functions
   ```

3. Stream the output so the user can see progress. If it fails, show the error and suggest checking `firebase functions:log` for runtime errors or reviewing the build output for syntax errors.

4. On success, confirm: "Cloud Functions deployed to dev (cherrytree-cofounder-agree-dev)."

Note: To deploy functions to prod, push your changes to the master branch — GitHub Actions handles prod deploys automatically.

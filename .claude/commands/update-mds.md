Review what changed today and update all relevant markdown files to reflect the current state of the project.

Do the following:

1. Run `git diff HEAD` and `git status` to see everything that changed in this session.

2. Find all markdown files in the project (excluding node_modules and venv) and determine which ones are now out of date based on the changes.

3. Update any that need it. Rules:
   - **TODO files**: Mark completed items with `[x]` and move them to a Completed section. Add any new tasks discovered. Remove anything no longer relevant.
   - **CLAUDE files**: Only update facts — stack, architecture, commands, key files. No task lists, changelogs, or session notes. These are reference docs only.
   - Do not create new MD files unless clearly needed.
   - Do not add session timestamps or "updated on X date" notes — files should read as living docs, not logs.

4. Tell the user which files were changed and what was updated in each.

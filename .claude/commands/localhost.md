Open the local dev server (the React app) in the browser at http://localhost:3000. Ignore $ARGUMENTS other than `web` — there is only one local server now (the chat agent was retired).

1. Check if port 3000 is already listening: `lsof -ti :3000`. If it is, open http://localhost:3000 in the browser and stop.

2. If it is not listening, start the Vite dev server in the background from the repo root: `cd cherrytree-cofounder-agreement && npm run dev` (from inside the repo, just `npm run dev`). It uses `web/.env.dev`.

3. Wait up to 15 seconds for the port to become available (poll with `lsof -ti :3000` every 2 seconds).

4. If the server comes up, open http://localhost:3000 in the browser.

5. If it still isn't up after 15 seconds, check for errors:
   - If `node_modules/` is missing, tell the user to run `nvm use && npm ci && npm --prefix functions ci` first.
   - If `web/.env.dev` is missing, tell the user to `cp web/.env.example web/.env.dev` and fill in the keys from a teammate.
   - Otherwise, show the startup output so the user can see what went wrong.

Note: callables from localhost need an App Check debug token registered once per browser profile (see README → First-Time Setup step 4); a console line `App Check debug token: …` on first load means it is not registered yet.

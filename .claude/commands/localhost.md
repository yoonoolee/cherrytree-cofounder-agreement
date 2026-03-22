Open the local dev server in the browser. Arguments: `web`, `agent`, or `both`. If no argument ($ARGUMENTS), infer from conversation context which one we've been working on.

- **web** → http://localhost:3000 (React app — `npm start` in `cherrytree-cofounder-agreement/`)
- **agent** → http://localhost:8000 (FastAPI — `uvicorn main:app --reload` in `cherrytree-chat-agent/`)
- **both** → both of the above

For each server:

1. Check if the port is already listening: `lsof -ti :<port>`. If it is, open the URL in the browser and stop.

2. If the port is not listening, try to start the server:
   - **web**: `cd cherrytree-cofounder-agreement && npm start` (run in background)
   - **agent**: `cd cherrytree-chat-agent && source venv/bin/activate && uvicorn main:app --reload` (run in background)

3. Wait up to 15 seconds for the port to become available (poll with `lsof -ti :<port>` every 2 seconds).

4. If the server comes up, open the URL in the browser.

5. If it still isn't up after 15 seconds, check for errors:
   - For **agent**: check if `venv/` exists — if not, tell the user to run `python -m venv venv && source venv/bin/activate && pip install -r requirements.txt` first.
   - For **web**: check if `node_modules/` exists — if not, tell the user to run `npm install` first.
   - Otherwise, show the startup output so the user can see what went wrong.

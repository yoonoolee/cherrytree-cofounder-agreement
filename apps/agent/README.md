# apps/agent

The agent service: Python 3.13, FastAPI on Cloud Run, managed with [uv](https://docs.astral.sh/uv/). It runs the agents (the Advisor, Drafting + Review as a background job, and Editing) and owns every agent write to Firestore. Design: [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Layout

```
src/cherrytree_agent/
├── main.py              # HTTP API (contracts: packages/shared/src/agentApi.ts)
├── auth.py              # App Check (consumed) + Firebase ID token + project role, on every browser request
├── tasks.py             # Cloud Tasks: queueing the Drafting job, OIDC check on its worker endpoint
├── firebase.py          # Admin SDK, document refs, validated reads
├── contracts/           # GENERATED from packages/shared's Zod schemas: models.py, schema.json
├── llm/                 # The shared runtime: AgentConfig, run_agent (the loop), call_model (the only model caller)
├── tools/               # Tools by name (registry.py); our own run here, web_search/web_fetch run at Anthropic
├── advisor/             # Advisor config, session start, turn and btw (run + atomic save), stream parser, transcript
├── drafting/            # Drafting config, job start (browser) and the job itself (Cloud Tasks worker)
├── review/              # Review config and its first-draft run
├── editing/             # Editing agent: rewrites selected text and answers comment threads
├── draft/               # Shared draft context (template, transcript), the draft with block ids
│                        # and the run's proposed edits/threads, client of the draftDocument function
├── prompts/             # One system prompt per agent (advisor.md, drafting.md, review.md, editing.md)
└── content/             # interview.json, rag_seed.json, agreement-template.md
tests/                   # pytest; Firestore tests run against the emulator
Dockerfile               # The Cloud Run image (npm run deploy:agent:dev)
```

## Setup

```bash
brew install uv                              # once
uv sync --directory apps/agent               # Python 3.13 + dependencies, from uv.lock
gcloud auth application-default login \
  --impersonate-service-account=agent-service@cherrytree-cofounder-agree-dev.iam.gserviceaccount.com
```

Local runs act as the agent service's own service account, the identity it has on Cloud Run, so they have exactly its permissions. Impersonating it needs `roles/iam.serviceAccountTokenCreator` on that service account (granted per developer below).

### Service account (once per Firebase project)

The service runs as `agent-service@<projectId>.iam.gserviceaccount.com` with only `roles/datastore.user` (Firestore) and `roles/firebaseappcheck.tokenVerifier` (consuming App Check tokens), plus the Drafting job's grants below. Verifying Firebase ID tokens needs no role.

```bash
gcloud iam service-accounts create agent-service --project=<projectId> --display-name="Agent service"
for role in roles/datastore.user roles/firebaseappcheck.tokenVerifier; do
  gcloud projects add-iam-policy-binding <projectId> \
    --member=serviceAccount:agent-service@<projectId>.iam.gserviceaccount.com --role=$role --condition=None
done
# Each developer who runs the service locally (dev project only):
gcloud iam service-accounts add-iam-policy-binding agent-service@<projectId>.iam.gserviceaccount.com \
  --project=<projectId> --member=user:<google-account> --role=roles/iam.serviceAccountTokenCreator
```

`ANTHROPIC_API_KEY` comes from your shell (macOS keychain, read in `~/.zshrc`). Langfuse tracing is on only when `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` are set: from the shell the same way locally, from Secret Manager on Cloud Run. Traces go to the Langfuse Cloud US project of the environment (`LANGFUSE_BASE_URL`), one session per project id, tagged `local` or `dev` (`LANGFUSE_TRACING_ENVIRONMENT`, set by the npm scripts). Non-secret settings are in `.env.cherrytree-cofounder-agree-dev` (committed).

## Drafting job

The browser starts it (`POST /v1/projects/{id}/draft`): the project becomes `queued` and a task goes on the `drafting` queue. Cloud Tasks calls `POST /v1/tasks/draft` on the Cloud Run service with an OIDC token of the `cloud-tasks` service account, which the endpoint checks (the service itself is public for browsers). The worker runs Drafting, converts its markdown with the `draftDocument` Cloud Function (Plate, `apps/functions/src/draftDocument.ts`, callable only by `agent-service` through Cloud Run IAM), runs Review, applies its fixes through the same function, and saves the draft and its threads with `ready` in one transaction. A failed attempt answers 503 and Cloud Tasks retries it; the last of the queue's 3 attempts (`DRAFT_JOB_MAX_ATTEMPTS` in `drafting/job.py`) marks the job `failed`, and the user can start it again.

Cloud Tasks has no local emulator and cannot reach localhost, so the worker runs only on Cloud Run. A local service (`npm run dev:agent`) still starts jobs: it queues them on the dev queue, for the dev Cloud Run service. Redeploy (`npm run deploy:agent:dev`) to test worker changes; the dev Cloud Run URL, queue and accounts are in `.env.<projectId>`.

Once per Firebase project:

```bash
cd <repo root>
P=<projectId>
gcloud services enable cloudtasks.googleapis.com --project=$P
gcloud tasks queues create drafting --location=us-west2 --project=$P \
  --max-attempts=3 --min-backoff=60s --max-backoff=600s --max-concurrent-dispatches=10

# The identity Cloud Tasks signs worker requests with. It needs no roles of its own.
gcloud iam service-accounts create cloud-tasks --project=$P --display-name="Cloud Tasks (agent worker)"
# agent-service queues tasks and has them signed as cloud-tasks.
gcloud tasks queues add-iam-policy-binding drafting --location=us-west2 --project=$P \
  --member=serviceAccount:agent-service@$P.iam.gserviceaccount.com --role=roles/cloudtasks.enqueuer
gcloud iam service-accounts add-iam-policy-binding cloud-tasks@$P.iam.gserviceaccount.com --project=$P \
  --member=serviceAccount:agent-service@$P.iam.gserviceaccount.com --role=roles/iam.serviceAccountUser

# Keys for Cloud Run, readable only by agent-service: Anthropic, and the Langfuse project's API keys.
for name in ANTHROPIC_API_KEY LANGFUSE_PUBLIC_KEY LANGFUSE_SECRET_KEY; do
  printf %s "<value of $name>" | gcloud secrets create $name --project=$P --replication-policy=automatic --data-file=-
  gcloud secrets add-iam-policy-binding $name --project=$P \
    --member=serviceAccount:agent-service@$P.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor
done

# Source deploys build with the Compute Engine default service account.
gcloud projects add-iam-policy-binding $P --condition=None \
  --member=serviceAccount:<projectNumber>-compute@developer.gserviceaccount.com --role=roles/run.builder
```

Then deploy the functions (`draftDocument` grants `agent-service` its invoker role) and the service: `npm run deploy:dev` and `npm run deploy:agent:dev`. The service's settings file names its own deterministic URL, `https://agent-<projectNumber>.us-west2.run.app`.

## Commands (from the repo root)

```bash
npm run dev:agent              # http://localhost:8000 against the dev project, reloads on code, prompt and content changes
npm run check:agent            # Ruff lint + format check, Pyright, unit tests (part of npm run check)
npm run test:agent             # every test, Firestore ones under the emulator (Java 21+)
npm run generate:agent-types   # regenerate contracts/ after changing packages/shared schemas
npm run deploy:agent:dev       # build and deploy to dev Cloud Run (Cloud Build, Dockerfile)
```

Never edit `contracts/` by hand; CI fails if it is out of date with the Zod schemas.

## Tuning the agents

Where each agent's behavior and content live. Paths are under `src/cherrytree_agent/` unless noted. `npm run dev:agent` reloads on every change here; Drafting and Review run only on Cloud Run, so test them after `npm run deploy:agent:dev`.

| What | Where | Notes |
|------|-------|-------|
| System prompts | `prompts/advisor.md`, `drafting.md`, `review.md`, `editing.md` | When and why to use each tool; tone; what never to state |
| Tool descriptions | `tools/checklist.py` (Advisor), `tools/draft.py` (Review), `tools/rag.py`, `tools/project.py` | What a tool does and what each field means. Don't repeat the prompt |
| Model, effort, tools per agent | `advisor/config.py`, `drafting/config.py`, `review/config.py`, `editing/config.py` | `max_tokens` default in `llm/config.py` |
| Web search and fetch | `tools/registry.py` (`web_search`, `web_fetch`) | Tool versions; fetch size limit |
| Interview | `content/interview.json` | `opener` (the first question), then sections (`id`, `name`, `guide`), each with a `checklist` of `{item, notes?}`. Section guides and item notes go to the Advisor's system prompt; the checklist starts each project, and the Advisor adds to it. Guides and notes apply from the next Advisor reply; the opener and checklist only to interviews started after the edit |
| RAG content | `content/rag_seed.json` | One entry per chunk (`id`, `text`, `title`, `url`, `section`, `dateAdded`); searched by keyword in `tools/rag.py` until the vector store is chosen |
| Agreement template | `content/agreement-template.md` | Bracketed fill-ins; unnumbered headings, cross-references by heading name. Each draft records its version (`agreement-template.md@<hash>`) |
| UI copy | `apps/web/src/constants/project.ts` (`DISCLAIMER`), `advisor.ts`, `draft.ts` | Disclaimer, end-of-interview text, errors, draft status screen |

`rag_seed.json` and `agreement-template.md` hold small made-up samples in their real formats; TODO.md → Content to write tracks replacing them. Check prompt changes on the traces in Langfuse (`cherrytree-dev` project).

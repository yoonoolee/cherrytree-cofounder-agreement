# The agent service on Cloud Run (npm run deploy:agent:dev). Python and dependencies come from
# the image and uv.lock; settings from the committed `.env.<projectId>` of the project it runs in.
FROM python:3.13-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /bin/uv

# The image's Python, not a uv-managed one (pyproject.toml asks for managed Python locally).
ENV UV_PYTHON_PREFERENCE=only-system \
    UV_PYTHON_DOWNLOADS=0 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_DEV=1

WORKDIR /app

# Dependencies first, so this layer is rebuilt only when the lockfile changes.
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --locked --no-install-project

COPY . .
RUN uv sync --locked

ENV PATH="/app/.venv/bin:$PATH"

# Cloud Run sets PORT; the deploy sets GOOGLE_CLOUD_PROJECT, which picks the settings file.
CMD exec uvicorn cherrytree_agent.main:app --host 0.0.0.0 --port "$PORT" \
    --env-file ".env.$GOOGLE_CLOUD_PROJECT"

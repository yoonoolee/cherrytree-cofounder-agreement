"""The agent service's HTTP API (contracts: packages/shared/src/agentApi.ts).

Run locally: `npm run dev:agent` (see apps/agent/README.md).
"""

import logging
import os
from collections.abc import AsyncGenerator, AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.sse import EventSourceResponse
from google.cloud.firestore import AsyncClient
from langfuse import Langfuse, get_client, is_langfuse_span

from cherrytree_agent.advisor.session import start_session
from cherrytree_agent.advisor.turn import (
    BtwInput,
    PreparedRun,
    StaleTurnError,
    TurnInput,
    advisor_run_events,
    prepare_run,
)
from cherrytree_agent.auth import Caller, require_project_admin
from cherrytree_agent.contracts.models import (
    AdvisorBtwRequest,
    AdvisorSessionResponse,
    AdvisorStreamEvent,
    AdvisorTurnRequest,
    StartDraftResponse,
)
from cherrytree_agent.draft.plate import DraftDocument
from cherrytree_agent.drafting.job import run_draft_job
from cherrytree_agent.drafting.start import DraftNotStartableError, start_draft
from cherrytree_agent.firebase import get_db
from cherrytree_agent.llm.loop import CallModel
from cherrytree_agent.llm.model import call_model
from cherrytree_agent.logs import configure_logging
from cherrytree_agent.rate_limit import RateLimitedError, count_agent_run
from cherrytree_agent.settings import get_settings
from cherrytree_agent.tasks import DRAFT_TASK_PATH, DraftTask, require_cloud_tasks


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
    configure_logging()
    # Langfuse traces wherever its keys are set (Secret Manager on Cloud Run); without them it is
    # a no-op that would otherwise warn on every call.
    if os.environ.get("LANGFUSE_PUBLIC_KEY"):
        # Only our own spans: `call_model` records each call with its cost, and the Anthropic SDK's
        # OpenTelemetry spans of the same calls would count every cost twice.
        Langfuse(should_export_span=is_langfuse_span)
    else:
        logging.getLogger("langfuse").setLevel(logging.ERROR)
        logging.getLogger(__name__).info("Langfuse tracing is off: no LANGFUSE_PUBLIC_KEY")
    yield
    get_client().shutdown()


def get_call_model() -> CallModel:
    return call_model


def get_draft_document() -> DraftDocument:
    return DraftDocument()


async def _prepare(
    db: AsyncClient, caller: Caller, run_input: TurnInput | BtwInput, index: int
) -> PreparedRun:
    """Checked before the stream opens, so a stale or rate-limited send is a plain 409 or 429."""
    try:
        run = await prepare_run(db, caller, run_input, index)
        await count_agent_run(db, caller.uid)
    except StaleTurnError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, "A newer turn was saved") from error
    except RateLimitedError as error:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many messages this hour",
            headers={"Retry-After": str(error.retry_after_seconds)},
        ) from error
    return run


async def prepared_turn(
    request: AdvisorTurnRequest,
    caller: Annotated[Caller, Depends(require_project_admin)],
    db: Annotated[AsyncClient, Depends(get_db)],
) -> PreparedRun:
    return await _prepare(db, caller, TurnInput(request.reply), request.expected_turn_index)


async def prepared_btw(
    request: AdvisorBtwRequest,
    caller: Annotated[Caller, Depends(require_project_admin)],
    db: Annotated[AsyncClient, Depends(get_db)],
) -> PreparedRun:
    return await _prepare(
        db, caller, BtwInput(request.quote, request.question), request.expected_turn_index
    )


def create_app() -> FastAPI:
    app = FastAPI(title="Cherrytree agent service", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().allowed_origins,
        allow_methods=["POST"],
        allow_headers=["Authorization", "Content-Type", "X-Firebase-AppCheck"],
    )

    @app.post("/v1/projects/{project_id}/advisor/session")
    async def advisor_session(
        caller: Annotated[Caller, Depends(require_project_admin)],
        db: Annotated[AsyncClient, Depends(get_db)],
    ) -> AdvisorSessionResponse:
        return AdvisorSessionResponse(turn_count=await start_session(db, caller.project_id))

    @app.post("/v1/projects/{project_id}/advisor/turns", response_class=EventSourceResponse)
    async def advisor_turn(
        run: Annotated[PreparedRun, Depends(prepared_turn)],
        db: Annotated[AsyncClient, Depends(get_db)],
        call: Annotated[CallModel, Depends(get_call_model)],
    ) -> AsyncIterator[AdvisorStreamEvent]:
        async for event in advisor_run_events(db, run, call):
            yield event

    @app.post("/v1/projects/{project_id}/advisor/btw", response_class=EventSourceResponse)
    async def advisor_btw(
        run: Annotated[PreparedRun, Depends(prepared_btw)],
        db: Annotated[AsyncClient, Depends(get_db)],
        call: Annotated[CallModel, Depends(get_call_model)],
    ) -> AsyncIterator[AdvisorStreamEvent]:
        async for event in advisor_run_events(db, run, call):
            yield event

    @app.post("/v1/projects/{project_id}/draft")
    async def draft(
        caller: Annotated[Caller, Depends(require_project_admin)],
        db: Annotated[AsyncClient, Depends(get_db)],
    ) -> StartDraftResponse:
        try:
            await start_draft(db, caller.project_id)
        except DraftNotStartableError as error:
            raise HTTPException(status.HTTP_409_CONFLICT, str(error)) from error
        return StartDraftResponse(draft_status="queued")

    @app.post(
        DRAFT_TASK_PATH,
        status_code=status.HTTP_204_NO_CONTENT,
        dependencies=[Depends(require_cloud_tasks)],
    )
    async def draft_task(
        task: DraftTask,
        db: Annotated[AsyncClient, Depends(get_db)],
        call: Annotated[CallModel, Depends(get_call_model)],
        documents: Annotated[DraftDocument, Depends(get_draft_document)],
        retry_count: Annotated[int, Header(alias="X-CloudTasks-TaskRetryCount")] = 0,
    ) -> None:
        """Called only by Cloud Tasks. A non-2xx answer makes Cloud Tasks retry the attempt."""
        if not await run_draft_job(db, task.project_id, retry_count, call, documents):
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Draft job failed; retrying")

    return app


app = create_app()

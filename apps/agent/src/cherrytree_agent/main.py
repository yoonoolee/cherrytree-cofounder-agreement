"""The agent service's HTTP API (contracts: packages/shared/src/agentApi.ts).

Run locally: `npm run dev:agent` (see apps/agent/README.md).
"""

import asyncio
import logging
import os
from collections.abc import AsyncGenerator, AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Path, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.sse import EventSourceResponse
from google.cloud.firestore import AsyncClient
from langfuse import Langfuse, get_client, is_langfuse_span

from cherrytree_agent.advisor.session import InterviewNotOpenError, end_interview, start_session
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
    AgentEditRequest,
    AgentEditResponse,
    CreateThreadRequest,
    SaveDraftRequest,
    SaveDraftResponse,
    StartDraftResponse,
    ThreadReplyRequest,
    ThreadStatusRequest,
)
from cherrytree_agent.draft.plate import DraftDocument
from cherrytree_agent.draft.save import InvalidDraftError, StaleDraftError, save_draft
from cherrytree_agent.drafting.job import run_draft_job
from cherrytree_agent.drafting.start import DraftNotStartableError, start_draft
from cherrytree_agent.editing.run import (
    DraftNotReadyError,
    NotFoundError,
    ThreadNotOpenError,
    reply_in_thread,
    rewrite,
    set_thread_status,
    start_thread,
    undo_edit,
)
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


async def flush_traces() -> None:
    """Send the run's traces before its request ends. Cloud Run gives the instance CPU only while
    a request is open, so the SDK's background export would wait for the next request."""
    await asyncio.to_thread(get_client().flush)


async def _flushed(events: AsyncIterator[AdvisorStreamEvent]) -> AsyncIterator[AdvisorStreamEvent]:
    try:
        async for event in events:
            yield event
    finally:
        await flush_traces()


def get_call_model() -> CallModel:
    return call_model


def get_draft_document() -> DraftDocument:
    return DraftDocument()


async def _count_run(db: AsyncClient, caller: Caller) -> None:
    """Counts one agent run toward the caller's hourly limit: 429 once it is used up."""
    try:
        await count_agent_run(db, caller.uid)
    except RateLimitedError as error:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many messages this hour",
            headers={"Retry-After": str(error.retry_after_seconds)},
        ) from error


async def _prepare(
    db: AsyncClient, caller: Caller, run_input: TurnInput | BtwInput, index: int
) -> PreparedRun:
    """Checked before the stream opens, so a stale or rate-limited send is a plain 409 or 429."""
    try:
        run = await prepare_run(db, caller, run_input, index)
    except StaleTurnError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, "A newer turn was saved") from error
    await _count_run(db, caller)
    return run


def require_dev_tools() -> None:
    """Test shortcuts exist only where `DEV_TOOLS` is on (local and dev)."""
    if not get_settings().dev_tools:
        raise HTTPException(status.HTTP_404_NOT_FOUND)


DocId = Annotated[str, Path(pattern=r"^[A-Za-z0-9_-]{8,64}$")]
"""An edit or thread id from the path."""


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
    # FastAPI's own OpenTelemetry is off: Langfuse is the tracing, and FastAPI's would continue
    # Cloud Run's incoming trace, whose "not sampled" flag would drop every Langfuse span.
    app = FastAPI(
        title="Cherrytree agent service",
        lifespan=lifespan,
        telemetry={"tracing": False, "metrics": False, "logs": False},
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().allowed_origins,
        allow_methods=["POST", "PUT"],
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
        async for event in _flushed(advisor_run_events(db, run, call)):
            yield event

    @app.post("/v1/projects/{project_id}/advisor/btw", response_class=EventSourceResponse)
    async def advisor_btw(
        run: Annotated[PreparedRun, Depends(prepared_btw)],
        db: Annotated[AsyncClient, Depends(get_db)],
        call: Annotated[CallModel, Depends(get_call_model)],
    ) -> AsyncIterator[AdvisorStreamEvent]:
        async for event in _flushed(advisor_run_events(db, run, call)):
            yield event

    @app.post(
        "/v1/projects/{project_id}/advisor/skip",
        status_code=status.HTTP_204_NO_CONTENT,
        dependencies=[Depends(require_dev_tools)],
    )
    async def advisor_skip(
        caller: Annotated[Caller, Depends(require_project_admin)],
        db: Annotated[AsyncClient, Depends(get_db)],
    ) -> None:
        try:
            await end_interview(db, caller.project_id)
        except InterviewNotOpenError as error:
            raise HTTPException(status.HTTP_409_CONFLICT, "The interview is not open") from error

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

    @app.put("/v1/projects/{project_id}/draft")
    async def save(
        request: SaveDraftRequest,
        caller: Annotated[Caller, Depends(require_project_admin)],
        db: Annotated[AsyncClient, Depends(get_db)],
    ) -> SaveDraftResponse:
        try:
            version = await save_draft(db, caller.project_id, request.content, request.version)
        except StaleDraftError as error:
            raise HTTPException(status.HTTP_409_CONFLICT, "The draft changed") from error
        except InvalidDraftError as error:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error
        return SaveDraftResponse(version=version)

    @app.post("/v1/projects/{project_id}/draft/edits")
    async def agent_edit(
        request: AgentEditRequest,
        caller: Annotated[Caller, Depends(require_project_admin)],
        db: Annotated[AsyncClient, Depends(get_db)],
        call: Annotated[CallModel, Depends(get_call_model)],
    ) -> AgentEditResponse:
        await _count_run(db, caller)
        try:
            return await rewrite(db, caller, request.quote, request.instruction, call)
        except DraftNotReadyError as error:
            raise HTTPException(status.HTTP_409_CONFLICT, "No draft to edit") from error
        finally:
            await flush_traces()

    @app.post(
        "/v1/projects/{project_id}/draft/edits/{edit_id}/undo",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    async def agent_edit_undo(
        edit_id: DocId,
        caller: Annotated[Caller, Depends(require_project_admin)],
        db: Annotated[AsyncClient, Depends(get_db)],
    ) -> None:
        try:
            await undo_edit(db, caller.project_id, edit_id)
        except NotFoundError as error:
            raise HTTPException(status.HTTP_404_NOT_FOUND) from error

    @app.post("/v1/projects/{project_id}/threads", status_code=status.HTTP_204_NO_CONTENT)
    async def create_thread(
        request: CreateThreadRequest,
        caller: Annotated[Caller, Depends(require_project_admin)],
        db: Annotated[AsyncClient, Depends(get_db)],
        call: Annotated[CallModel, Depends(get_call_model)],
    ) -> None:
        await _count_run(db, caller)
        try:
            await start_thread(db, caller, request.thread_id, request.quote, request.text, call)
        except (DraftNotReadyError, ThreadNotOpenError) as error:
            raise HTTPException(status.HTTP_409_CONFLICT, "Can't start this thread") from error
        finally:
            await flush_traces()

    @app.post(
        "/v1/projects/{project_id}/threads/{thread_id}/messages",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    async def thread_reply(
        thread_id: DocId,
        request: ThreadReplyRequest,
        caller: Annotated[Caller, Depends(require_project_admin)],
        db: Annotated[AsyncClient, Depends(get_db)],
        call: Annotated[CallModel, Depends(get_call_model)],
    ) -> None:
        await _count_run(db, caller)
        try:
            await reply_in_thread(db, caller, thread_id, request.text, call)
        except (DraftNotReadyError, ThreadNotOpenError) as error:
            raise HTTPException(status.HTTP_409_CONFLICT, "The thread is closed") from error
        finally:
            await flush_traces()

    @app.post(
        "/v1/projects/{project_id}/threads/{thread_id}/status",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    async def thread_status(
        thread_id: DocId,
        request: ThreadStatusRequest,
        caller: Annotated[Caller, Depends(require_project_admin)],
        db: Annotated[AsyncClient, Depends(get_db)],
    ) -> None:
        try:
            await set_thread_status(db, caller.project_id, thread_id, request.status)
        except NotFoundError as error:
            raise HTTPException(status.HTTP_404_NOT_FOUND) from error

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
        try:
            succeeded = await run_draft_job(db, task.project_id, retry_count, call, documents)
        finally:
            await flush_traces()
        if not succeeded:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Draft job failed; retrying")

    return app


app = create_app()

"""One Advisor turn: the user's reply → the Advisor (with tool calls) → its response, saved together
with the turn's question-list and summary changes, or not at all.

The prompt is rebuilt from Firestore every turn (system prompt, full transcript, question list,
reply), so the service is stateless and a session resumes wherever it was left.
"""

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from google.cloud.firestore import AsyncClient, AsyncTransaction, async_transactional
from langfuse import get_client, observe, propagate_attributes

from cherrytree_agent.advisor.config import ADVISOR
from cherrytree_agent.advisor.stream import AdvisorStreamParser
from cherrytree_agent.advisor.working_state import (
    AdvisorWorkingState,
    render_question_list,
    screen_question,
)
from cherrytree_agent.auth import Caller
from cherrytree_agent.contracts.models import (
    AdvisorDoneEvent,
    AdvisorErrorEvent,
    AdvisorResponse,
    AdvisorState,
    AdvisorStreamEvent,
    AdvisorTurn,
    Project,
    TranscriptEntry,
)
from cherrytree_agent.firebase import (
    advisor_state_ref,
    project_ref,
    read,
    to_firestore,
    transcript_ref,
    turn_ref,
)
from cherrytree_agent.llm.loop import CallModel, RefusalError, run_agent
from cherrytree_agent.tools.context import ToolContext

logger = logging.getLogger(__name__)

TRANSCRIPT_ENTRY_MAX_BYTES = 900_000
"""Below Firestore's 1 MiB document limit, with room for the other fields."""


class StaleTurnError(Exception):
    """Another turn was saved after this one started, the session never started, or drafting
    started, which closes the Advisor."""


@dataclass(frozen=True)
class PreparedTurn:
    caller: Caller
    reply: str
    index: int
    state: AdvisorState
    history: list[dict[str, Any]]
    """Every earlier turn's messages, replayed exactly as saved."""


async def _check_open(
    db: AsyncClient, project_id: str, index: int, transaction: AsyncTransaction | None = None
) -> AdvisorState:
    """The Advisor state, if a turn at `index` can still be saved."""
    project = await read(project_ref(db, project_id), Project, transaction)
    state = await read(advisor_state_ref(db, project_id), AdvisorState, transaction)
    if project is None or project.draft_status is not None:
        raise StaleTurnError
    if state is None or state.turn_count != index:
        raise StaleTurnError
    return state


async def prepare_turn(db: AsyncClient, caller: Caller, reply: str, index: int) -> PreparedTurn:
    state = await _check_open(db, caller.project_id, index)
    history: list[dict[str, Any]] = []
    entries = project_ref(db, caller.project_id).collection("transcript").order_by("index")
    async for snapshot in entries.stream():
        history.extend(json.loads(TranscriptEntry.model_validate(snapshot.to_dict()).messages))
    return PreparedTurn(caller=caller, reply=reply, index=index, state=state, history=history)


def user_message(state: AdvisorWorkingState, reply: str) -> dict[str, Any]:
    """The question list as it stands, then the reply. Each turn's copy stays in the transcript."""
    question_list = f"<question_list>\n{render_question_list(state)}\n</question_list>"
    return {
        "role": "user",
        "content": [{"type": "text", "text": question_list}, {"type": "text", "text": reply}],
    }


async def _save(
    db: AsyncClient,
    turn: PreparedTurn,
    state: AdvisorWorkingState,
    response: AdvisorResponse,
    transcript: str,
    trace_id: str | None,
) -> None:
    project_id = turn.caller.project_id
    state_ref = advisor_state_ref(db, project_id)

    @async_transactional
    async def save(transaction: AsyncTransaction) -> None:
        # Read in the transaction, so starting the draft meanwhile makes this save fail.
        await _check_open(db, project_id, turn.index, transaction)
        now = datetime.now(UTC)
        transaction.create(
            turn_ref(db, project_id, turn.index),
            to_firestore(
                AdvisorTurn(
                    index=turn.index,
                    uid=turn.caller.uid,
                    reply=turn.reply,
                    response=response,
                    trace_id=trace_id,
                    created_at=now,
                )
            ),
        )
        transaction.create(
            transcript_ref(db, project_id, turn.index),
            to_firestore(TranscriptEntry(index=turn.index, messages=transcript, created_at=now)),
        )
        transaction.set(
            state_ref,
            to_firestore(
                AdvisorState(
                    sections=state.sections,
                    section_summaries=state.section_summaries,
                    turn_count=turn.index + 1,
                    updated_at=now,
                )
            ),
        )

    await save(db.transaction())


@observe(name="advisor_turn", capture_input=False, capture_output=False)
async def _run_and_save(
    db: AsyncClient,
    turn: PreparedTurn,
    events: asyncio.Queue[AdvisorStreamEvent | None],
    call: CallModel,
) -> AdvisorDoneEvent:
    state = AdvisorWorkingState(turn.state)
    run = await run_agent(
        ADVISOR,
        history=turn.history,
        new_messages=[user_message(state, turn.reply)],
        context=ToolContext(db=db, project_id=turn.caller.project_id, advisor=state),
        handler=AdvisorStreamParser(events),
        call=call,
    )
    response = AdvisorResponse.model_validate_json(run.text)
    question = screen_question(AdvisorWorkingState(turn.state), state, response.question)
    if question != response.question:
        logger.warning(
            "Advisor question corrected to match the question list",
            extra={
                "event": "advisor_question_corrected",
                "project_id": turn.caller.project_id,
                "turn_index": turn.index,
                "sent": response.question.model_dump() if response.question else None,
                "saved": question.model_dump() if question else None,
            },
        )
        response = response.model_copy(update={"question": question})

    transcript = json.dumps(run.messages, ensure_ascii=False)
    if len(transcript.encode()) > TRANSCRIPT_ENTRY_MAX_BYTES:
        raise ValueError(f"Turn transcript is {len(transcript.encode())} bytes, over the limit")

    await _save(db, turn, state, response, transcript, get_client().get_current_trace_id())
    get_client().update_current_span(input=turn.reply, output=response.model_dump())
    return AdvisorDoneEvent(type="done", index=turn.index, response=response)


async def _run_turn(
    db: AsyncClient,
    turn: PreparedTurn,
    events: asyncio.Queue[AdvisorStreamEvent | None],
    call: CallModel,
) -> None:
    """Puts the turn's events on `events`, ending with `done` or `error`, then `None`."""
    log = {"project_id": turn.caller.project_id, "turn_index": turn.index}
    try:
        with propagate_attributes(
            session_id=turn.caller.project_id,
            user_id=turn.caller.uid,
            metadata={"prompt": ADVISOR.prompt_version},
            tags=[ADVISOR.name],
        ):
            await events.put(await _run_and_save(db, turn, events, call))
    except StaleTurnError:
        await events.put(AdvisorErrorEvent(type="error", code="stale"))
    except RefusalError as error:
        logger.error(
            "Advisor turn refused",
            extra={"event": "agent_refusal", "category": error.category, **log},
        )
        await events.put(AdvisorErrorEvent(type="error", code="refusal"))
    except Exception:
        # The boundary of the turn: any failure is logged (and alerted on) and saves nothing.
        logger.exception("Advisor turn failed", extra={"event": "agent_turn_failed", **log})
        await events.put(AdvisorErrorEvent(type="error", code="temporary"))
    finally:
        await events.put(None)


async def advisor_turn_events(
    db: AsyncClient, turn: PreparedTurn, call: CallModel
) -> AsyncIterator[AdvisorStreamEvent]:
    """The turn's events as they happen. If the client goes away, the turn is cancelled and
    nothing is saved."""
    events: asyncio.Queue[AdvisorStreamEvent | None] = asyncio.Queue()
    task = asyncio.create_task(_run_turn(db, turn, events, call))
    try:
        while (event := await events.get()) is not None:
            yield event
    finally:
        task.cancel()

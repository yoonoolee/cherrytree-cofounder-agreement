"""One Advisor run, a turn or a btw: the user's input → the Advisor (with tool calls) → its message,
saved together with the run's question list changes, or not at all.

- Turn: a reply to the question on screen. The Advisor highlights facts, updates the question
  list and picks what to ask next.
- btw: a one-off question about selected text, answered with the whole conversation as context.
  It changes nothing but the history.

The prompt is rebuilt from Firestore every run (system prompt, full transcript, new input), so the
service is stateless and a session resumes wherever it was left.
"""

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from google.cloud.firestore import AsyncClient, AsyncTransaction, FieldFilter, async_transactional
from langfuse import get_client, observe, propagate_attributes
from pydantic import ValidationError

from cherrytree_agent.advisor.config import ADVISOR
from cherrytree_agent.advisor.stream import AdvisorStreamParser
from cherrytree_agent.advisor.working_state import (
    AdvisorWorkingState,
    MessageError,
    RunKind,
    render_question_list,
)
from cherrytree_agent.auth import Caller
from cherrytree_agent.contracts.models import (
    AdvisorBtwDoneEvent,
    AdvisorBtwTurn,
    AdvisorDoneEvent,
    AdvisorErrorEvent,
    AdvisorMessage,
    AdvisorOutput,
    AdvisorReplyTurn,
    AdvisorState,
    AdvisorStreamEvent,
    BtwMessage,
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
from cherrytree_agent.llm.loop import AgentRun, CallModel, RefusalError, run_agent
from cherrytree_agent.tools.context import ToolContext

logger = logging.getLogger(__name__)

TRANSCRIPT_ENTRY_MAX_BYTES = 900_000
"""Below Firestore's 1 MiB document limit, with room for the other fields."""

MESSAGE_RETRIES = 2
"""Times the model may rewrite a message that does not fit the question list."""


class StaleTurnError(Exception):
    """Another turn or btw was saved after this one started, the session never started, the
    interview is over, or drafting started, which closes the Advisor."""


@dataclass(frozen=True)
class TurnInput:
    reply: str


@dataclass(frozen=True)
class BtwInput:
    quote: str
    question: str


@dataclass(frozen=True)
class PreparedRun:
    caller: Caller
    index: int
    input: TurnInput | BtwInput
    state: AdvisorState
    screen: str
    """The current main question: the screen the input was sent from."""
    replies: dict[int, str]
    """The replies already on that screen, by turn index."""
    history: list[dict[str, Any]]
    """Every earlier turn's and btw's messages, replayed exactly as saved."""

    @property
    def kind(self) -> RunKind:
        return "turn" if isinstance(self.input, TurnInput) else "btw"


def _current_question(state: AdvisorState) -> str | None:
    for section in state.sections:
        for question in section.questions:
            if question.status == "current":
                return question.id
    return None


async def _check_open(
    db: AsyncClient, project_id: str, index: int, transaction: AsyncTransaction | None = None
) -> AdvisorState:
    """The Advisor state, if a run at `index` can still be saved."""
    project = await read(project_ref(db, project_id), Project, transaction)
    state = await read(advisor_state_ref(db, project_id), AdvisorState, transaction)
    if project is None or project.draft_status is not None:
        raise StaleTurnError
    if state is None or state.turn_count != index:
        raise StaleTurnError
    return state


async def prepare_run(
    db: AsyncClient, caller: Caller, run_input: TurnInput | BtwInput, index: int
) -> PreparedRun:
    state = await _check_open(db, caller.project_id, index)
    screen = _current_question(state)
    if screen is None:
        raise StaleTurnError
    project = project_ref(db, caller.project_id)
    history: list[dict[str, Any]] = []
    async for snapshot in project.collection("transcript").order_by("index").stream():
        history.extend(json.loads(TranscriptEntry.model_validate(snapshot.to_dict()).messages))
    replies: dict[int, str] = {}
    on_screen = project.collection("turns").where(filter=FieldFilter("screen", "==", screen))
    async for snapshot in on_screen.stream():
        data = snapshot.to_dict() or {}
        if data.get("kind") == "turn":
            turn = AdvisorReplyTurn.model_validate(data)
            replies[turn.index] = turn.reply
    return PreparedRun(
        caller=caller,
        index=index,
        input=run_input,
        state=state,
        screen=screen,
        replies=replies,
        history=history,
    )


def user_message(run: PreparedRun) -> dict[str, Any]:
    """A turn: the question list as it stands, then the reply (each turn's copy of the list stays
    in the transcript). A btw: the selected text, then the question."""
    if isinstance(run.input, TurnInput):
        context = f"<question_list>\n{render_question_list(run.state.sections)}\n</question_list>"
        text = run.input.reply
    else:
        context = f"<btw>\n<selected_text>\n{run.input.quote}\n</selected_text>\n</btw>"
        text = run.input.question
    return {
        "role": "user",
        "content": [{"type": "text", "text": context}, {"type": "text", "text": text}],
    }


def _message(state: AdvisorWorkingState, text: str) -> AdvisorMessage | BtwMessage:
    """The run's message, checked against the question list (a turn's question made current)."""
    try:
        message = AdvisorOutput.model_validate_json(text).message
    except ValidationError as error:
        raise MessageError(f"The output does not match the format: {error}") from error
    if state.kind == "btw":
        if not isinstance(message, BtwMessage):
            raise MessageError('This is a btw: write {"type": "answer", "text", "sources"}.')
        return message
    if not isinstance(message, AdvisorMessage):
        raise MessageError(
            "This is a turn: write a followup, next_question, next_section or "
            "interview_complete message, not an answer."
        )
    return state.apply_message(message)


async def _run_until_valid(
    db: AsyncClient,
    run: PreparedRun,
    state: AdvisorWorkingState,
    parser: AdvisorStreamParser,
    call: CallModel,
) -> tuple[AdvisorMessage | BtwMessage, list[dict[str, Any]]]:
    """Runs the Advisor; a message that does not fit is sent back to be rewritten."""
    context = ToolContext(db=db, project_id=run.caller.project_id, advisor=state)
    messages: list[dict[str, Any]] = []
    new_messages = [user_message(run)]
    for attempt in range(MESSAGE_RETRIES + 1):
        result: AgentRun = await run_agent(
            ADVISOR,
            history=[*run.history, *messages],
            new_messages=new_messages,
            context=context,
            handler=parser,
            call=call,
        )
        messages.extend(result.messages)
        try:
            message = _message(state, result.text)
        except MessageError as error:
            if attempt == MESSAGE_RETRIES:
                raise
            logger.warning(
                "Advisor message rewritten",
                extra={
                    "event": "advisor_message_rejected",
                    "project_id": run.caller.project_id,
                    "turn_index": run.index,
                    "reason": str(error),
                },
            )
            parser.stream_answer = False
            new_messages = [
                {
                    "role": "user",
                    "content": f"Your message was not saved: {error} Write the message again.",
                }
            ]
            continue
        if isinstance(message, AdvisorMessage):
            sent = AdvisorOutput.model_validate_json(result.text).message
            if sent.type != message.type:
                logger.warning(
                    "Advisor message type corrected to match the question list",
                    extra={
                        "event": "advisor_message_corrected",
                        "project_id": run.caller.project_id,
                        "turn_index": run.index,
                        "sent": sent.type,
                        "saved": message.type,
                    },
                )
        return message, messages
    raise AssertionError("unreachable")


async def _save(
    db: AsyncClient,
    run: PreparedRun,
    state: AdvisorWorkingState,
    message: AdvisorMessage | BtwMessage,
    transcript: str,
    trace_id: str | None,
) -> None:
    project_id = run.caller.project_id
    state_ref = advisor_state_ref(db, project_id)
    now = datetime.now(UTC)
    common = {
        "index": run.index,
        "uid": run.caller.uid,
        "screen": run.screen,
        "trace_id": trace_id,
        "created_at": now,
    }
    if isinstance(run.input, TurnInput):
        assert isinstance(message, AdvisorMessage)
        turn: AdvisorReplyTurn | AdvisorBtwTurn = AdvisorReplyTurn(
            **common,
            kind="turn",
            reply=run.input.reply,
            green_highlights=state.green_highlights,
            message=message,
        )
    else:
        assert isinstance(message, BtwMessage)
        turn = AdvisorBtwTurn(
            **common,
            kind="btw",
            quote=run.input.quote,
            question=run.input.question,
            message=message,
        )

    @async_transactional
    async def save(transaction: AsyncTransaction) -> None:
        # Read in the transaction, so starting the draft meanwhile makes this save fail.
        await _check_open(db, project_id, run.index, transaction)
        transaction.create(turn_ref(db, project_id, run.index), to_firestore(turn))
        transaction.create(
            transcript_ref(db, project_id, run.index),
            to_firestore(TranscriptEntry(index=run.index, messages=transcript, created_at=now)),
        )
        transaction.set(
            state_ref,
            to_firestore(
                AdvisorState(sections=state.sections, turn_count=run.index + 1, updated_at=now)
            ),
        )

    await save(db.transaction())


@observe(name="advisor_run", capture_input=False, capture_output=False)
async def _run_and_save(
    db: AsyncClient,
    run: PreparedRun,
    events: asyncio.Queue[AdvisorStreamEvent | None],
    call: CallModel,
) -> AdvisorDoneEvent | AdvisorBtwDoneEvent:
    replies = dict(run.replies)
    if isinstance(run.input, TurnInput):
        replies[run.index] = run.input.reply
    state = AdvisorWorkingState.start(
        run.state, kind=run.kind, index=run.index, screen=run.screen, replies=replies
    )
    parser = AdvisorStreamParser(events, state)
    message, messages = await _run_until_valid(db, run, state, parser, call)

    transcript = json.dumps(messages, ensure_ascii=False)
    if len(transcript.encode()) > TRANSCRIPT_ENTRY_MAX_BYTES:
        raise ValueError(f"Run transcript is {len(transcript.encode())} bytes, over the limit")

    await _save(db, run, state, message, transcript, get_client().get_current_trace_id())
    get_client().update_current_span(input=run.input.__dict__, output=message.model_dump())
    if isinstance(message, BtwMessage):
        return AdvisorBtwDoneEvent(type="btw_done", index=run.index, message=message)
    return AdvisorDoneEvent(type="done", index=run.index, message=message)


async def _run(
    db: AsyncClient,
    run: PreparedRun,
    events: asyncio.Queue[AdvisorStreamEvent | None],
    call: CallModel,
) -> None:
    """Puts the run's events on `events`, ending with a done event or `error`, then `None`."""
    log = {"project_id": run.caller.project_id, "turn_index": run.index, "kind": run.kind}
    try:
        with propagate_attributes(
            session_id=run.caller.project_id,
            user_id=run.caller.uid,
            metadata={"prompt": ADVISOR.prompt_version, "kind": run.kind},
            tags=[ADVISOR.name],
        ):
            await events.put(await _run_and_save(db, run, events, call))
    except StaleTurnError:
        await events.put(AdvisorErrorEvent(type="error", code="stale"))
    except RefusalError as error:
        logger.error(
            "Advisor run refused",
            extra={"event": "agent_refusal", "category": error.category, **log},
        )
        await events.put(AdvisorErrorEvent(type="error", code="refusal"))
    except Exception:
        # The boundary of the run: any failure is logged (and alerted on) and saves nothing.
        logger.exception("Advisor run failed", extra={"event": "agent_turn_failed", **log})
        await events.put(AdvisorErrorEvent(type="error", code="temporary"))
    finally:
        await events.put(None)


async def advisor_run_events(
    db: AsyncClient, run: PreparedRun, call: CallModel
) -> AsyncIterator[AdvisorStreamEvent]:
    """The run's events as they happen. If the client goes away, the run is cancelled and
    nothing is saved."""
    events: asyncio.Queue[AdvisorStreamEvent | None] = asyncio.Queue()
    task = asyncio.create_task(_run(db, run, events, call))
    try:
        while (event := await events.get()) is not None:
            yield event
    finally:
        task.cancel()

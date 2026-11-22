"""Editing Agent runs: a rewrite of selected text, and replies in comment threads.

The editor in the browser changes the document itself; these runs only answer, and log what they
proposed (`edits/`, `threads/`).
"""

import logging
import time
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from google.api_core.exceptions import AlreadyExists, NotFound
from google.cloud.firestore import AsyncClient, AsyncTransaction, async_transactional
from langfuse import observe, propagate_attributes

from cherrytree_agent.auth import Caller
from cherrytree_agent.contracts.models import (
    AgentEdit,
    AgentEditResponse,
    Draft,
    Project,
    Thread,
    ThreadMessage,
)
from cherrytree_agent.draft.context import load_draft_context
from cherrytree_agent.draft.working import render_draft
from cherrytree_agent.editing.config import COMMENT, REWRITE, CommentOutput, RewriteOutput
from cherrytree_agent.firebase import (
    draft_ref,
    edit_ref,
    project_ref,
    read,
    thread_ref,
    to_firestore,
)
from cherrytree_agent.llm.config import AgentConfig
from cherrytree_agent.llm.loop import CallModel, run_agent
from cherrytree_agent.llm.model import NoStream
from cherrytree_agent.tools.context import ToolContext

logger = logging.getLogger(__name__)

REPLY_FAILED = "I couldn't reply just now. Ask me again in a moment."


class DraftNotReadyError(Exception):
    """There is no finished draft to edit."""


class ThreadNotOpenError(Exception):
    """The thread is missing or closed, or one with that id already exists."""


class NotFoundError(Exception):
    """The edit or thread does not exist."""


async def _ready_draft(db: AsyncClient, project_id: str) -> Draft:
    project = await read(project_ref(db, project_id), Project)
    draft = await read(draft_ref(db, project_id), Draft)
    if project is None or project.draft_status != "ready" or draft is None:
        raise DraftNotReadyError
    return draft


@observe(name="editing_run", capture_input=False, capture_output=False)
async def _run(
    db: AsyncClient,
    project_id: str,
    config: AgentConfig,
    request: list[dict[str, Any]],
    call: CallModel,
) -> str:
    """One run on the current draft; returns its structured output as JSON."""
    draft = await _ready_draft(db, project_id)
    context = await load_draft_context(db, project_id)
    with propagate_attributes(
        session_id=project_id,
        metadata={"prompt": config.prompt_version},
        tags=[config.name],
    ):
        run = await run_agent(
            config,
            history=[],
            new_messages=[
                {
                    "role": "user",
                    "content": [
                        *context.prefix(config.model.prefix_cache_ttl),
                        {
                            "type": "text",
                            "text": f"<draft>\n{render_draft(draft.content)}\n</draft>",
                        },
                        *request,
                    ],
                }
            ],
            context=ToolContext(db=db, project_id=project_id),
            handler=NoStream(),
            call=call,
        )
    return run.text


async def rewrite(
    db: AsyncClient, caller: Caller, quote: str, instruction: str, call: CallModel
) -> AgentEditResponse:
    """Rewrites `quote` as `instruction` asks, and logs the edit as applied."""
    started = time.monotonic()
    request = [
        {"type": "text", "text": f"<quote>\n{quote}\n</quote>"},
        {"type": "text", "text": f"<instruction>\n{instruction}\n</instruction>"},
    ]
    output = RewriteOutput.model_validate_json(
        await _run(db, caller.project_id, REWRITE, request, call)
    )
    edit_id = uuid4().hex
    await edit_ref(db, caller.project_id, edit_id).create(
        to_firestore(
            AgentEdit(
                uid=caller.uid,
                quote=quote,
                instruction=instruction,
                replacement=output.replacement,
                message=output.message,
                title=output.title,
                status="applied",
                duration_ms=round((time.monotonic() - started) * 1000),
                created_at=datetime.now(UTC),
            )
        )
    )
    return AgentEditResponse(
        id=edit_id, replacement=output.replacement, message=output.message, title=output.title
    )


async def undo_edit(db: AsyncClient, project_id: str, edit_id: str) -> None:
    try:
        await edit_ref(db, project_id, edit_id).update({"status": "undone"})
    except NotFound as error:
        raise NotFoundError from error


def _message(author: str, uid: str | None, text: str, suggestion: str | None) -> ThreadMessage:
    return ThreadMessage.model_validate(
        {
            "author": author,
            "uid": uid,
            "text": text,
            "suggestion": suggestion,
            "sources": [],
            "createdAt": datetime.now(UTC),
        }
    )


async def _append(
    db: AsyncClient, project_id: str, thread_id: str, message: ThreadMessage
) -> Thread:
    """Adds `message` to an open thread; returns the thread with it."""
    ref = thread_ref(db, project_id, thread_id)

    @async_transactional
    async def append(transaction: AsyncTransaction) -> Thread:
        thread = await read(ref, Thread, transaction)
        if thread is None or thread.status != "open":
            raise ThreadNotOpenError
        updated = thread.model_copy(
            update={"messages": [*thread.messages, message], "updated_at": message.created_at}
        )
        transaction.set(ref, to_firestore(updated))
        return updated

    return await append(db.transaction())


async def _agent_reply(
    db: AsyncClient, project_id: str, thread_id: str, thread: Thread, call: CallModel
) -> None:
    """Answers the thread's latest comment. A failed run still answers, so no thread waits."""
    lines = [f"{'User' if m.author == 'user' else 'Cherrytree'}: {m.text}" for m in thread.messages]
    request = [
        {"type": "text", "text": f"<quote>\n{thread.quote}\n</quote>"},
        {"type": "text", "text": "<thread>\n" + "\n".join(lines) + "\n</thread>"},
    ]
    try:
        output = CommentOutput.model_validate_json(
            await _run(db, project_id, COMMENT, request, call)
        )
        reply = _message("agent", None, output.message, output.suggestion)
    except Exception:
        logger.exception(
            "Comment reply failed", extra={"event": "agent_turn_failed", "project_id": project_id}
        )
        reply = _message("agent", None, REPLY_FAILED, None)
    try:
        await _append(db, project_id, thread_id, reply)
    except ThreadNotOpenError:
        logger.info("Thread closed before the reply", extra={"project_id": project_id})


async def start_thread(
    db: AsyncClient, caller: Caller, thread_id: str, quote: str, text: str, call: CallModel
) -> None:
    """Opens a thread on `quote` with the user's comment, then the agent answers it."""
    await _ready_draft(db, caller.project_id)
    message = _message("user", caller.uid, text, None)
    thread = Thread(
        status="open",
        created_by="user",
        quote=quote,
        messages=[message],
        created_at=message.created_at,
        updated_at=message.created_at,
    )
    try:
        await thread_ref(db, caller.project_id, thread_id).create(to_firestore(thread))
    except AlreadyExists as error:
        raise ThreadNotOpenError from error
    await _agent_reply(db, caller.project_id, thread_id, thread, call)


async def reply_in_thread(
    db: AsyncClient, caller: Caller, thread_id: str, text: str, call: CallModel
) -> None:
    thread = await _append(
        db, caller.project_id, thread_id, _message("user", caller.uid, text, None)
    )
    await _agent_reply(db, caller.project_id, thread_id, thread, call)


async def set_thread_status(db: AsyncClient, project_id: str, thread_id: str, status: str) -> None:
    try:
        await thread_ref(db, project_id, thread_id).update(
            {"status": status, "updatedAt": datetime.now(UTC)}
        )
    except NotFound as error:
        raise NotFoundError from error

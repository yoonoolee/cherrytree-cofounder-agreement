"""The Drafting + Review job, run by Cloud Tasks: Drafting writes the agreement in markdown, Plate
turns it into the draft, Review fixes it and raises open items, and the draft and its threads are
saved together. `Project.draftStatus` follows each step: queued → drafting → reviewing → ready,
or failed.

Every attempt starts from the beginning and saves nothing until the end. A retry, or a duplicate
delivery, never creates a second draft: a run starts only while the job is active, and the save
creates the draft only if none exists.
"""

import logging
from datetime import UTC, datetime

from google.cloud.firestore import AsyncClient, AsyncTransaction, async_transactional
from langfuse import get_client, observe, propagate_attributes

from cherrytree_agent.contracts.models import (
    Draft,
    DraftBlock,
    DraftStatus,
    DraftThreadAnchor,
    Project,
    Thread,
    ThreadMessage,
)
from cherrytree_agent.draft.context import TEMPLATE_VERSION, DraftContext, load_draft_context
from cherrytree_agent.draft.plate import DraftDocument
from cherrytree_agent.draft.working import NewThread
from cherrytree_agent.drafting.config import DRAFTING
from cherrytree_agent.firebase import draft_ref, project_ref, read, thread_ref, to_firestore
from cherrytree_agent.llm.loop import CallModel, RefusalError, run_agent
from cherrytree_agent.llm.model import NoStream
from cherrytree_agent.review.config import REVIEW
from cherrytree_agent.review.run import review_first_draft
from cherrytree_agent.tools.context import ToolContext

logger = logging.getLogger(__name__)

DRAFT_JOB_MAX_ATTEMPTS = 3
"""The queue's `--max-attempts` (apps/agent/README.md). The last failed attempt marks the job
`failed`, so the user can start it again."""

ACTIVE: frozenset[DraftStatus] = frozenset({"queued", "drafting", "reviewing"})

WRITE_TASK = "Write the first draft of these founders' cofounder agreement."


async def _transition(
    db: AsyncClient, project_id: str, allowed: frozenset[DraftStatus], to: DraftStatus
) -> bool:
    """Sets `draftStatus` to `to` if it is one of `allowed`; returns whether it did."""
    ref = project_ref(db, project_id)

    @async_transactional
    async def transition(transaction: AsyncTransaction) -> bool:
        project = await read(ref, Project, transaction)
        if project is None or project.draft_status not in allowed:
            return False
        transaction.update(ref, {"draftStatus": to})
        return True

    return await transition(db.transaction())


async def _write_first_draft(
    db: AsyncClient, project_id: str, context: DraftContext, call: CallModel
) -> str:
    run = await run_agent(
        DRAFTING,
        history=[],
        new_messages=[
            {
                "role": "user",
                "content": [
                    *context.prefix(DRAFTING.model.prefix_cache_ttl),
                    {"type": "text", "text": WRITE_TASK},
                ],
            }
        ],
        context=ToolContext(db=db, project_id=project_id),
        handler=NoStream(),
        call=call,
    )
    markdown = run.text.strip()
    if not markdown:
        raise ValueError("The Drafting Agent returned no draft")
    return markdown


async def _save(
    db: AsyncClient, project_id: str, content: list[DraftBlock], threads: list[NewThread]
) -> bool:
    """Saves the draft, its threads and `ready` together, unless a draft already exists or the job
    is no longer active. Returns whether it saved."""
    ref = project_ref(db, project_id)
    current = draft_ref(db, project_id)

    @async_transactional
    async def save(transaction: AsyncTransaction) -> bool:
        project = await read(ref, Project, transaction)
        existing = await current.get(transaction=transaction)
        if project is None or project.draft_status not in ACTIVE or existing.exists:
            return False
        now = datetime.now(UTC)
        draft = Draft(
            template_version=TEMPLATE_VERSION,
            version=1,
            block_versions={block.id: 1 for block in content},
            content=content,
            updated_at=now,
        )
        # Plate nodes exactly as Plate wrote them: no keys the models would add as defaults.
        transaction.create(current, draft.model_dump(by_alias=True, exclude_unset=True))
        for thread in threads:
            message = ThreadMessage(
                author="agent", uid=None, text=thread.message, sources=[], created_at=now
            )
            transaction.create(
                thread_ref(db, project_id, thread.id),
                to_firestore(
                    Thread(
                        status="open",
                        created_by="agent",
                        messages=[message],
                        created_at=now,
                        updated_at=now,
                    )
                ),
            )
        transaction.update(ref, {"draftStatus": "ready", "lastUpdated": now})
        return True

    return await save(db.transaction())


@observe(name="draft_job", capture_input=False, capture_output=False)
async def _run(db: AsyncClient, project_id: str, call: CallModel, documents: DraftDocument) -> None:
    context = await load_draft_context(db, project_id)
    markdown = await _write_first_draft(db, project_id, context, call)
    content = await documents.from_markdown(markdown)

    await _transition(db, project_id, frozenset({"drafting"}), "reviewing")
    review = await review_first_draft(db, project_id, context, content, call)
    content = await documents.apply_review(
        content,
        review.fixes,
        [DraftThreadAnchor(thread_id=thread.id, para=thread.para) for thread in review.threads],
    )

    saved = await _save(db, project_id, content, review.threads)
    get_client().update_current_span(
        output={"blocks": len(content), "fixes": len(review.fixes), "threads": len(review.threads)}
    )
    if not saved:
        logger.info("Draft job finished after another run", extra={"project_id": project_id})


async def run_draft_job(
    db: AsyncClient, project_id: str, attempt: int, call: CallModel, documents: DraftDocument
) -> bool:
    """One attempt (0-based). Returns False when Cloud Tasks should retry it."""
    log = {"project_id": project_id, "attempt": attempt + 1}
    if not await _transition(db, project_id, ACTIVE, "drafting"):
        logger.info("Draft job has nothing to do", extra=log)
        return True
    try:
        with propagate_attributes(
            session_id=project_id,
            metadata={"prompts": f"{DRAFTING.prompt_version},{REVIEW.prompt_version}"},
            tags=["draft_job"],
        ):
            await _run(db, project_id, call, documents)
    except RefusalError as error:
        # Not retried: a refusal likely means a bug in the prompt or the inputs.
        logger.error(
            "Draft job refused",
            extra={"event": "agent_refusal", "category": error.category, **log},
        )
        await _transition(db, project_id, ACTIVE, "failed")
        return True
    except Exception:
        final = attempt + 1 >= DRAFT_JOB_MAX_ATTEMPTS
        logger.exception(
            "Draft job failed", extra={"event": "draft_job_failed", "final": final, **log}
        )
        if final:
            await _transition(db, project_id, ACTIVE, "failed")
        return final
    return True

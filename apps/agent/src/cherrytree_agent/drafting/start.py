"""Starting the Drafting + Review job from the browser: once the interview is finished, the project
is marked `queued` and a task is queued. From then on the Advisor is closed."""

import logging

from google.cloud.firestore import AsyncClient, AsyncTransaction, async_transactional

from cherrytree_agent.contracts.models import AdvisorState, Project
from cherrytree_agent.firebase import advisor_state_ref, project_ref, read
from cherrytree_agent.tasks import enqueue_draft_job

logger = logging.getLogger(__name__)


class DraftNotStartableError(Exception):
    """The interview is not finished, or a job already started and has not failed."""


def interview_finished(state: AdvisorState) -> bool:
    """Every main question is done or skipped."""
    return all(
        question.status in ("done", "skipped")
        for section in state.sections
        for question in section.questions
    )


async def start_draft(db: AsyncClient, project_id: str) -> None:
    ref = project_ref(db, project_id)

    @async_transactional
    async def queue(transaction: AsyncTransaction) -> None:
        project = await read(ref, Project, transaction)
        state = await read(advisor_state_ref(db, project_id), AdvisorState, transaction)
        if project is None or project.draft_status not in (None, "failed"):
            raise DraftNotStartableError("A draft job already started")
        if state is None or not interview_finished(state):
            raise DraftNotStartableError("The interview is not finished")
        transaction.update(ref, {"draftStatus": "queued"})

    await queue(db.transaction())
    try:
        await enqueue_draft_job(project_id)
    except Exception:
        # Without a task nothing would ever run the job; `failed` lets the user start it again.
        logger.exception(
            "Could not queue the draft job",
            extra={"event": "draft_job_failed", "project_id": project_id},
        )
        await ref.update({"draftStatus": "failed"})
        raise

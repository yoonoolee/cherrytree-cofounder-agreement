"""Starting the Advisor (the project's state starts from `content/interview.json`), and ending it
early for testing."""

from datetime import UTC, datetime

from google.cloud.firestore import AsyncClient, AsyncTransaction, async_transactional

from cherrytree_agent.advisor.interview import initial_state
from cherrytree_agent.contracts.models import AdvisorState
from cherrytree_agent.firebase import advisor_state_ref, read, to_firestore


class InterviewNotOpenError(Exception):
    """The interview has not started, or has already ended."""


async def start_session(db: AsyncClient, project_id: str) -> int:
    """Creates the state on the first call; returns the number of saved turns."""
    ref = advisor_state_ref(db, project_id)

    @async_transactional
    async def start(transaction: AsyncTransaction) -> int:
        state = await read(ref, AdvisorState, transaction)
        if state is None:
            state = initial_state()
            transaction.create(ref, to_firestore(state))
        return state.turn_count

    return await start(db.transaction())


async def end_interview(db: AsyncClient, project_id: str) -> None:
    """Marks the interview finished with the answers given so far; changes nothing else."""
    ref = advisor_state_ref(db, project_id)

    @async_transactional
    async def end(transaction: AsyncTransaction) -> None:
        state = await read(ref, AdvisorState, transaction)
        if state is None or state.complete:
            raise InterviewNotOpenError
        transaction.update(ref, {"complete": True, "updatedAt": datetime.now(UTC)})

    await end(db.transaction())

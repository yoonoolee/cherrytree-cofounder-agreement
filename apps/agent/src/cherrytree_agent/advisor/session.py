"""Starting the Advisor: the project's question list is copied from `content/questions.json`."""

from datetime import UTC, datetime
from pathlib import Path

from google.cloud.firestore import AsyncClient, AsyncTransaction, async_transactional

from cherrytree_agent.contracts.models import (
    AdvisorState,
    InitialQuestions,
    Question,
    QuestionSection,
)
from cherrytree_agent.firebase import advisor_state_ref, read, to_firestore

INITIAL_QUESTIONS = InitialQuestions.model_validate_json(
    (Path(__file__).parent.parent / "content" / "questions.json").read_text()
)


def initial_state() -> AdvisorState:
    """Every question `todo` from source `initial`, except the first, which is current."""
    sections = [
        QuestionSection(
            id=section.id,
            name=section.name,
            questions=[
                Question(
                    id=question.id,
                    text=question.text,
                    description=question.description,
                    status="todo",
                    source="initial",
                    advisor_notes=None,
                    followups=[],
                )
                for question in section.questions
            ],
        )
        for section in INITIAL_QUESTIONS.sections
    ]
    sections[0].questions[0].status = "current"
    return AdvisorState(sections=sections, turn_count=0, updated_at=datetime.now(UTC))


async def start_session(db: AsyncClient, project_id: str) -> int:
    """Creates the question list on the first call; returns the number of saved turns."""
    ref = advisor_state_ref(db, project_id)

    @async_transactional
    async def start(transaction: AsyncTransaction) -> int:
        state = await read(ref, AdvisorState, transaction)
        if state is None:
            state = initial_state()
            transaction.create(ref, to_firestore(state))
        return state.turn_count

    return await start(db.transaction())

"""The Advisor interview as the other agents read it: each user reply with the response to it."""

from google.cloud.firestore import AsyncClient

from cherrytree_agent.contracts.models import AdvisorTurn
from cherrytree_agent.firebase import project_ref


async def read_transcript(db: AsyncClient, project_id: str) -> str:
    turns = project_ref(db, project_id).collection("turns").order_by("index")
    lines: list[str] = []
    async for snapshot in turns.stream():
        turn = AdvisorTurn.model_validate(snapshot.to_dict())
        lines.append(f"User: {turn.reply}")
        if turn.response.answer:
            lines.append(f"Advisor: {turn.response.answer}")
        if turn.response.question:
            lines.append(f"Advisor asked: {turn.response.question.text}")
    return "\n\n".join(lines) or "The interview has not started yet."

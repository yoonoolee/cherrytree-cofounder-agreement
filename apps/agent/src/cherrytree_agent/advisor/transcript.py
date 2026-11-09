"""The Advisor interview as the other agents read it: every turn and btw in order, then the final
question list. Built from the saved turns, so nothing is compacted, without the tool calls and
question list copies of the raw transcript."""

from google.cloud.firestore import AsyncClient

from cherrytree_agent.advisor.working_state import render_question_list
from cherrytree_agent.contracts.models import (
    AdvisorBtwTurn,
    AdvisorReplyTurn,
    AdvisorState,
    QuestionSection,
)
from cherrytree_agent.firebase import advisor_state_ref, project_ref, read


def _question_texts(sections: list[QuestionSection]) -> dict[str, str]:
    texts: dict[str, str] = {}
    for section in sections:
        for question in section.questions:
            texts[question.id] = question.text
            texts.update({followup.id: followup.text for followup in question.followups})
    return texts


async def read_transcript(db: AsyncClient, project_id: str) -> str:
    state = await read(advisor_state_ref(db, project_id), AdvisorState)
    if state is None:
        return "The interview has not started yet."
    texts = _question_texts(state.sections)
    first = state.sections[0].questions[0].text if state.sections[0].questions else None
    lines: list[str] = [f"Advisor asked: {first}"] if first else []
    turns = project_ref(db, project_id).collection("turns").order_by("index")
    async for snapshot in turns.stream():
        data = snapshot.to_dict() or {}
        if data.get("kind") == "btw":
            btw = AdvisorBtwTurn.model_validate(data)
            lines.append(f'User asked about "{btw.quote}": {btw.question}')
            lines.append(f"Advisor: {btw.message.text}")
            continue
        turn = AdvisorReplyTurn.model_validate(data)
        lines.append(f"User: {turn.reply}")
        if turn.message.answer:
            lines.append(f"Advisor: {turn.message.answer}")
        if turn.message.question_id:
            lines.append(f"Advisor asked: {texts.get(turn.message.question_id, '')}")
    question_list = render_question_list(state.sections)
    return "\n\n".join(lines) + f"\n\n<question_list>\n{question_list}\n</question_list>"

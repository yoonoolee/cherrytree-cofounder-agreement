"""The Advisor interview as the other agents read it: every turn and btw in order, then the final
checklist. Built from the saved turns, so nothing is compacted, without the tool calls of the raw
transcript."""

from google.cloud.firestore import AsyncClient

from cherrytree_agent.advisor.working_state import render_checklist
from cherrytree_agent.contracts.models import AdvisorBtwTurn, AdvisorReplyTurn, AdvisorState
from cherrytree_agent.firebase import advisor_state_ref, project_ref, read


async def read_transcript(db: AsyncClient, project_id: str) -> str:
    state = await read(advisor_state_ref(db, project_id), AdvisorState)
    if state is None:
        return "The interview has not started yet."
    followups = {f.id: f.text for screen in state.screens for f in screen.followups}
    lines: list[str] = [f"Advisor asked: {state.screens[0].question}"]
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
        followup = turn.message.followup_id
        asked = followups.get(followup) if followup else turn.message.question
        if asked:
            lines.append(f"Advisor asked: {asked}")
    checklist = render_checklist(state.sections)
    return "\n\n".join(lines) + f"\n\n<checklist>\n{checklist}\n</checklist>"

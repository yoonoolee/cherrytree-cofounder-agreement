"""`read_project`: read-only access to the current project's data, for every agent."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

from cherrytree_agent.advisor.transcript import read_transcript
from cherrytree_agent.advisor.working_state import render_question_list
from cherrytree_agent.contracts.models import AdvisorState, Draft
from cherrytree_agent.draft.working import render_draft
from cherrytree_agent.firebase import advisor_state_ref, draft_ref, read
from cherrytree_agent.tools.context import ToolContext


class ReadProjectInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    part: Literal["question_list", "transcript", "draft"]


READ_PROJECT_DESCRIPTION = """\
Read the current project's data: the question list, the interview transcript (every reply and \
btw with the Advisor's response, then the question list), or the draft (one line per paragraph, \
with its id). During the interview, the question list includes this turn's changes."""


async def _question_list(context: ToolContext) -> str:
    if context.advisor is not None:
        return render_question_list(context.advisor.sections)
    state = await read(advisor_state_ref(context.db, context.project_id), AdvisorState)
    return render_question_list(state.sections) if state else "The interview has not started yet."


async def _draft(context: ToolContext) -> str:
    if context.draft is not None:
        return render_draft(context.draft.blocks)
    draft = await read(draft_ref(context.db, context.project_id), Draft)
    return render_draft(draft.content) if draft else "There is no draft yet."


async def read_project(context: ToolContext, request: ReadProjectInput) -> str:
    if request.part == "transcript":
        return await read_transcript(context.db, context.project_id)
    if request.part == "draft":
        return await _draft(context)
    return await _question_list(context)

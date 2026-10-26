"""`read_project`: read-only access to the current project's data, for every agent."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

from cherrytree_agent.advisor.transcript import read_transcript
from cherrytree_agent.advisor.working_state import (
    AdvisorWorkingState,
    render_question_list,
    render_section_summaries,
)
from cherrytree_agent.contracts.models import AdvisorState, Draft
from cherrytree_agent.draft.working import render_draft
from cherrytree_agent.firebase import advisor_state_ref, draft_ref, read
from cherrytree_agent.tools.context import ToolContext


class ReadProjectInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    part: Literal["question_list", "section_summaries", "transcript", "draft"]


READ_PROJECT_DESCRIPTION = """\
Read the current project's data: the question list, the section summaries, the interview \
transcript (each user reply with the response to it), or the draft (one line per paragraph, with \
its id). During the interview, the question list and summaries include this turn's changes."""


async def _advisor_state(context: ToolContext) -> AdvisorWorkingState | None:
    if context.advisor is not None:
        return context.advisor
    state = await read(advisor_state_ref(context.db, context.project_id), AdvisorState)
    return AdvisorWorkingState(state) if state else None


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
    state = await _advisor_state(context)
    if state is None:
        return "The interview has not started yet."
    if request.part == "question_list":
        return render_question_list(state)
    return render_section_summaries(state)

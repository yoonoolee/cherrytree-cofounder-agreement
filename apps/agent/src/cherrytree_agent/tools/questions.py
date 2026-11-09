"""Advisor tools: the green highlights and the question list. Both are refused in a btw."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from cherrytree_agent.advisor.working_state import (
    AdvisorWorkingState,
    QuestionListError,
    render_question_list,
)
from cherrytree_agent.tools.context import ToolContext, ToolError


def _advisor_state(context: ToolContext) -> AdvisorWorkingState:
    if context.advisor is None:
        raise ToolError("The question list is only available during the Advisor interview.")
    return context.advisor


class AddGreenHighlightsInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    quotes: list[str] = Field(
        description="Parts of the user's latest reply that carry facts, each quoted exactly as "
        "written, character for character, and long enough to appear only once."
    )


ADD_GREEN_HIGHLIGHTS_DESCRIPTION = """\
Highlight the facts in the user's latest reply: names, dates, numbers, roles, decisions, \
concerns. The user sees each highlight as you write it. A quote that is not in the reply, or \
appears more than once, is not added; the result says which, so you can quote it again."""


async def add_green_highlights(context: ToolContext, request: AddGreenHighlightsInput) -> str:
    state = _advisor_state(context)
    before = len(state.green_highlights)
    rejected: list[str] = []
    for quote in request.quotes:
        try:
            state.add_green_highlight(quote)
        except QuestionListError as error:
            rejected.append(str(error))
    added = len(state.green_highlights) - before
    if added == 0 and rejected:
        raise ToolError("Nothing was added. " + " ".join(rejected))
    return " ".join([f"Added {added}.", *(f"Not added: {reason}" for reason in rejected)])


class QuestionListUpdate(BaseModel):
    """One change. Every field is present; those that don't apply to the `op` are null."""

    model_config = ConfigDict(extra="forbid")

    op: Literal["add", "status"]
    id: str = Field(
        description="add: a new unique id (lowercase letters, digits, underscores). status: the "
        "id of the main question or follow-up to change."
    )
    under: str | None = Field(
        description="add: a section id for a new main question, or the id of the main question "
        "on screen for a follow-up."
    )
    highlight: str | None = Field(
        description="add, follow-up: the part of a reply on this screen it asks about, quoted "
        "exactly and long enough to appear only once. Several follow-ups can quote the same part."
    )
    text: str | None = Field(description="add: the question, as the user will see it.")
    description: str | None = Field(
        description="add, main question: what a complete answer covers."
    )
    status: Literal["todo", "done", "skipped"] | None = Field(
        description="status: the new status. The question you ask next is made current by your "
        "message, not here."
    )
    note: str | None = Field(
        description="status, main question: your note on it, such as why it was skipped. null "
        "keeps the current note."
    )


class UpdateQuestionListInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    updates: list[QuestionListUpdate]


UPDATE_QUESTION_LIST_DESCRIPTION = """\
Change the question list: add main questions and follow-ups, and mark them done, skipped or \
todo, with notes on main questions. Changes apply in order, so a later one can refer to an id an \
earlier one added. A follow-up's highlight shows to the user as you write it. Returns the updated \
list. If any change is invalid, none are applied and the result says why."""


def _apply(state: AdvisorWorkingState, update: QuestionListUpdate) -> None:
    if update.op == "status":
        if update.status is None:
            raise QuestionListError("A status change needs a status.")
        state.set_status(update.id, update.status, update.note)
        return
    if update.under is None or not update.text:
        raise QuestionListError("An addition needs under and text.")
    if update.highlight is not None:
        state.add_followup(update.id, update.under, update.text, update.highlight)
    elif update.description:
        state.add_question(update.id, update.under, update.text, update.description)
    else:
        raise QuestionListError(
            "An addition needs a highlight (a follow-up) or a description (a main question)."
        )


async def update_question_list(context: ToolContext, request: UpdateQuestionListInput) -> str:
    state = _advisor_state(context)
    before = state.snapshot()
    for number, update in enumerate(request.updates, start=1):
        try:
            _apply(state, update)
        except QuestionListError as error:
            state.restore(before)
            message = f"Change {number} ({update.id}): {error} Nothing was applied."
            raise ToolError(message) from error
    return render_question_list(state.sections)

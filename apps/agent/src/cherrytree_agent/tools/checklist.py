"""Advisor tools: the green highlights and the checklist. Both are refused in a btw."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from cherrytree_agent.advisor.working_state import (
    AdvisorWorkingState,
    ChecklistError,
)
from cherrytree_agent.tools.context import ToolContext, ToolError


def _advisor_state(context: ToolContext) -> AdvisorWorkingState:
    if context.advisor is None:
        raise ToolError("The checklist is only available during the Advisor interview.")
    return context.advisor


class AddGreenHighlightsInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    quotes: list[str] = Field(
        description="The words that carry each settled fact, quoted exactly, without the words "
        "around them. Add words only if a quote appears more than once."
    )


ADD_GREEN_HIGHLIGHTS_DESCRIPTION = """\
Highlight settled facts in the user's latest reply. A quote that is not in the reply, or appears \
more than once, is not added; the result says which, so you can quote it again."""


async def add_green_highlights(context: ToolContext, request: AddGreenHighlightsInput) -> str:
    state = _advisor_state(context)
    before = len(state.green_highlights)
    rejected: list[str] = []
    for quote in request.quotes:
        try:
            state.add_green_highlight(quote)
        except ChecklistError as error:
            rejected.append(str(error))
    added = len(state.green_highlights) - before
    if added == 0 and rejected:
        raise ToolError("Nothing was added. " + " ".join(rejected))
    return " ".join([f"Added {added}.", *(f"Not added: {reason}" for reason in rejected)])


class ChecklistUpdate(BaseModel):
    """One change. Every field is present; those that don't apply to the `op` are null."""

    model_config = ConfigDict(extra="forbid")

    op: Literal["add_item", "add_followup", "status"]
    id: str = Field(
        description="add_item, add_followup: a new unique id (lowercase letters, digits, "
        "underscores). status: the id of a checklist item, or of a follow-up on this screen."
    )
    section: str | None = Field(description="add_item: the section id.")
    text: str | None = Field(
        description="add_item: what to learn. add_followup: the question, as the user will see it."
    )
    highlight: str | None = Field(
        description="add_followup: the words in a reply on this screen it asks about, as few as "
        "make the point, quoted exactly. Add words only if the quote appears more than once. "
        "Several follow-ups can quote the same words. null when it asks about something the "
        "replies don't cover."
    )
    status: Literal["todo", "revisit", "done", "skipped"] | None = Field(
        description="status: the new status. revisit: the user doesn't know yet."
    )
    answer: str | None = Field(
        description="status, checklist item: what was settled, what is still open (revisit), or "
        "why it was skipped. null keeps the current answer."
    )


class UpdateChecklistInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    updates: list[ChecklistUpdate]


UPDATE_CHECKLIST_DESCRIPTION = """\
Change the checklist and this screen's follow-ups: add items or follow-ups, or set their status. \
Changes apply in order, so a later one can use an id an earlier one added. If any change is \
invalid, none apply and the result says why."""


def _apply(state: AdvisorWorkingState, update: ChecklistUpdate) -> None:
    if update.op == "status":
        if update.status is None:
            raise ChecklistError("A status change needs a status.")
        state.set_status(update.id, update.status, update.answer)
    elif update.op == "add_item":
        if update.section is None or not update.text:
            raise ChecklistError("add_item needs section and text.")
        state.add_item(update.id, update.section, update.text)
    else:
        if not update.text:
            raise ChecklistError("add_followup needs text.")
        state.add_followup(update.id, update.text, update.highlight)


async def update_checklist(context: ToolContext, request: UpdateChecklistInput) -> str:
    state = _advisor_state(context)
    before = state.snapshot()
    for number, update in enumerate(request.updates, start=1):
        try:
            _apply(state, update)
        except ChecklistError as error:
            state.restore(before)
            message = f"Change {number} ({update.id}): {error} Nothing was applied."
            raise ToolError(message) from error
    return f"Applied {len(request.updates)} changes."

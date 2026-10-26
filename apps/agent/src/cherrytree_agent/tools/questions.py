"""Advisor tools for the question list and the section summaries."""

from pydantic import BaseModel, ConfigDict, Field

from cherrytree_agent.advisor.working_state import (
    AdvisorWorkingState,
    QuestionListError,
    render_question_list,
)
from cherrytree_agent.contracts.models import QuestionStatus
from cherrytree_agent.tools.context import ToolContext, ToolError


def _advisor_state(context: ToolContext) -> AdvisorWorkingState:
    if context.advisor is None:
        raise ToolError("The question list is only available during the Advisor interview.")
    return context.advisor


class QuestionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question_id: str
    status: QuestionStatus
    advisor_notes: str | None = Field(
        description="Your notes on the question, such as why it was skipped. null keeps the "
        "current notes."
    )


class QuestionAddition(BaseModel):
    model_config = ConfigDict(extra="forbid")

    section_id: str
    after_question_id: str | None = Field(
        description="Insert after this question in the section; null appends to the section."
    )
    text: str = Field(description="The main question, as the user will see it.")
    description: str = Field(description="What a complete answer covers.")


class UpdateQuestionsInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    additions: list[QuestionAddition]
    updates: list[QuestionUpdate]


UPDATE_QUESTIONS_DESCRIPTION = """\
Change the question list: add main questions, mark questions current, done or skipped, and keep \
notes on them. Additions are applied first and their new ids are returned, so a later call can \
mark one current. Exactly one question is current at a time: when you move on, mark the \
finished question done (or skipped) and the next one current in the same call. Follow-up \
questions are not added here; they stay on the current question's screen. Returns the updated \
list. If any change is invalid, nothing is applied."""


async def update_questions(context: ToolContext, changes: UpdateQuestionsInput) -> str:
    state = _advisor_state(context)
    before = state.snapshot()
    try:
        added = [
            state.add_question(a.section_id, a.after_question_id, a.text, a.description)
            for a in changes.additions
        ]
        for update in changes.updates:
            state.update_question(update.question_id, update.status, update.advisor_notes)
        state.check()
    except QuestionListError as error:
        state.restore(before)
        raise ToolError(str(error)) from error

    added_note = f"Added question ids: {', '.join(added)}\n\n" if added else ""
    return f"{added_note}{render_question_list(state)}"


class WriteSectionSummaryInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    section_id: str
    summary: str = Field(description="The section summary, in markdown.")


WRITE_SECTION_SUMMARY_DESCRIPTION = """\
Write the summary of a finished section, before starting the next one, or rewrite an earlier \
section's summary when a later answer corrects it. The Drafting, Review and Editing agents work \
from these summaries, so:
- List every fact the user shared in the section, as markdown bullets. Keep every fact, even \
ones that seem minor; relevance is decided when drafting.
- Keep exact values as given: percentages, dates, amounts, vesting schedules, names.
- Name the cofounder each fact is about, where it is about one of them.
- Record only what the user said. Never fill gaps with assumptions; note what is still open.
Replaces any earlier summary of the section."""


async def write_section_summary(context: ToolContext, summary: WriteSectionSummaryInput) -> str:
    state = _advisor_state(context)
    try:
        state.set_section_summary(summary.section_id, summary.summary)
    except QuestionListError as error:
        raise ToolError(str(error)) from error
    return f"Saved the summary of section {summary.section_id}."

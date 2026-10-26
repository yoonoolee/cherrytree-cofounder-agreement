from datetime import UTC, datetime

import pytest

from cherrytree_agent.advisor.session import initial_state
from cherrytree_agent.advisor.working_state import (
    AdvisorWorkingState,
    render_question_list,
    screen_question,
)
from cherrytree_agent.contracts.models import AdvisorQuestion, AdvisorState
from cherrytree_agent.tools.context import ToolContext, ToolError
from cherrytree_agent.tools.questions import (
    QuestionAddition,
    QuestionUpdate,
    UpdateQuestionsInput,
    WriteSectionSummaryInput,
    update_questions,
    write_section_summary,
)


def working_state() -> AdvisorWorkingState:
    return AdvisorWorkingState(initial_state())


def context(state: AdvisorWorkingState) -> ToolContext:
    return ToolContext(db=None, project_id="org_1", advisor=state)  # type: ignore[arg-type]


def statuses(state: AdvisorWorkingState) -> dict[str, str]:
    return {q.id: q.status for s in state.sections for q in s.questions}


def test_initial_state_makes_the_first_question_current() -> None:
    state = initial_state()
    assert isinstance(state, AdvisorState)
    current = [q.id for s in state.sections for q in s.questions if q.status == "current"]
    assert current == [state.sections[0].questions[0].id]
    assert state.turn_count == 0
    assert all(q.source == "initial" for s in state.sections for q in s.questions)


async def test_moves_to_the_next_question_and_keeps_notes() -> None:
    state = working_state()
    first, second = (q.id for q in state.sections[0].questions[:2])
    await update_questions(
        context(state),
        UpdateQuestionsInput(
            additions=[],
            updates=[
                QuestionUpdate(question_id=first, status="done", advisor_notes="Met in 2011."),
                QuestionUpdate(question_id=second, status="current", advisor_notes=None),
            ],
        ),
    )
    assert statuses(state)[first] == "done"
    assert statuses(state)[second] == "current"
    assert state.sections[0].questions[0].advisor_notes == "Met in 2011."

    # null keeps existing notes
    await update_questions(
        context(state),
        UpdateQuestionsInput(
            additions=[],
            updates=[QuestionUpdate(question_id=first, status="done", advisor_notes=None)],
        ),
    )
    assert state.sections[0].questions[0].advisor_notes == "Met in 2011."


async def test_adds_a_question_where_asked_and_returns_its_id() -> None:
    state = working_state()
    section = state.sections[1]
    result = await update_questions(
        context(state),
        UpdateQuestionsInput(
            additions=[
                QuestionAddition(
                    section_id=section.id,
                    after_question_id=section.questions[0].id,
                    text="Do you want an IP assignment?",
                    description="Who owns pre-company work.",
                )
            ],
            updates=[],
        ),
    )
    added = section.questions[1]
    assert added.source == "added_by_agent"
    assert added.status == "todo"
    assert f"Added question ids: {added.id}" in result


@pytest.mark.parametrize(
    "changes",
    [
        UpdateQuestionsInput(
            additions=[],
            updates=[
                QuestionUpdate(question_id="equity_split", status="current", advisor_notes=None)
            ],
        ),
        UpdateQuestionsInput(
            additions=[],
            updates=[QuestionUpdate(question_id="nope", status="done", advisor_notes=None)],
        ),
        UpdateQuestionsInput(
            additions=[
                QuestionAddition(
                    section_id="equity", after_question_id=None, text="T", description="D"
                ),
                QuestionAddition(
                    section_id="nope", after_question_id=None, text="T", description="D"
                ),
            ],
            updates=[],
        ),
    ],
    ids=["two current questions", "unknown question", "unknown section"],
)
async def test_an_invalid_change_applies_nothing(changes: UpdateQuestionsInput) -> None:
    state = working_state()
    before = state.snapshot()
    with pytest.raises(ToolError):
        await update_questions(context(state), changes)
    assert state.sections == before.sections


async def test_writes_and_rewrites_section_summaries() -> None:
    state = working_state()
    await write_section_summary(
        context(state), WriteSectionSummaryInput(section_id="background", summary="- Met in 2011")
    )
    await write_section_summary(
        context(state), WriteSectionSummaryInput(section_id="background", summary="- Met in 2012")
    )
    assert state.section_summaries == {"background": "- Met in 2012"}
    with pytest.raises(ToolError):
        await write_section_summary(
            context(state), WriteSectionSummaryInput(section_id="nope", summary="x")
        )


def test_question_list_details_only_the_current_section() -> None:
    state = AdvisorWorkingState(
        AdvisorState.model_validate(
            {
                **initial_state().model_dump(by_alias=True),
                "sectionSummaries": {"background": "- Met in 2011"},
                "updatedAt": datetime(2026, 1, 1, tzinfo=UTC),
            }
        )
    )
    rendered = render_question_list(state)
    background, equity = rendered.split("Section 2:")
    assert "(current section) · summary written" in background
    assert "Description:" in background
    assert "Description:" not in equity
    assert "[current]" in background


# ---------------------------------------------------------------------------
# The response's question agrees with the question list
# ---------------------------------------------------------------------------


def moved(before: AdvisorWorkingState, *, to: str) -> AdvisorWorkingState:
    after = before.snapshot()
    for section in after.sections:
        for question in section.questions:
            if question.status == "current":
                question.status = "done"
            if question.id == to:
                question.status = "current"
    return after


def ask(kind: str, text: str = "Anything else?") -> AdvisorQuestion:
    return AdvisorQuestion.model_validate({"type": kind, "text": text})


def test_a_followup_that_moved_the_current_question_opens_its_screen() -> None:
    before = working_state()
    after = moved(before, to="background_idea")
    assert screen_question(before, after, ask("followup", "Who wrote the first code?")) == ask(
        "next_question", "Whose idea was the company, and what work happened before you teamed up?"
    )


def test_moving_into_another_section_is_next_section_in_the_lists_words() -> None:
    before = working_state()
    after = moved(before, to="roles_titles")
    assert screen_question(before, after, ask("next_question", "So, roles?")) == ask(
        "next_section", "What will each of you be responsible for?"
    )


def test_a_next_question_that_did_not_move_stays_on_the_screen() -> None:
    before = working_state()
    after = before.snapshot()
    assert screen_question(before, after, ask("next_question", "And then?")) == ask(
        "followup", "And then?"
    )
    assert screen_question(before, after, ask("followup")) == ask("followup")


def test_once_no_question_is_current_the_interview_is_over() -> None:
    before = working_state()
    after = moved(before, to="none")
    assert screen_question(before, after, ask("followup")) is None

from typing import Any

import pytest

from cherrytree_agent.advisor.session import initial_state
from cherrytree_agent.advisor.working_state import (
    AdvisorWorkingState,
    MessageError,
    RunKind,
    render_question_list,
)
from cherrytree_agent.contracts.models import AdvisorMessage, AdvisorState, Highlight
from cherrytree_agent.tools.context import ToolContext, ToolError
from cherrytree_agent.tools.questions import (
    AddGreenHighlightsInput,
    UpdateQuestionListInput,
    add_green_highlights,
    update_question_list,
)
from tests.helpers import followup_update, status_update

REPLY = "we met at a park in middle school. we talked about starting something for years"


def working_state(
    kind: RunKind = "turn", replies: dict[int, str] | None = None
) -> AdvisorWorkingState:
    return AdvisorWorkingState.start(
        initial_state(),
        kind=kind,
        index=2,
        screen="background_meet",
        replies={2: REPLY} if replies is None else replies,
    )


def context(state: AdvisorWorkingState) -> ToolContext:
    return ToolContext(db=None, project_id="org_1", advisor=state)  # type: ignore[arg-type]


def updates(*items: dict[str, Any]) -> UpdateQuestionListInput:
    return UpdateQuestionListInput.model_validate({"updates": list(items)})


def statuses(state: AdvisorWorkingState) -> dict[str, str]:
    return {q.id: q.status for s in state.sections for q in s.questions}


def message(question_id: str | None, type: str = "followup") -> AdvisorMessage:
    return AdvisorMessage(type=type, question_id=question_id, answer=None, sources=[])  # type: ignore[arg-type]


def test_initial_state_makes_the_first_question_current() -> None:
    state = initial_state()
    assert isinstance(state, AdvisorState)
    current = [q.id for s in state.sections for q in s.questions if q.status == "current"]
    assert current == [state.sections[0].questions[0].id]
    assert state.turn_count == 0
    assert all(
        q.source == "initial" and q.followups == [] for s in state.sections for q in s.questions
    )


# ---------------------------------------------------------------------------
# add_green_highlights
# ---------------------------------------------------------------------------


async def test_green_highlights_store_positions_and_report_bad_quotes() -> None:
    state = working_state(replies={2: "we met at a park. a park near home"})
    result = await add_green_highlights(
        context(state),
        AddGreenHighlightsInput(quotes=["we met", "a park", "on a boat", "we met"]),
    )
    assert state.green_highlights == [Highlight(text="we met", start=0, end=6)]
    assert "Added 1." in result
    assert '"a park" appears 2 times' in result
    assert '"on a boat" is not in the reply' in result


async def test_green_highlights_are_refused_in_a_btw() -> None:
    state = working_state(kind="btw", replies={})
    with pytest.raises(ToolError, match="btw"):
        await add_green_highlights(context(state), AddGreenHighlightsInput(quotes=["we met"]))


# ---------------------------------------------------------------------------
# update_question_list
# ---------------------------------------------------------------------------


async def test_adds_follow_ups_on_one_highlight_and_finds_it_in_any_reply_on_screen() -> None:
    state = working_state(replies={0: "It was my idea.", 2: REPLY})
    await update_question_list(
        context(state),
        updates(
            followup_update("f_idea", "background_meet", "talked about starting something"),
            followup_update("f_when", "background_meet", "talked about starting something"),
            followup_update("f_mine", "background_meet", "my idea"),
        ),
    )
    followups = state.sections[0].questions[0].followups
    assert [f.id for f in followups] == ["f_idea", "f_when", "f_mine"]
    assert followups[0].highlight == followups[1].highlight
    assert followups[0].highlight.model_dump() == {
        "turn": 2,
        "text": "talked about starting something",
        "start": 38,
        "end": 69,
    }
    assert followups[2].highlight.turn == 0
    assert all(f.status == "todo" for f in followups)


async def test_adds_a_main_question_and_keeps_notes() -> None:
    state = working_state()
    result = await update_question_list(
        context(state),
        updates(
            {
                **followup_update("ip_prior", "roles", "unused"),
                "highlight": None,
                "description": "Who owns work from before the company.",
            },
            status_update("background_idea", "skipped", "Covered on the first screen."),
        ),
    )
    added = state.sections[1].questions[-1]
    assert (added.id, added.source, added.status) == ("ip_prior", "added_by_agent", "todo")
    idea = state.sections[0].questions[1]
    assert (idea.status, idea.advisor_notes) == ("skipped", "Covered on the first screen.")
    assert "[id: ip_prior]" in result


@pytest.mark.parametrize(
    "change",
    [
        followup_update("f_x", "background_meet", "not in any reply"),
        followup_update("f_x", "background_meet", "we"),
        followup_update("f_x", "roles_titles", "middle school"),
        followup_update("background_idea", "background_meet", "middle school"),
        followup_update("Bad Id", "background_meet", "middle school"),
        status_update("nope", "done"),
    ],
    ids=[
        "quote not found",
        "quote twice",
        "not the screen",
        "id in use",
        "invalid id",
        "unknown id",
    ],
)
async def test_an_invalid_change_applies_nothing(change: dict[str, Any]) -> None:
    state = working_state()
    before = state.snapshot()
    with pytest.raises(ToolError, match="Nothing was applied"):
        await update_question_list(
            context(state),
            updates(followup_update("f_ok", "background_meet", "middle school"), change),
        )
    assert state.sections == before.sections


async def test_the_question_list_is_refused_in_a_btw() -> None:
    state = working_state(kind="btw", replies={})
    with pytest.raises(ToolError, match="btw"):
        await update_question_list(
            context(state), updates(status_update("background_idea", "done"))
        )


def test_the_question_list_shows_every_question_in_full() -> None:
    state = working_state()
    state.add_followup("f_idea", "background_meet", "Whose idea was it?", "middle school")
    rendered = render_question_list(state.sections)
    assert rendered.count("Description:") == sum(len(s.questions) for s in state.sections)
    assert 'Follow-up [todo] Whose idea was it? [id: f_idea] on "middle school"' in rendered


# ---------------------------------------------------------------------------
# The message decides what is current
# ---------------------------------------------------------------------------


def test_a_follow_up_message_makes_it_current() -> None:
    state = working_state()
    state.add_followup("f_a", "background_meet", "A?", "middle school")
    state.add_followup("f_b", "background_meet", "B?", "a park")
    assert state.apply_message(message("f_a")).type == "followup"
    assert state.apply_message(message("f_b")).type == "followup"
    statuses_ = {f.id: f.status for f in state.sections[0].questions[0].followups}
    assert statuses_ == {"f_a": "todo", "f_b": "current"}


def test_moving_on_closes_the_screen_and_sets_the_type_from_the_list() -> None:
    state = working_state()
    state.add_followup("f_a", "background_meet", "A?", "middle school")

    saved = state.apply_message(message("background_idea", type="followup"))

    assert saved.type == "next_question"
    assert statuses(state)["background_meet"] == "done"
    assert statuses(state)["background_idea"] == "current"
    assert state.sections[0].questions[0].followups[0].status == "skipped"


def test_moving_into_another_section_is_next_section() -> None:
    state = working_state()
    state.set_status("background_meet", "skipped", "Not relevant.")
    assert state.apply_message(message("roles_titles", type="next_question")).type == "next_section"
    assert statuses(state)["background_meet"] == "skipped"


@pytest.mark.parametrize(
    ("question_id", "type", "error"),
    [
        ("nope", "followup", "Unknown id"),
        ("background_meet", "next_question", "already on screen"),
        (None, "followup", "null only"),
        (None, "interview_complete", "not complete"),
    ],
)
def test_a_message_that_does_not_fit_is_rejected(
    question_id: str | None, type: str, error: str
) -> None:
    state = working_state()
    with pytest.raises(MessageError, match=error):
        state.apply_message(message(question_id, type=type))


def test_the_interview_completes_once_every_question_is_settled() -> None:
    state = working_state()
    for section in state.sections:
        for question in section.questions:
            if question.id != "background_meet":
                question.status = "done"
    saved = state.apply_message(message(None, type="interview_complete"))
    assert saved.type == "interview_complete"
    assert all(status == "done" for status in statuses(state).values())

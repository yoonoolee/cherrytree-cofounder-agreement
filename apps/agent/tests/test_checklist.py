from datetime import UTC, datetime
from typing import Any

import pytest

from cherrytree_agent.advisor.interview import INTERVIEW, initial_state, render_guides
from cherrytree_agent.advisor.working_state import (
    AdvisorWorkingState,
    MessageError,
    RunKind,
    render_checklist,
    render_screen,
)
from cherrytree_agent.contracts.models import (
    AdvisorMessage,
    AdvisorState,
    ChecklistItem,
    ChecklistSection,
    Highlight,
    Screen,
)
from cherrytree_agent.tools.checklist import (
    AddGreenHighlightsInput,
    UpdateChecklistInput,
    add_green_highlights,
    update_checklist,
)
from cherrytree_agent.tools.context import ToolContext, ToolError
from tests.helpers import followup_update, item_update, status_update

REPLY = "we met at a park in middle school. we talked about starting something for years"


def item(item_id: str) -> ChecklistItem:
    return ChecklistItem(id=item_id, item=item_id, status="todo", source="initial", answer=None)


def two_sections() -> AdvisorState:
    """A small interview, independent of the content file: two sections, on the first screen."""
    return AdvisorState(
        sections=[
            ChecklistSection(
                id="company", name="The company", checklist=[item("c_1"), item("c_2")]
            ),
            ChecklistSection(id="people", name="The cofounders", checklist=[item("p_1")]),
        ],
        screens=[Screen(id="screen_1", section="company", question="What?", followups=[])],
        complete=False,
        turn_count=2,
        updated_at=datetime(2026, 1, 1, tzinfo=UTC),
    )


def working_state(
    kind: RunKind = "turn", replies: dict[int, str] | None = None
) -> AdvisorWorkingState:
    return AdvisorWorkingState.start(
        two_sections(), kind=kind, index=2, replies={2: REPLY} if replies is None else replies
    )


def context(state: AdvisorWorkingState) -> ToolContext:
    return ToolContext(db=None, project_id="org_1", advisor=state)  # type: ignore[arg-type]


def updates(*items: dict[str, Any]) -> UpdateChecklistInput:
    return UpdateChecklistInput.model_validate({"updates": list(items)})


def statuses(state: AdvisorWorkingState) -> dict[str, str]:
    return {i.id: i.status for s in state.sections for i in s.checklist}


def message(
    type: str,
    *,
    followup_id: str | None = None,
    question: str | None = None,
    context: str | None = None,
) -> AdvisorMessage:
    return AdvisorMessage(
        type=type,  # type: ignore[arg-type]
        question=question,
        context=context,
        followup_id=followup_id,
        answer=None,
        sources=[],
    )


# ---------------------------------------------------------------------------
# The interview content
# ---------------------------------------------------------------------------


def test_initial_state_has_every_item_to_do_and_the_opener_on_screen() -> None:
    state = initial_state()
    first = INTERVIEW.sections[0]
    assert [i.id for i in state.sections[0].checklist][:2] == [f"{first.id}_1", f"{first.id}_2"]
    assert all(
        (i.status, i.source, i.answer) == ("todo", "initial", None)
        for s in state.sections
        for i in s.checklist
    )
    assert [(s.section, s.question) for s in state.screens] == [(first.id, INTERVIEW.opener)]
    assert (state.complete, state.turn_count) == (False, 0)


def test_the_guides_name_every_section_and_each_item_note() -> None:
    guides = render_guides()
    for section in INTERVIEW.sections:
        assert section.guide in guides
        for entry in section.checklist:
            if entry.notes:
                assert f"- {entry.item}: {entry.notes}" in guides


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
# update_checklist
# ---------------------------------------------------------------------------


async def test_adds_follow_ups_on_one_highlight_and_finds_it_in_any_reply_on_screen() -> None:
    state = working_state(replies={0: "It was my idea.", 2: REPLY})
    await update_checklist(
        context(state),
        updates(
            followup_update("f_idea", "talked about starting something"),
            followup_update("f_when", "talked about starting something"),
            followup_update("f_mine", "my idea"),
        ),
    )
    idea, when, mine = state.screen.followups
    assert [f.id for f in (idea, when, mine)] == ["f_idea", "f_when", "f_mine"]
    assert idea.highlight == when.highlight
    assert idea.highlight is not None and idea.highlight.model_dump() == {
        "turn": 2,
        "text": "talked about starting something",
        "start": 38,
        "end": 69,
    }
    assert mine.highlight is not None and mine.highlight.turn == 0
    assert all(f.status == "todo" for f in (idea, when, mine))


async def test_adds_a_follow_up_on_what_the_replies_dont_cover_without_a_highlight() -> None:
    state = working_state()
    await update_checklist(
        context(state),
        updates(
            followup_update("f_park", "a park", "Which park?"),
            followup_update(
                "f_address",
                None,
                "What mailing address should go on notices?",
                context="Notices under the agreement go here.",
            ),
        ),
    )
    address = state.screen.followups[1]
    assert (address.highlight, address.context) == (None, "Notices under the agreement go here.")
    assert render_screen(state.screen).splitlines()[2:] == [
        'Follow-up [todo] Which park? [id: f_park] on "a park"',
        "Follow-up [todo] What mailing address should go on notices? [id: f_address]",
        "  Context: Notices under the agreement go here.",
    ]


async def test_adds_items_and_marks_them_with_answers() -> None:
    state = working_state()
    result = await update_checklist(
        context(state),
        updates(
            item_update("ip_prior", "people", "Who owns work from before the company"),
            status_update("c_1", "done", "Acme, AI scheduling for dentists."),
            status_update("c_2", "skipped", "Not incorporated yet."),
        ),
    )
    added = state.sections[1].checklist[-1]
    assert (added.id, added.source, added.status) == ("ip_prior", "added_by_agent", "todo")
    done = state.sections[0].checklist[0]
    assert (done.status, done.answer) == ("done", "Acme, AI scheduling for dentists.")
    assert result == "Applied 3 changes."


async def test_a_follow_up_status_takes_no_answer() -> None:
    state = working_state()
    with pytest.raises(ToolError, match="Answers and revisit are for checklist items"):
        await update_checklist(
            context(state),
            updates(followup_update("f_a", "middle school"), status_update("f_a", "done", "x")),
        )


@pytest.mark.parametrize(
    "change",
    [
        followup_update("f_x", "not in any reply"),
        followup_update("f_x", "we"),
        followup_update("c_2", "middle school"),
        followup_update("Bad Id", "middle school"),
        item_update("x_1", "nope", "Something"),
        status_update("nope", "done"),
    ],
    ids=[
        "quote not found",
        "quote twice",
        "id in use",
        "invalid id",
        "unknown section",
        "unknown id",
    ],
)
async def test_an_invalid_change_applies_nothing(change: dict[str, Any]) -> None:
    state = working_state()
    before = state.snapshot()
    with pytest.raises(ToolError, match="Nothing was applied"):
        await update_checklist(
            context(state), updates(followup_update("f_ok", "middle school"), change)
        )
    assert (state.sections, state.screens) == (before.sections, before.screens)


async def test_the_checklist_is_refused_in_a_btw() -> None:
    state = working_state(kind="btw", replies={})
    with pytest.raises(ToolError, match="btw"):
        await update_checklist(context(state), updates(status_update("c_1", "done")))


def test_the_checklist_shows_every_item_with_its_answer() -> None:
    state = working_state()
    state.set_status("c_1", "done", "Acme")
    rendered = render_checklist(state.sections)
    assert "  [done] c_1 [id: c_1]\n      Answer: Acme" in rendered
    assert "Section 2: The cofounders [id: people]" in rendered


# ---------------------------------------------------------------------------
# The message
# ---------------------------------------------------------------------------


def test_a_follow_up_message_makes_it_current() -> None:
    state = working_state()
    state.add_followup("f_a", "A?", "middle school")
    state.add_followup("f_b", "B?", "a park")
    state.apply_message(message("followup", followup_id="f_a"))
    saved = state.apply_message(message("followup", followup_id="f_b", question="ignored"))
    assert saved.question is None
    assert {f.id: f.status for f in state.screen.followups} == {"f_a": "todo", "f_b": "current"}


def test_follow_ups_on_highlights_are_asked_before_the_others() -> None:
    state = working_state()
    state.add_followup("f_gap", "Where is the office?", None)
    state.add_followup("f_park", "Which park?", "a park")

    with pytest.raises(MessageError, match="highlights first: f_park"):
        state.apply_message(message("followup", followup_id="f_gap"))

    state.set_status("f_park", "done", None)
    state.apply_message(message("followup", followup_id="f_gap"))
    assert state.screen.followups[0].status == "current"


def test_a_new_question_opens_a_screen_in_this_section_and_closes_the_last() -> None:
    state = working_state()
    state.add_followup("f_a", "A?", "middle school")

    saved = state.apply_message(
        message(
            "next_question", question="Who is CEO?", context="It sets who signs.", followup_id="x"
        )
    )

    assert saved.followup_id is None
    first, second = state.screens
    assert first.followups[0].status == "skipped"
    assert (second.id, second.section, second.question, second.context) == (
        "screen_2",
        "company",
        "Who is CEO?",
        "It sets who signs.",
    )


def test_the_next_section_skips_sections_with_nothing_to_do() -> None:
    state = working_state()
    state.set_status("c_1", "done", None)
    state.set_status("c_2", "skipped", None)
    state.sections.insert(1, ChecklistSection(id="empty", name="Covered early", checklist=[]))
    state.apply_message(message("next_section", question="Who are the cofounders?"))
    assert state.screen.section == "people"


@pytest.mark.parametrize(
    ("sent", "error"),
    [
        (message("followup", followup_id="nope"), "not an open follow-up"),
        (message("next_question", question=" "), "needs the question"),
        (message("next_section", question="Next?"), "still has items to do: c_1, c_2"),
        (message("interview_complete"), "not complete: c_1, c_2, p_1"),
    ],
    ids=["unknown follow-up", "no question", "section not done", "items left"],
)
def test_a_message_that_does_not_fit_is_rejected(sent: AdvisorMessage, error: str) -> None:
    state = working_state()
    with pytest.raises(MessageError, match=error):
        state.apply_message(sent)


def test_the_last_section_ends_with_the_interview_not_a_next_section() -> None:
    state = working_state()
    for item_id in ("c_1", "c_2", "p_1"):
        state.set_status(item_id, "done", None)
    with pytest.raises(MessageError, match="end the interview"):
        state.apply_message(message("next_section", question="More?"))


def test_the_interview_completes_once_every_item_is_settled() -> None:
    state = working_state()
    state.add_followup("f_a", "A?", "middle school")
    for item_id in ("c_1", "c_2", "p_1"):
        state.set_status(item_id, "done", None)
    saved = state.apply_message(message("interview_complete", question="x"))
    assert (saved.type, saved.question) == ("interview_complete", None)
    assert state.complete
    assert state.screen.followups[0].status == "skipped"


def test_revisit_items_hold_up_neither_the_next_section_nor_the_end() -> None:
    state = working_state()
    state.set_status("c_1", "done", None)
    state.set_status("c_2", "revisit", "Tentative 60/40; not sure Jordan agrees.")
    state.apply_message(message("next_section", question="Who are the cofounders?"))
    assert state.screen.section == "people"

    state.set_status("p_1", "done", None)
    assert state.apply_message(message("interview_complete")).type == "interview_complete"

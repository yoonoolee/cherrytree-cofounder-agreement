import asyncio
import json
from typing import Any

from cherrytree_agent.advisor.session import initial_state
from cherrytree_agent.advisor.stream import AdvisorStreamParser
from cherrytree_agent.advisor.working_state import AdvisorWorkingState, RunKind
from cherrytree_agent.contracts.models import AdvisorStreamEvent
from tests.helpers import advisor_json, btw_json, followup_update, status_update

REPLY = "we met at a park in middle school, around 15 years ago"


def parser(kind: RunKind = "turn") -> tuple[AdvisorStreamParser, asyncio.Queue[Any]]:
    events: asyncio.Queue[AdvisorStreamEvent | None] = asyncio.Queue()
    state = AdvisorWorkingState.start(
        initial_state(), kind=kind, index=1, screen="background_meet", replies={1: REPLY}
    )
    return AdvisorStreamParser(events, state), events


def drain(events: asyncio.Queue[Any]) -> list[dict[str, Any]]:
    collected: list[dict[str, Any]] = []
    while not events.empty():
        collected.append(events.get_nowait().model_dump(by_alias=True))
    return collected


async def write_text(handler: AdvisorStreamParser, *texts: str, chunk: int = 5) -> None:
    for text in texts:
        await handler.on_message_start()
        for start in range(0, len(text), chunk):
            await handler.on_text(text[start : start + chunk])


async def write_tool(
    handler: AdvisorStreamParser, tool_id: str, name: str, tool_input: dict[str, Any]
) -> None:
    written = json.dumps(tool_input)
    for end in range(3, len(written) + 3, 3):
        await handler.on_tool_input(tool_id, name, written[:end])


async def test_the_answer_streams_as_deltas() -> None:
    handler, events = parser()
    answer = 'Most founders vest over four years with a one-year "cliff".'
    await write_text(handler, advisor_json("f_vest", answer=answer))
    deltas = [e["text"] for e in drain(events)]
    assert len(deltas) > 1
    assert "".join(deltas) == answer


async def test_a_btw_streams_its_text_and_text_from_an_earlier_call_is_dropped() -> None:
    handler, events = parser("btw")
    await write_text(handler, "not json at all", btw_json("Yes, that is common."))
    assert "".join(e["text"] for e in drain(events)) == "Yes, that is common."


async def test_green_highlights_stream_once_each_when_complete_and_found_once() -> None:
    handler, events = parser()
    quotes = ["middle school", "a", "on a boat", "middle school", "around 15 years ago"]
    await write_tool(handler, "t1", "add_green_highlights", {"quotes": quotes})
    assert drain(events) == [
        {"type": "green_highlight", "highlight": {"text": "middle school", "start": 20, "end": 33}},
        {
            "type": "green_highlight",
            "highlight": {"text": "around 15 years ago", "start": 35, "end": 54},
        },
    ]


async def test_red_highlights_stream_and_a_rejected_change_withdraws_them() -> None:
    handler, events = parser()
    change = {
        "updates": [
            status_update("background_idea", "skipped"),
            followup_update("f_park", "background_meet", "at a park"),
            followup_update("f_bad", "roles_titles", "middle school"),
        ]
    }
    await write_tool(handler, "t1", "update_question_list", change)
    assert drain(events) == [
        {
            "type": "red_highlight",
            "followupId": "f_park",
            "highlight": {"turn": 1, "text": "at a park", "start": 7, "end": 16},
        }
    ]

    await handler.on_tool_result("t1", is_error=True)
    assert drain(events) == [{"type": "withdraw_red_highlights", "followupIds": ["f_park"]}]


async def test_a_btw_streams_no_highlights() -> None:
    handler, events = parser("btw")
    await write_tool(handler, "t1", "add_green_highlights", {"quotes": ["middle school"]})
    assert drain(events) == []

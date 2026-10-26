import asyncio

from cherrytree_agent.advisor.stream import AdvisorStreamParser
from cherrytree_agent.contracts.models import AdvisorStreamEvent
from tests.helpers import advisor_json


async def stream(*texts: str, chunk: int = 5) -> list[AdvisorStreamEvent]:
    events: asyncio.Queue[AdvisorStreamEvent | None] = asyncio.Queue()
    parser = AdvisorStreamParser(events)
    for text in texts:
        await parser.on_message_start()
        for start in range(0, len(text), chunk):
            await parser.on_text(text[start : start + chunk])
    collected: list[AdvisorStreamEvent] = []
    while not events.empty():
        event = events.get_nowait()
        assert event is not None
        collected.append(event)
    return collected


async def test_highlights_then_answer_deltas_then_sources() -> None:
    response = advisor_json(
        highlights=["50/50", "four years"],
        answer='Most founders vest over four years with a one-year "cliff".',
        question={"type": "followup", "text": "Is that the same for both of you?"},
    )
    events = await stream(response)

    assert events[0].model_dump() == {"type": "highlights", "highlights": ["50/50", "four years"]}
    deltas = [e.text for e in events if e.type == "answer_delta"]
    assert len(deltas) > 1
    assert "".join(deltas) == 'Most founders vest over four years with a one-year "cliff".'
    assert events[-1].model_dump() == {"type": "sources", "sources": []}
    # The question is held for the saved turn.
    assert all(e.type != "done" for e in events)


async def test_a_null_answer_sends_no_deltas() -> None:
    events = await stream(advisor_json(question={"type": "next_question", "text": "Next?"}))
    assert [e.type for e in events] == ["highlights", "sources"]


async def test_text_from_an_earlier_call_of_the_run_is_dropped() -> None:
    events = await stream("not json at all", advisor_json(answer="Final."))
    assert "".join(e.text for e in events if e.type == "answer_delta") == "Final."

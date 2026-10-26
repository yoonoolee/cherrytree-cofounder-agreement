"""Turns the Advisor's streamed JSON into UI events as it is generated.

The response's properties stream in order (highlights → answer → sources → question), so a
property is complete once the next one has started. The answer streams as deltas; the question is
sent only with the saved turn.
"""

import asyncio

from pydantic_core import from_json

from cherrytree_agent.contracts.models import (
    AdvisorAnswerDeltaEvent,
    AdvisorHighlightsEvent,
    AdvisorSourcesEvent,
    AdvisorStreamEvent,
    WebSource,
)


class AdvisorStreamParser:
    """A `StreamHandler` that puts events on `events` as the response text grows."""

    def __init__(self, events: asyncio.Queue[AdvisorStreamEvent | None]) -> None:
        self.events = events
        self._reset()

    def _reset(self) -> None:
        self._text = ""
        self._highlights_sent = False
        self._answer_sent = ""
        self._sources_sent = False

    async def on_message_start(self) -> None:
        # Only the final call of a run writes the response; text from an earlier call is not it.
        self._reset()

    async def on_text(self, text: str) -> None:
        self._text += text
        try:
            partial = from_json(self._text, allow_partial="trailing-strings")
        except ValueError:
            return
        if not isinstance(partial, dict):
            return

        if not self._highlights_sent and "answer" in partial:
            self._highlights_sent = True
            await self.events.put(
                AdvisorHighlightsEvent(type="highlights", highlights=partial.get("highlights", []))
            )

        answer = partial.get("answer")
        if isinstance(answer, str) and answer.startswith(self._answer_sent):
            delta = answer[len(self._answer_sent) :]
            if delta:
                self._answer_sent = answer
                await self.events.put(AdvisorAnswerDeltaEvent(type="answer_delta", text=delta))

        if not self._sources_sent and "question" in partial:
            self._sources_sent = True
            sources = [WebSource.model_validate(s) for s in partial.get("sources", [])]
            await self.events.put(AdvisorSourcesEvent(type="sources", sources=sources))

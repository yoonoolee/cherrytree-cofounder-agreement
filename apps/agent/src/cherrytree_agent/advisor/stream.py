"""Turns what the Advisor writes into UI events as it is generated.

- Highlights: both highlight tools stream their input (eager input streaming). Each quote is sent
  once it is complete and found once in its reply, checked as the tool will check it. A rejected
  question list change withdraws the red highlights it sent.
- The message: its `answer` (a btw: its `text`) streams as deltas. The rest is sent only with the
  saved turn.
"""

import asyncio
from typing import Any

from pydantic_core import from_json

from cherrytree_agent.advisor.working_state import AdvisorWorkingState, QuestionListError
from cherrytree_agent.contracts.models import (
    AdvisorAnswerDeltaEvent,
    AdvisorGreenHighlightEvent,
    AdvisorRedHighlightEvent,
    AdvisorStreamEvent,
    AdvisorWithdrawRedHighlightsEvent,
    Highlight,
)


def _partial(text: str, *, trailing_strings: bool = False) -> Any:
    """The JSON written so far. Without `trailing_strings`, an unfinished string is left out, so
    every string returned is complete."""
    try:
        return from_json(text, allow_partial="trailing-strings" if trailing_strings else True)
    except ValueError:
        return None


class AdvisorStreamParser:
    """A `StreamHandler` that puts events on `events` for one Advisor run."""

    def __init__(
        self, events: asyncio.Queue[AdvisorStreamEvent | None], state: AdvisorWorkingState
    ) -> None:
        self.events = events
        self.state = state
        self.stream_answer = True
        """Off once the message is being rewritten: the saved message replaces what streamed."""
        self._green_sent: list[Highlight] = []
        self._red_sent: dict[str, list[str]] = {}
        """Follow-up ids whose red highlight was sent, by the tool call that adds them."""
        self._text = ""
        self._answer_sent = ""

    async def on_message_start(self) -> None:
        # Only the final call of a run writes the message; text from an earlier call is not it.
        self._text = ""
        self._answer_sent = ""

    async def on_text(self, text: str) -> None:
        self._text += text
        if not self.stream_answer:
            return
        partial = _partial(self._text, trailing_strings=True)
        message = partial.get("message") if isinstance(partial, dict) else None
        if not isinstance(message, dict):
            return
        answer = message.get("text" if message.get("type") == "answer" else "answer")
        if isinstance(answer, str) and answer.startswith(self._answer_sent):
            delta = answer[len(self._answer_sent) :]
            if delta:
                self._answer_sent = answer
                await self.events.put(AdvisorAnswerDeltaEvent(type="answer_delta", text=delta))

    async def on_tool_input(self, tool_use_id: str, name: str, partial_json: str) -> None:
        if self.state.kind == "btw":
            return
        tool_input = _partial(partial_json)
        if not isinstance(tool_input, dict):
            return
        if name == "add_green_highlights":
            await self._send_green(tool_input.get("quotes"))
        elif name == "update_question_list":
            await self._send_red(tool_use_id, tool_input.get("updates"))

    async def on_tool_result(self, tool_use_id: str, is_error: bool) -> None:
        withdrawn = self._red_sent.pop(tool_use_id, [])
        if is_error and withdrawn:
            await self.events.put(
                AdvisorWithdrawRedHighlightsEvent(
                    type="withdraw_red_highlights", followup_ids=withdrawn
                )
            )

    async def _send_green(self, quotes: object) -> None:
        if not isinstance(quotes, list):
            return
        reply = self.state.replies[self.state.index]
        for quote in quotes:
            if not isinstance(quote, str) or not quote.strip():
                continue
            start = reply.find(quote)
            if start == -1 or reply.find(quote, start + 1) != -1:
                continue
            highlight = Highlight(text=quote, start=start, end=start + len(quote))
            if highlight not in self._green_sent:
                self._green_sent.append(highlight)
                await self.events.put(
                    AdvisorGreenHighlightEvent(type="green_highlight", highlight=highlight)
                )

    async def _send_red(self, tool_use_id: str, updates: object) -> None:
        if not isinstance(updates, list):
            return
        sent = self._red_sent.setdefault(tool_use_id, [])
        for update in updates:
            if not isinstance(update, dict) or update.get("op") != "add":
                continue
            followup_id = update.get("id")
            under, quote = update.get("under"), update.get("highlight")
            if not (isinstance(followup_id, str) and isinstance(under, str)):
                continue
            if not isinstance(quote, str) or followup_id in sent:
                continue
            try:
                highlight = self.state.followup_highlight(under, quote)
            except QuestionListError:
                continue
            sent.append(followup_id)
            await self.events.put(
                AdvisorRedHighlightEvent(
                    type="red_highlight", followup_id=followup_id, highlight=highlight
                )
            )

"""The question list and highlights as one Advisor turn or btw changes them.

Tools edit this copy; the run saves it together with the turn, so a failed run changes nothing.
"""

import re
from copy import deepcopy
from dataclasses import dataclass, field
from typing import Literal

from cherrytree_agent.contracts.models import (
    AdvisorMessage,
    AdvisorState,
    Followup,
    Highlight,
    Question,
    QuestionSection,
    QuestionStatus,
    TurnHighlight,
)

type RunKind = Literal["turn", "btw"]

ID_PATTERN = re.compile(r"^[a-z0-9_]{1,40}$")


class QuestionListError(ValueError):
    """A change the model asked for that the question list cannot take."""


class MessageError(ValueError):
    """A message that does not fit the question list. The model is asked to write it again."""


def quote_positions(text: str, quote: str) -> list[int]:
    """Every start of `quote` in `text`, overlapping matches included."""
    positions: list[int] = []
    start = text.find(quote)
    while start != -1:
        positions.append(start)
        start = text.find(quote, start + 1)
    return positions


def locate_quote(quote: str, replies: dict[int, str]) -> TurnHighlight:
    """The one place `quote` appears in `replies` (turn index → reply text)."""
    if not quote.strip():
        raise QuestionListError("The quote is empty.")
    matches = [
        (turn, start) for turn, reply in replies.items() for start in quote_positions(reply, quote)
    ]
    if not matches:
        raise QuestionListError(f'"{quote}" is not in the user\'s replies on this screen.')
    if len(matches) > 1:
        raise QuestionListError(
            f'"{quote}" appears {len(matches)} times; quote more words so it matches once.'
        )
    turn, start = matches[0]
    return TurnHighlight(turn=turn, text=quote, start=start, end=start + len(quote))


@dataclass
class AdvisorWorkingState:
    """One run's view of the interview. `replies` holds the replies on the screen (turn index →
    text), this turn's included."""

    sections: list[QuestionSection]
    kind: RunKind
    index: int
    screen: str
    """The main question on screen when the run started."""
    replies: dict[int, str]
    green_highlights: list[Highlight] = field(default_factory=list)

    @classmethod
    def start(
        cls,
        state: AdvisorState,
        *,
        kind: RunKind,
        index: int,
        screen: str,
        replies: dict[int, str],
    ) -> "AdvisorWorkingState":
        return cls(deepcopy(state.sections), kind, index, screen, dict(replies))

    # -- Lookups -----------------------------------------------------------------------------

    def find(self, item_id: str) -> tuple[QuestionSection, Question, Followup | None]:
        """The section, main question and (for a follow-up id) follow-up of `item_id`."""
        for section in self.sections:
            for question in section.questions:
                if question.id == item_id:
                    return section, question, None
                for followup in question.followups:
                    if followup.id == item_id:
                        return section, question, followup
        raise QuestionListError(f"Unknown id: {item_id}")

    def _section(self, section_id: str) -> QuestionSection:
        for section in self.sections:
            if section.id == section_id:
                return section
        raise QuestionListError(f"Unknown section id: {section_id}")

    def _ids(self) -> set[str]:
        ids = {section.id for section in self.sections}
        for section in self.sections:
            for question in section.questions:
                ids.add(question.id)
                ids.update(followup.id for followup in question.followups)
        return ids

    def _new_id(self, item_id: str) -> str:
        if not ID_PATTERN.fullmatch(item_id):
            raise QuestionListError(
                f"Id {item_id!r} must be 1-40 lowercase letters, digits or underscores."
            )
        if item_id in self._ids():
            raise QuestionListError(f"Id {item_id!r} is already in use.")
        return item_id

    def _refuse_in_btw(self) -> None:
        if self.kind == "btw":
            raise QuestionListError("Not available in a btw: answer the question only.")

    # -- Changes from tools ------------------------------------------------------------------

    def add_green_highlight(self, quote: str) -> Highlight:
        """Notes a fact in this turn's reply. A quote already noted is not added twice."""
        self._refuse_in_btw()
        positions = quote_positions(self.replies[self.index], quote) if quote.strip() else []
        if not positions:
            raise QuestionListError(f'"{quote}" is not in the reply.')
        if len(positions) > 1:
            raise QuestionListError(
                f'"{quote}" appears {len(positions)} times; quote more words so it matches once.'
            )
        highlight = Highlight(text=quote, start=positions[0], end=positions[0] + len(quote))
        if highlight not in self.green_highlights:
            self.green_highlights.append(highlight)
        return highlight

    def followup_highlight(self, under: str, quote: str) -> TurnHighlight:
        """Where a new follow-up under `under` points: one place in a reply on this screen."""
        if under != self.screen:
            raise QuestionListError(
                f"Follow-ups go under the main question on screen ({self.screen})."
            )
        return locate_quote(quote, self.replies)

    def add_question(self, item_id: str, section_id: str, text: str, description: str) -> None:
        self._refuse_in_btw()
        self._section(section_id).questions.append(
            Question(
                id=self._new_id(item_id),
                text=text,
                description=description,
                status="todo",
                source="added_by_agent",
                advisor_notes=None,
                followups=[],
            )
        )

    def add_followup(self, item_id: str, under: str, text: str, quote: str) -> None:
        self._refuse_in_btw()
        _, question, followup = self.find(under)
        if followup is not None:
            raise QuestionListError(f"{under} is a follow-up; add follow-ups under its question.")
        question.followups.append(
            Followup(
                id=self._new_id(item_id),
                text=text,
                status="todo",
                highlight=self.followup_highlight(under, quote),
            )
        )

    def set_status(self, item_id: str, status: QuestionStatus, note: str | None) -> None:
        self._refuse_in_btw()
        if status == "current":
            raise QuestionListError(
                "Your message makes the question you ask current; set todo, done or skipped."
            )
        _, question, followup = self.find(item_id)
        if followup is not None:
            if note is not None:
                raise QuestionListError("Notes are for main questions only.")
            followup.status = status
            return
        question.status = status
        if note is not None:
            question.advisor_notes = note

    def snapshot(self) -> "AdvisorWorkingState":
        return deepcopy(self)

    def restore(self, snapshot: "AdvisorWorkingState") -> None:
        self.sections = snapshot.sections
        self.green_highlights = snapshot.green_highlights

    # -- The message -------------------------------------------------------------------------

    def apply_message(self, message: AdvisorMessage) -> AdvisorMessage:
        """Checks the message against the question list and makes its question current. Returns
        the message with its `type` set from the list, which decides it."""
        _, on_screen, _ = self.find(self.screen)
        open_followups = [f for f in on_screen.followups if f.status in ("todo", "current")]

        if message.question_id is None:
            if message.type != "interview_complete":
                raise MessageError("questionId is null only for interview_complete.")
            left = [
                q.id
                for section in self.sections
                for q in section.questions
                if q.status == "todo" or (q.status == "current" and q.id != self.screen)
            ]
            if left:
                raise MessageError(
                    f"The interview is not complete: {', '.join(left)} are still to do. Ask the "
                    "next one, or mark them skipped first."
                )
            self._close_screen(on_screen, open_followups)
            return message

        try:
            section, question, followup = self.find(message.question_id)
        except QuestionListError as error:
            raise MessageError(str(error)) from error

        if followup is not None:
            if question.id != self.screen:
                raise MessageError(
                    f"{followup.id} is not a follow-up of the question on screen ({self.screen})."
                )
            if followup.status in ("done", "skipped"):
                raise MessageError(f"{followup.id} is {followup.status}; ask an open follow-up.")
            for other in open_followups:
                if other.status == "current":
                    other.status = "todo"
            followup.status = "current"
            on_screen.status = "current"
            return message.model_copy(update={"type": "followup"})

        if question.id == self.screen:
            raise MessageError(
                f"{question.id} is already on screen; ask one of its follow-ups, or move on."
            )
        if question.status != "todo":
            raise MessageError(f"{question.id} is {question.status}; ask a question still to do.")
        screen_section, _, _ = self.find(self.screen)
        self._close_screen(on_screen, open_followups)
        question.status = "current"
        moved = "next_section" if section.id != screen_section.id else "next_question"
        return message.model_copy(update={"type": moved})

    def _close_screen(self, on_screen: Question, open_followups: list[Followup]) -> None:
        """Leaving a screen: its question is done unless marked skipped, and follow-ups left
        open are skipped, so no red highlight stays open on a screen the user has left."""
        if on_screen.status in ("todo", "current"):
            on_screen.status = "done"
        for followup in open_followups:
            followup.status = "skipped"


def render_question_list(sections: list[QuestionSection]) -> str:
    """The question list as the Advisor reads it every turn: every question in full."""
    lines: list[str] = []
    for number, section in enumerate(sections, start=1):
        lines.append(f"Section {number}: {section.name} [id: {section.id}]")
        for question in section.questions:
            lines.append(f"  [{question.status}] {question.text} [id: {question.id}]")
            lines.append(f"      Description: {question.description}")
            if question.advisor_notes:
                lines.append(f"      Your notes: {question.advisor_notes}")
            for followup in question.followups:
                lines.append(
                    f"      Follow-up [{followup.status}] {followup.text} [id: {followup.id}] "
                    f'on "{followup.highlight.text}"'
                )
    return "\n".join(lines)

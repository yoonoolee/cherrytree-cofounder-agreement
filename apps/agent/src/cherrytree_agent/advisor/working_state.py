"""The checklist, screens and highlights as one Advisor turn or btw changes them.

Tools edit this copy; the run saves it together with the turn, so a failed run changes nothing.
"""

import re
from copy import deepcopy
from dataclasses import dataclass, field
from typing import Literal

from cherrytree_agent.contracts.models import (
    AdvisorMessage,
    AdvisorState,
    ChecklistItem,
    ChecklistSection,
    ChecklistStatus,
    Followup,
    Highlight,
    Screen,
    TurnHighlight,
)

type RunKind = Literal["turn", "btw"]

ID_PATTERN = re.compile(r"^[a-z0-9_]{1,40}$")


class ChecklistError(ValueError):
    """A change the model asked for that the checklist or screen cannot take."""


class MessageError(ValueError):
    """A message that does not fit the interview. The model is asked to write it again."""


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
        raise ChecklistError("The quote is empty.")
    matches = [
        (turn, start) for turn, reply in replies.items() for start in quote_positions(reply, quote)
    ]
    if not matches:
        raise ChecklistError(f'"{quote}" is not in the user\'s replies on this screen.')
    if len(matches) > 1:
        raise ChecklistError(
            f'"{quote}" appears {len(matches)} times; quote more words so it matches once.'
        )
    turn, start = matches[0]
    return TurnHighlight(turn=turn, text=quote, start=start, end=start + len(quote))


@dataclass
class AdvisorWorkingState:
    """One run's view of the interview. `replies` holds the replies on the current screen (turn
    index → text), this turn's included."""

    sections: list[ChecklistSection]
    screens: list[Screen]
    complete: bool
    kind: RunKind
    index: int
    replies: dict[int, str]
    green_highlights: list[Highlight] = field(default_factory=list)

    @classmethod
    def start(
        cls, state: AdvisorState, *, kind: RunKind, index: int, replies: dict[int, str]
    ) -> "AdvisorWorkingState":
        return cls(
            deepcopy(state.sections),
            deepcopy(state.screens),
            state.complete,
            kind,
            index,
            dict(replies),
        )

    @property
    def screen(self) -> Screen:
        """The screen on display: the last one."""
        return self.screens[-1]

    # -- Lookups -----------------------------------------------------------------------------

    def _item(self, item_id: str) -> ChecklistItem | None:
        for section in self.sections:
            for item in section.checklist:
                if item.id == item_id:
                    return item
        return None

    def _section(self, section_id: str) -> ChecklistSection:
        for section in self.sections:
            if section.id == section_id:
                return section
        raise ChecklistError(f"Unknown section id: {section_id}")

    def _ids(self) -> set[str]:
        ids = {section.id for section in self.sections}
        for section in self.sections:
            ids.update(item.id for item in section.checklist)
        for screen in self.screens:
            ids.update(followup.id for followup in screen.followups)
        return ids

    def _new_id(self, item_id: str) -> str:
        if not ID_PATTERN.fullmatch(item_id):
            raise ChecklistError(
                f"Id {item_id!r} must be 1-40 lowercase letters, digits or underscores."
            )
        if item_id in self._ids():
            raise ChecklistError(f"Id {item_id!r} is already in use.")
        return item_id

    def _refuse_in_btw(self) -> None:
        if self.kind == "btw":
            raise ChecklistError("Not available in a btw: answer the question only.")

    # -- Changes from tools ------------------------------------------------------------------

    def add_green_highlight(self, quote: str) -> Highlight:
        """Notes a fact in this turn's reply. A quote already noted is not added twice."""
        self._refuse_in_btw()
        positions = quote_positions(self.replies[self.index], quote) if quote.strip() else []
        if not positions:
            raise ChecklistError(f'"{quote}" is not in the reply.')
        if len(positions) > 1:
            raise ChecklistError(
                f'"{quote}" appears {len(positions)} times; quote more words so it matches once.'
            )
        highlight = Highlight(text=quote, start=positions[0], end=positions[0] + len(quote))
        if highlight not in self.green_highlights:
            self.green_highlights.append(highlight)
        return highlight

    def followup_highlight(self, quote: str) -> TurnHighlight:
        """Where a new follow-up points: one place in a reply on this screen."""
        return locate_quote(quote, self.replies)

    def add_item(self, item_id: str, section_id: str, item: str) -> None:
        self._refuse_in_btw()
        self._section(section_id).checklist.append(
            ChecklistItem(
                id=self._new_id(item_id),
                item=item,
                status="todo",
                source="added_by_agent",
                answer=None,
            )
        )

    def add_followup(self, item_id: str, text: str, quote: str) -> None:
        self._refuse_in_btw()
        self.screen.followups.append(
            Followup(
                id=self._new_id(item_id),
                text=text,
                status="todo",
                highlight=self.followup_highlight(quote),
            )
        )

    def set_status(self, item_id: str, status: ChecklistStatus, answer: str | None) -> None:
        """A checklist item's status and answer, or the status of a follow-up on this screen."""
        self._refuse_in_btw()
        item = self._item(item_id)
        if item is not None:
            item.status = status
            if answer is not None:
                item.answer = answer
            return
        followup = next((f for f in self.screen.followups if f.id == item_id), None)
        if followup is None:
            raise ChecklistError(f"Unknown id: {item_id} (follow-ups: this screen's only)")
        if answer is not None or status == "revisit":
            raise ChecklistError("Answers and revisit are for checklist items only.")
        followup.status = status

    def snapshot(self) -> "AdvisorWorkingState":
        return deepcopy(self)

    def restore(self, snapshot: "AdvisorWorkingState") -> None:
        self.sections = snapshot.sections
        self.screens = snapshot.screens
        self.green_highlights = snapshot.green_highlights

    # -- The message -------------------------------------------------------------------------

    def _todo(self, sections: list[ChecklistSection]) -> list[str]:
        return [item.id for s in sections for item in s.checklist if item.status == "todo"]

    def apply_message(self, message: AdvisorMessage) -> AdvisorMessage:
        """Checks the message against the interview and applies it: makes its follow-up current,
        opens its new screen, or ends the interview. Returns it without the field its type
        does not use."""
        open_followups = [f for f in self.screen.followups if f.status in ("todo", "current")]

        if message.type == "followup":
            followup = next((f for f in open_followups if f.id == message.followup_id), None)
            if followup is None:
                raise MessageError(
                    f"followupId {message.followup_id} is not an open follow-up on this screen."
                )
            for other in open_followups:
                if other.status == "current":
                    other.status = "todo"
            followup.status = "current"
            return message.model_copy(update={"question": None})

        if message.type == "interview_complete":
            left = self._todo(self.sections)
            if left:
                raise MessageError(
                    f"The interview is not complete: {', '.join(left)} are still to do. Ask "
                    "about them, or mark them first."
                )
            self._close_screen(open_followups)
            self.complete = True
            return message.model_copy(update={"question": None, "followup_id": None})

        if not (message.question or "").strip():
            raise MessageError(f"A {message.type} message needs the question.")
        section = self._section(self.screen.section)
        if message.type == "next_section":
            left = self._todo([section])
            if left:
                raise MessageError(
                    f"{section.name} still has items to do: {', '.join(left)}. Ask about them, "
                    "or skip them first."
                )
            position = self.sections.index(section)
            later = [s for s in self.sections[position + 1 :] if self._todo([s])]
            if not later:
                raise MessageError("No later section has items to do: end the interview.")
            section = later[0]
        self._close_screen(open_followups)
        self.screens.append(
            Screen(
                id=f"screen_{len(self.screens) + 1}",
                section=section.id,
                question=message.question or "",
                followups=[],
            )
        )
        return message.model_copy(update={"followup_id": None})

    def _close_screen(self, open_followups: list[Followup]) -> None:
        """Leaving a screen: its open follow-ups are skipped, so no red highlight stays open on a
        screen the user has left."""
        for followup in open_followups:
            followup.status = "skipped"


def render_checklist(sections: list[ChecklistSection]) -> str:
    """The checklist as the agents read it: every item with its status and answer."""
    lines: list[str] = []
    for number, section in enumerate(sections, start=1):
        lines.append(f"Section {number}: {section.name} [id: {section.id}]")
        for item in section.checklist:
            lines.append(f"  [{item.status}] {item.item} [id: {item.id}]")
            if item.answer:
                lines.append(f"      Answer: {item.answer}")
    return "\n".join(lines)


def render_screen(screen: Screen) -> str:
    """The screen on display: its question and follow-ups."""
    lines = [f"Section: {screen.section}", f"Question: {screen.question}"]
    lines.extend(
        f'Follow-up [{f.status}] {f.text} [id: {f.id}] on "{f.highlight.text}"'
        for f in screen.followups
    )
    return "\n".join(lines)

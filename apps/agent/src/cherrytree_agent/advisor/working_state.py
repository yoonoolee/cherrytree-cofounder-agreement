"""The question list and section summaries as one Advisor turn changes them.

Tools edit this copy; the turn saves it together with the turn, so a failed turn changes nothing.
"""

from copy import deepcopy
from uuid import uuid4

from cherrytree_agent.contracts.models import (
    AdvisorQuestion,
    AdvisorState,
    Question,
    QuestionSection,
    QuestionStatus,
)


class QuestionListError(ValueError):
    """A change the model asked for that the question list cannot take. Nothing is applied."""


class AdvisorWorkingState:
    def __init__(self, state: AdvisorState) -> None:
        self.sections: list[QuestionSection] = deepcopy(state.sections)
        self.section_summaries: dict[str, str] = dict(state.section_summaries)

    def _section(self, section_id: str) -> QuestionSection:
        for section in self.sections:
            if section.id == section_id:
                return section
        raise QuestionListError(f"Unknown section id: {section_id}")

    def _question(self, question_id: str) -> Question:
        for section in self.sections:
            for question in section.questions:
                if question.id == question_id:
                    return question
        raise QuestionListError(f"Unknown question id: {question_id}")

    def current(self) -> tuple[QuestionSection, Question] | None:
        """The current question and its section, if any."""
        for section in self.sections:
            for question in section.questions:
                if question.status == "current":
                    return section, question
        return None

    def current_section(self) -> QuestionSection | None:
        """The section of the current question, else the first section with questions left."""
        for section in self.sections:
            if any(q.status == "current" for q in section.questions):
                return section
        for section in self.sections:
            if any(q.status == "todo" for q in section.questions):
                return section
        return None

    def add_question(
        self, section_id: str, after_question_id: str | None, text: str, description: str
    ) -> str:
        section = self._section(section_id)
        question = Question(
            id=f"added_{uuid4().hex[:8]}",
            text=text,
            description=description,
            status="todo",
            source="added_by_agent",
            advisor_notes=None,
        )
        if after_question_id is None:
            section.questions.append(question)
        else:
            ids = [q.id for q in section.questions]
            if after_question_id not in ids:
                raise QuestionListError(
                    f"Question {after_question_id} is not in section {section_id}"
                )
            section.questions.insert(ids.index(after_question_id) + 1, question)
        return question.id

    def update_question(
        self, question_id: str, status: QuestionStatus, advisor_notes: str | None
    ) -> None:
        question = self._question(question_id)
        question.status = status
        if advisor_notes is not None:
            question.advisor_notes = advisor_notes

    def check(self) -> None:
        current = [q.id for s in self.sections for q in s.questions if q.status == "current"]
        if len(current) > 1:
            raise QuestionListError(
                f"Only one question can be current; these are: {', '.join(current)}"
            )

    def set_section_summary(self, section_id: str, summary: str) -> None:
        self._section(section_id)
        self.section_summaries[section_id] = summary

    def snapshot(self) -> "AdvisorWorkingState":
        return deepcopy(self)

    def restore(self, snapshot: "AdvisorWorkingState") -> None:
        self.sections = snapshot.sections
        self.section_summaries = snapshot.section_summaries


def screen_question(
    before: AdvisorWorkingState, after: AdvisorWorkingState, question: AdvisorQuestion | None
) -> AdvisorQuestion | None:
    """The response's question, made to agree with the question list, which decides the screen:
    a turn that changed the current question opens that question's screen (`next_question`, or
    `next_section` across sections, worded as the list words it); a turn that did not stays on
    the screen (`followup`); and once no question is current the interview is over (null)."""
    was, now = before.current(), after.current()
    if now is None:
        return None
    section, current = now
    if was is not None and was[1].id == current.id:
        if question is None or question.type == "followup":
            return question
        return AdvisorQuestion(type="followup", text=question.text)
    moved_section = was is None or was[0].id != section.id
    expected = "next_section" if moved_section else "next_question"
    return AdvisorQuestion(type=expected, text=current.text)


def render_question_list(state: AdvisorWorkingState) -> str:
    """The checklist the Advisor reads every turn: the current section in full (descriptions and
    notes), the other sections as question text and status only."""
    current = state.current_section()
    lines: list[str] = []
    for number, section in enumerate(state.sections, start=1):
        is_current = section is current
        marker = " (current section)" if is_current else ""
        summary = " · summary written" if section.id in state.section_summaries else ""
        lines.append(f"Section {number}: {section.name} [id: {section.id}]{marker}{summary}")
        for question in section.questions:
            lines.append(f"  [{question.status}] {question.text} [id: {question.id}]")
            if is_current:
                lines.append(f"      Description: {question.description}")
                if question.advisor_notes:
                    lines.append(f"      Your notes: {question.advisor_notes}")
    return "\n".join(lines)


def render_section_summaries(state: AdvisorWorkingState) -> str:
    if not state.section_summaries:
        return "No section summaries yet."
    names = {section.id: section.name for section in state.sections}
    return "\n\n".join(
        f"## {names.get(section_id, section_id)}\n\n{summary}"
        for section_id, summary in state.section_summaries.items()
    )

"""The interview in `content/interview.json`: its checklist starts each project's state, and its
guides are part of the Advisor's system prompt."""

from datetime import UTC, datetime
from pathlib import Path

from cherrytree_agent.contracts.models import (
    AdvisorState,
    ChecklistItem,
    ChecklistSection,
    Interview,
    Screen,
)

INTERVIEW = Interview.model_validate_json(
    (Path(__file__).parent.parent / "content" / "interview.json").read_text()
)


def initial_state() -> AdvisorState:
    """Every item `todo` from source `initial`, with ids from its section and position, and the
    opener on the first screen."""
    sections = [
        ChecklistSection(
            id=section.id,
            name=section.name,
            checklist=[
                ChecklistItem(
                    id=f"{section.id}_{number}",
                    item=item.item,
                    status="todo",
                    source="initial",
                    answer=None,
                )
                for number, item in enumerate(section.checklist, start=1)
            ],
        )
        for section in INTERVIEW.sections
    ]
    first = Screen(
        id="screen_1", section=INTERVIEW.sections[0].id, question=INTERVIEW.opener, followups=[]
    )
    return AdvisorState(
        sections=sections,
        screens=[first],
        complete=False,
        turn_count=0,
        updated_at=datetime.now(UTC),
    )


def render_guides() -> str:
    """Every section's guide and its items' notes, for the system prompt."""
    parts = ["# Section guides"]
    for number, section in enumerate(INTERVIEW.sections, start=1):
        parts.append(f"## Section {number}: {section.name} [id: {section.id}]\n\n{section.guide}")
        items = [f"- {item.item}: {item.notes}" for item in section.checklist if item.notes]
        if items:
            parts.append("Checklist notes:\n" + "\n".join(items))
    return "\n\n".join(parts)

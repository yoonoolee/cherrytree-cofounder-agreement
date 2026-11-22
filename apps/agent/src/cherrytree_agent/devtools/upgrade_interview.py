"""Ad hoc, dev and local only: moves a project's interview onto the current
`content/interview.json`, keeping its turns and the answers recorded so far, so edits to the opener
or the checklist show up while the interview content is being written. Used by the interview's
**Use latest interview** button (`POST /v1/projects/{id}/advisor/upgrade` in `main.py`), or from
the repo root (prints the changes; add --apply to save them):

    uv run --directory apps/agent python -m cherrytree_agent.devtools.upgrade_interview <projectId>

Matching, per section: an item keeps its id, status and answer while its wording is unchanged; a
new or reworded item starts `todo`. A dropped item goes only if nothing was recorded on it, and the
Advisor's own items stay. The opener changes only before the first reply. Refused once the
interview has ended or a draft has started.
"""

import argparse
import asyncio
import sys
from datetime import UTC, datetime

from google.cloud.firestore import AsyncClient, AsyncTransaction, async_transactional

from cherrytree_agent.advisor.interview import initial_state
from cherrytree_agent.contracts.models import AdvisorState, ChecklistItem, ChecklistSection, Project
from cherrytree_agent.firebase import advisor_state_ref, project_ref, read, to_firestore

DEV_PROJECT = "cherrytree-cofounder-agree-dev"


def _recorded(item: ChecklistItem) -> bool:
    return item.status != "todo" or item.answer is not None


def upgrade_state(state: AdvisorState) -> tuple[AdvisorState, list[str]]:
    """The state moved onto the current interview, and a line per change."""
    fresh = initial_state()
    old_sections = {section.id: section for section in state.sections}
    on_screen = {screen.section for screen in state.screens}
    taken = {item.id for section in state.sections for item in section.checklist}
    changes: list[str] = []

    def free_id(section_id: str) -> str:
        number = 1
        while f"{section_id}_{number}" in taken:
            number += 1
        taken.add(f"{section_id}_{number}")
        return f"{section_id}_{number}"

    sections: list[ChecklistSection] = []
    for new in fresh.sections:
        old = old_sections.pop(new.id, None)
        old_items = old.checklist if old else []
        unmatched = [item for item in old_items if item.source == "initial"]
        checklist: list[ChecklistItem] = []
        for item in new.checklist:
            kept = next((old_item for old_item in unmatched if old_item.item == item.item), None)
            if kept is None:
                added = item.model_copy(update={"id": free_id(new.id)})
                checklist.append(added)
                changes.append(f"+ {new.id}: {added.item!r} (todo)")
            else:
                unmatched.remove(kept)
                checklist.append(kept)
        for item in old_items:
            if item.source == "added_by_agent":
                checklist.append(item)
            elif item in unmatched and _recorded(item):
                checklist.append(item)
                changes.append(f"= {new.id}: kept {item.item!r}: not in the file, but answered")
            elif item in unmatched:
                changes.append(f"- {new.id}: {item.item!r}")
        sections.append(new.model_copy(update={"checklist": checklist}))
    for old in old_sections.values():
        kept_items = [i for i in old.checklist if i.source == "added_by_agent" or _recorded(i)]
        if kept_items or old.id in on_screen:
            sections.append(old.model_copy(update={"checklist": kept_items}))
            changes.append(f"= section {old.id}: kept, no longer in the file but has answers")
        else:
            changes.append(f"- section {old.id}")

    screens = state.screens
    if state.turn_count == 0 and state.screens[0].question != fresh.screens[0].question:
        screens = fresh.screens
        changes.append(f"opener: {fresh.screens[0].question!r}")
    upgraded = state.model_copy(
        update={"sections": sections, "screens": screens, "updated_at": datetime.now(UTC)}
    )
    return upgraded, changes


class UpgradeRefusedError(Exception):
    """The interview hasn't started or has ended, or a draft was started from it."""


async def upgrade_interview(db: AsyncClient, project_id: str, apply: bool = True) -> list[str]:
    """Moves the project's interview onto the current file; returns a line per change."""
    project = await read(project_ref(db, project_id), Project)
    if project is None or project.draft_status is not None:
        raise UpgradeRefusedError("A draft was started from this interview.")
    ref = advisor_state_ref(db, project_id)

    @async_transactional
    async def upgrade(transaction: AsyncTransaction) -> list[str]:
        state = await read(ref, AdvisorState, transaction)
        if state is None or state.complete:
            raise UpgradeRefusedError("The interview hasn't started, or has ended.")
        upgraded, changes = upgrade_state(state)
        if apply and changes:
            transaction.set(ref, to_firestore(upgraded))
        return changes

    return await upgrade(db.transaction())


async def main(project_id: str, apply: bool) -> None:
    try:
        changes = await upgrade_interview(AsyncClient(project=DEV_PROJECT), project_id, apply)
    except UpgradeRefusedError as error:
        sys.exit(str(error))
    print("\n".join(changes) or "Already on the current interview.json.")
    if changes and not apply:
        print("\nNothing saved. Run again with --apply to save.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Move a dev project onto interview.json.")
    parser.add_argument("project_id")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    asyncio.run(main(args.project_id, args.apply))

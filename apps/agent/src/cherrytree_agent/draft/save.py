"""Saving the editor's document: the browser applies every change with Plate, then saves the whole
draft here, based on the version it started from."""

from datetime import UTC, datetime

from google.cloud.firestore import AsyncClient, AsyncTransaction, async_transactional

from cherrytree_agent.contracts.models import Draft, DraftBlock
from cherrytree_agent.firebase import draft_ref, project_ref, read


class StaleDraftError(Exception):
    """There is no draft, or it changed since the editor's version."""


class InvalidDraftError(Exception):
    """The document repeats a block id."""


async def save_draft(
    db: AsyncClient, project_id: str, content: list[DraftBlock], version: int
) -> int:
    """Replaces the draft's content; returns the new version."""
    ids = [block.id for block in content]
    if len(set(ids)) != len(ids):
        raise InvalidDraftError("Block ids must be unique")
    ref = draft_ref(db, project_id)

    @async_transactional
    async def save(transaction: AsyncTransaction) -> int:
        draft = await read(ref, Draft, transaction)
        if draft is None or draft.version != version:
            raise StaleDraftError
        now = datetime.now(UTC)
        transaction.update(
            ref,
            {
                # Plate nodes exactly as the editor wrote them.
                "content": [
                    block.model_dump(by_alias=True, exclude_unset=True) for block in content
                ],
                "version": version + 1,
                "updatedAt": now,
            },
        )
        transaction.update(project_ref(db, project_id), {"lastUpdated": now})
        return version + 1

    return await save(db.transaction())

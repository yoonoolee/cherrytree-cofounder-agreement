"""Client of the `draftDocument` Cloud Function, which runs Plate's own code on the draft before
the user first opens it (contract: packages/shared/src/draftDocument.ts).

Cloud Run IAM admits only the agent service's account, so each call carries a Google ID token for
the function's URL, from the metadata server on Cloud Run.
"""

import asyncio
from functools import lru_cache

import httpx
from google.auth.credentials import Credentials
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from pydantic import BaseModel

from cherrytree_agent.contracts.models import (
    DraftApplyReviewRequest,
    DraftBlock,
    DraftDocumentResponse,
    DraftFix,
    DraftFromMarkdownRequest,
    DraftThreadAnchor,
)
from cherrytree_agent.settings import get_settings

TIMEOUT_SECONDS = 60.0


@lru_cache
def _id_token_credentials(audience: str) -> Credentials:
    return id_token.fetch_id_token_credentials(audience, request=Request())


def _id_token(audience: str) -> str:
    credentials = _id_token_credentials(audience)
    if not credentials.valid:
        credentials.refresh(Request())
    if not credentials.token:
        raise RuntimeError(f"No ID token for {audience}")
    return credentials.token


class DraftDocument:
    """The function's two operations. Tests replace it (`main.get_draft_document`)."""

    async def from_markdown(self, markdown: str) -> list[DraftBlock]:
        return await self._call(DraftFromMarkdownRequest(op="from_markdown", markdown=markdown))

    async def apply_review(
        self, content: list[DraftBlock], fixes: list[DraftFix], threads: list[DraftThreadAnchor]
    ) -> list[DraftBlock]:
        return await self._call(
            DraftApplyReviewRequest(
                op="apply_review", content=content, fixes=fixes, threads=threads
            )
        )

    async def _call(self, request: BaseModel) -> list[DraftBlock]:
        url = get_settings().draft_document_url
        token = await asyncio.to_thread(_id_token, url)
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as http:
            response = await http.post(
                url,
                json=request.model_dump(mode="json", by_alias=True, exclude_unset=True),
                headers={"Authorization": f"Bearer {token}"},
            )
        response.raise_for_status()
        return DraftDocumentResponse.model_validate(response.json()).content

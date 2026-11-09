"""`search_rag`: advice and facts from Cherrytree's curated content.

Each entry is a chunk in the vector database's schema (`RagChunk`). The vector store is not
chosen yet; until it is, `SeedRagStore` searches `content/rag_seed.json` by keyword overlap,
which runs the tool and the schema end to end. The chosen store implements `RagStore` and is
loaded from the same chunks.
"""

import re
from datetime import date
from pathlib import Path
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from cherrytree_agent.tools.context import ToolContext

SEED_FILE = Path(__file__).parent.parent / "content" / "rag_seed.json"
RESULTS = 3


class RagChunk(BaseModel):
    """One curated passage. `text` is what gets embedded."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str
    text: str
    title: str
    url: str | None
    section: str
    """The interview section the passage is about (a `questions.json` section id)."""
    date_added: date = Field(alias="dateAdded")


class RagSeed(BaseModel):
    model_config = ConfigDict(extra="forbid")

    chunks: list[RagChunk]


class RagStore(Protocol):
    async def search(self, query: str) -> list[RagChunk]:
        """The most relevant passages, best first."""
        ...


def _words(text: str) -> set[str]:
    return {word for word in re.findall(r"[a-z0-9]+", text.lower()) if len(word) > 2}


class SeedRagStore:
    def __init__(self, seed: RagSeed) -> None:
        self.chunks = seed.chunks

    async def search(self, query: str) -> list[RagChunk]:
        wanted = _words(query)
        scored = [
            (len(wanted & _words(f"{chunk.title} {chunk.text}")), chunk) for chunk in self.chunks
        ]
        matches = sorted((pair for pair in scored if pair[0] > 0), key=lambda pair: -pair[0])
        return [chunk for _, chunk in matches[:RESULTS]]


RAG_STORE: RagStore = SeedRagStore(RagSeed.model_validate_json(SEED_FILE.read_text()))


class SearchRagInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str = Field(description="What to look up, in plain words.")


SEARCH_RAG_DESCRIPTION = """\
Search Cherrytree's curated advice and facts about cofounder agreements and cofounder \
relationships. Prefer it to the web for advice and common practice."""


def format_results(chunks: list[RagChunk]) -> str:
    if not chunks:
        return "No curated content matches. Answer from your own knowledge or the web."
    return "\n\n".join(
        f"## {chunk.title}\nSource: {chunk.url or 'Cherrytree curated content'}\n\n{chunk.text}"
        for chunk in chunks
    )


async def search_rag(context: ToolContext, request: SearchRagInput) -> str:
    return format_results(await RAG_STORE.search(request.query))

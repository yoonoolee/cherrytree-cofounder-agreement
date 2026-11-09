"""A Review Agent run on the first draft: its fixes are applied directly and its open items become
threads, both saved with the draft."""

from dataclasses import dataclass

from google.cloud.firestore import AsyncClient

from cherrytree_agent.contracts.models import DraftBlock, DraftFix
from cherrytree_agent.draft.context import DraftContext
from cherrytree_agent.draft.working import NewThread, WorkingDraft, render_draft
from cherrytree_agent.llm.loop import CallModel, run_agent
from cherrytree_agent.llm.model import NoStream
from cherrytree_agent.review.config import REVIEW
from cherrytree_agent.tools.context import ToolContext

FIRST_DRAFT_TASK = """\
This is the first draft, just written from the interview. Review it before the founders see it: \
fix its drafting inconsistencies and raise its open items."""


@dataclass(frozen=True)
class FirstDraftReview:
    fixes: list[DraftFix]
    threads: list[NewThread]


async def review_first_draft(
    db: AsyncClient,
    project_id: str,
    context: DraftContext,
    content: list[DraftBlock],
    call: CallModel,
) -> FirstDraftReview:
    draft = WorkingDraft(content)
    await run_agent(
        REVIEW,
        history=[],
        new_messages=[
            {
                "role": "user",
                "content": [
                    *context.prefix(REVIEW.model.prefix_cache_ttl),
                    {"type": "text", "text": f"<draft>\n{render_draft(content)}\n</draft>"},
                    {"type": "text", "text": FIRST_DRAFT_TASK},
                ],
            }
        ],
        context=ToolContext(db=db, project_id=project_id, draft=draft),
        handler=NoStream(),
        call=call,
    )
    return FirstDraftReview(fixes=draft.fixes(), threads=draft.threads)

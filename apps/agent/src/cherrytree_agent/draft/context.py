"""What the Drafting, Review and Editing agents all start from: the agreement template, the Advisor
transcript and the section summaries. Sent first in every run and cached as one prefix."""

import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from google.cloud.firestore import AsyncClient

from cherrytree_agent.advisor.transcript import read_transcript
from cherrytree_agent.advisor.working_state import AdvisorWorkingState, render_section_summaries
from cherrytree_agent.contracts.models import AdvisorState
from cherrytree_agent.firebase import advisor_state_ref, read

TEMPLATE = (Path(__file__).parent.parent / "content" / "agreement-template.md").read_text()
TEMPLATE_VERSION = f"agreement-template.md@{hashlib.sha256(TEMPLATE.encode()).hexdigest()[:6]}"
"""Saved on each draft, so a draft can be traced to the template text it was written from."""


@dataclass(frozen=True)
class DraftContext:
    transcript: str
    section_summaries: str

    def prefix(self, cache_ttl: Literal["5m", "1h"]) -> list[dict[str, Any]]:
        """User-message blocks, most stable first (the template is the same for every project),
        with a cache breakpoint after the last one."""
        return [
            {
                "type": "text",
                "text": f'<agreement_template version="{TEMPLATE_VERSION}">\n{TEMPLATE}\n'
                "</agreement_template>",
            },
            {"type": "text", "text": f"<transcript>\n{self.transcript}\n</transcript>"},
            {
                "type": "text",
                "text": f"<section_summaries>\n{self.section_summaries}\n</section_summaries>",
                "cache_control": {"type": "ephemeral", "ttl": cache_ttl},
            },
        ]


async def load_draft_context(db: AsyncClient, project_id: str) -> DraftContext:
    state = await read(advisor_state_ref(db, project_id), AdvisorState)
    if state is None:
        raise ValueError(f"Project {project_id} has no Advisor state")
    return DraftContext(
        transcript=await read_transcript(db, project_id),
        section_summaries=render_section_summaries(AdvisorWorkingState(state)),
    )

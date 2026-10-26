"""What a tool may touch. Tools never write to Firestore: they change the run's working copy, and
the run's code saves it at the end. They only reach data inside the verified project."""

from dataclasses import dataclass

from google.cloud.firestore import AsyncClient

from cherrytree_agent.advisor.working_state import AdvisorWorkingState
from cherrytree_agent.draft.working import WorkingDraft


@dataclass(frozen=True)
class ToolContext:
    db: AsyncClient
    project_id: str
    advisor: AdvisorWorkingState | None = None
    """The Advisor's question list and summaries as this turn changes them."""
    draft: WorkingDraft | None = None
    """The draft a run reviews or edits, with the edits and threads it proposes."""


class ToolError(Exception):
    """Returned to the model as an error result, so it can correct itself in the same run."""

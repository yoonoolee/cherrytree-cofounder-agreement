"""Runtime configuration, read from the environment.

Secrets are not held here: the Anthropic and Langfuse SDKs read `ANTHROPIC_API_KEY` and
`LANGFUSE_*` themselves.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(frozen=True)

    google_cloud_project: str
    """Firebase project whose Firestore, Auth and App Check the service uses (the web app's)."""

    allowed_origins: list[str]
    """Web app origins allowed to call the service from a browser (CORS), as a JSON list."""

    agent_url: str
    """The service's own public URL on Cloud Run, which Cloud Tasks calls back."""

    draft_queue: str
    """Cloud Tasks queue of the Drafting + Review job, as `projects/…/locations/…/queues/…`."""

    tasks_service_account: str
    """Service account whose OIDC token Cloud Tasks sends; the worker accepts no other caller."""

    draft_document_url: str
    """URL of the `draftDocument` Cloud Function (Plate document code)."""


@lru_cache
def get_settings() -> Settings:
    return Settings()  # pyright: ignore[reportCallIssue]  # fields come from the environment

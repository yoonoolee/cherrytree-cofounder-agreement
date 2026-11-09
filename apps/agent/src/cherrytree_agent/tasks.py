"""Cloud Tasks: queueing the Drafting + Review job, and checking that a worker request comes from
Cloud Tasks.

The service is public on Cloud Run (browsers call it with Firebase tokens), so the worker endpoint
checks the caller itself: a Google-signed OIDC token for the worker's URL, issued to the dedicated
Cloud Tasks service account. Nothing else can start a job run.
"""

import asyncio
import logging
from functools import lru_cache
from typing import Annotated

from fastapi import Header, HTTPException, status
from google.auth.transport.requests import Request
from google.cloud import tasks_v2
from google.oauth2 import id_token
from google.protobuf import duration_pb2
from pydantic import BaseModel, ConfigDict, Field

from cherrytree_agent.settings import get_settings

logger = logging.getLogger(__name__)

DRAFT_TASK_PATH = "/v1/tasks/draft"

DISPATCH_DEADLINE_SECONDS = 1800
"""Cloud Tasks' maximum for HTTP targets. The Cloud Run request timeout must be at least this, so
an attempt is never retried while it is still running."""


class DraftTask(BaseModel):
    """The body of a Drafting + Review task."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    project_id: Annotated[str, Field(alias="projectId")]


def draft_worker_url() -> str:
    """Where Cloud Tasks sends the job, and the audience of its OIDC token."""
    return f"{get_settings().agent_url}{DRAFT_TASK_PATH}"


@lru_cache
def _client() -> tasks_v2.CloudTasksAsyncClient:
    return tasks_v2.CloudTasksAsyncClient()


async def enqueue_draft_job(project_id: str) -> None:
    settings = get_settings()
    url = draft_worker_url()
    task = tasks_v2.Task(
        http_request=tasks_v2.HttpRequest(
            http_method=tasks_v2.HttpMethod.POST,
            url=url,
            headers={"Content-Type": "application/json"},
            body=DraftTask(project_id=project_id).model_dump_json(by_alias=True).encode(),
            oidc_token=tasks_v2.OidcToken(
                service_account_email=settings.tasks_service_account, audience=url
            ),
        ),
        dispatch_deadline=duration_pb2.Duration(seconds=DISPATCH_DEADLINE_SECONDS),
    )
    await _client().create_task(parent=settings.draft_queue, task=task)


def _rejected(detail: str, error: Exception | None = None) -> HTTPException:
    logger.warning(detail, exc_info=error, extra={"event": "auth_rejected"})
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail)


async def require_cloud_tasks(authorization: Annotated[str | None, Header()] = None) -> None:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _rejected("Missing OIDC token")
    try:
        claims = await asyncio.to_thread(
            id_token.verify_oauth2_token, token, Request(), draft_worker_url()
        )
    except Exception as error:
        raise _rejected("Invalid OIDC token", error) from error
    if claims.get("email") != get_settings().tasks_service_account or not claims.get(
        "email_verified"
    ):
        raise _rejected("OIDC token is not from the Cloud Tasks service account")

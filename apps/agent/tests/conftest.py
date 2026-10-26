"""Shared fixtures. Tests that need Firestore run against the emulator and are skipped without it
(`npm run test:agent` starts one); everything else is a plain unit test."""

import logging
import os
from collections.abc import AsyncIterator
from typing import Any

import httpx
import pytest

os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "demo-cherrytree")
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost:3000"]')
os.environ.setdefault("AGENT_URL", "https://agent.test")
os.environ.setdefault("DRAFT_QUEUE", "projects/demo-cherrytree/locations/us-west2/queues/drafting")
os.environ.setdefault(
    "TASKS_SERVICE_ACCOUNT", "cloud-tasks@demo-cherrytree.iam.gserviceaccount.com"
)
os.environ.setdefault("DRAFT_DOCUMENT_URL", "https://draft-document.test")
logging.getLogger("langfuse").setLevel(logging.ERROR)

import firebase_admin  # noqa: E402
from firebase_admin import credentials  # noqa: E402
from google.auth.credentials import AnonymousCredentials, Credentials  # noqa: E402
from google.cloud.firestore import AsyncClient  # noqa: E402

from cherrytree_agent import auth  # noqa: E402
from cherrytree_agent.firebase import get_db, project_ref  # noqa: E402
from cherrytree_agent.main import app  # noqa: E402
from tests.helpers import PROJECT, PROJECT_ID  # noqa: E402

# ---------------------------------------------------------------------------
# Firestore emulator
# ---------------------------------------------------------------------------

EMULATOR = os.environ.get("FIRESTORE_EMULATOR_HOST")


class _EmulatorCredential(credentials.Base):
    """The emulator accepts any caller; without this the SDK looks for Google credentials."""

    def get_credential(self) -> Credentials:
        return AnonymousCredentials()


@pytest.fixture
async def db() -> AsyncIterator[AsyncClient]:
    if not EMULATOR:
        pytest.skip("needs the Firestore emulator")
    if not firebase_admin._apps:  # pyright: ignore[reportPrivateUsage]
        firebase_admin.initialize_app(
            _EmulatorCredential(), {"projectId": os.environ["GOOGLE_CLOUD_PROJECT"]}
        )
    project = os.environ["GOOGLE_CLOUD_PROJECT"]
    async with httpx.AsyncClient() as http:
        await http.delete(
            f"http://{EMULATOR}/emulator/v1/projects/{project}/databases/(default)/documents"
        )
    yield get_db()


# ---------------------------------------------------------------------------
# Browser requests
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def fake_tokens(monkeypatch: pytest.MonkeyPatch) -> None:
    """App Check `valid` / `consumed`, and ID tokens `uid:<uid>` (see `helpers.headers`)."""

    def verify_app_check(token: str, app: firebase_admin.App, consume: bool) -> dict[str, Any]:
        assert consume, "App Check tokens must be consumed"
        assert app is firebase_admin.get_app(), "verified against the initialized Firebase app"
        if token == "valid":
            return {}
        if token == "consumed":
            return {"already_consumed": True}
        raise ValueError("invalid App Check token")

    def verify_id_token(token: str, app: firebase_admin.App) -> dict[str, Any]:
        assert app is firebase_admin.get_app(), "verified against the initialized Firebase app"
        if not token.startswith("uid:"):
            raise ValueError("invalid ID token")
        return {"uid": token.removeprefix("uid:")}

    monkeypatch.setattr(auth.app_check, "verify_token", verify_app_check)
    monkeypatch.setattr(auth.auth, "verify_id_token", verify_id_token)


@pytest.fixture
async def client(db: AsyncClient) -> AsyncIterator[httpx.AsyncClient]:
    """The app over ASGI, with the test project in Firestore."""
    await project_ref(db, PROJECT_ID).set(PROJECT)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as http:
        yield http
    app.dependency_overrides.clear()

"""Starting the Drafting + Review job and running it as Cloud Tasks does, against the Firestore
emulator, with the model, Cloud Tasks and the Plate function faked."""

from typing import Any

import httpx
import pytest
from google.cloud.firestore import AsyncClient

from cherrytree_agent import tasks
from cherrytree_agent.contracts.models import DraftBlock, DraftFix, DraftThreadAnchor
from cherrytree_agent.drafting import start
from cherrytree_agent.drafting.job import DRAFT_JOB_MAX_ATTEMPTS
from cherrytree_agent.firebase import advisor_state_ref, draft_ref, project_ref
from cherrytree_agent.main import app, get_draft_document
from cherrytree_agent.settings import get_settings
from tests.helpers import (
    PROJECT_ID,
    FakeModel,
    advisor_json,
    headers,
    message,
    text,
    tool_use,
    use_model,
)

DRAFT = f"/v1/projects/{PROJECT_ID}/draft"
TASK = "/v1/tasks/draft"
SESSION = f"/v1/projects/{PROJECT_ID}/advisor/session"
TASK_HEADERS = {"Authorization": "Bearer cloud-tasks"}

MARKDOWN = "# Cofounder Agreement\n\nThe founders split equity 50/50."


class FakeDraftDocument:
    """Stands in for the Plate function: one block per markdown line, ids b0, b1, ..."""

    def __init__(self) -> None:
        self.applied: list[tuple[list[DraftFix], list[DraftThreadAnchor]]] = []

    async def from_markdown(self, markdown: str) -> list[DraftBlock]:
        lines = [line for line in markdown.splitlines() if line.strip()]
        return [
            DraftBlock.model_validate(
                {
                    "type": "h1" if line.startswith("# ") else "p",
                    "id": f"b{i}",
                    "children": [{"text": line.removeprefix("# ")}],
                }
            )
            for i, line in enumerate(lines)
        ]

    async def apply_review(
        self, content: list[DraftBlock], fixes: list[DraftFix], threads: list[DraftThreadAnchor]
    ) -> list[DraftBlock]:
        self.applied.append((fixes, threads))
        return content


@pytest.fixture(autouse=True)
def fake_cloud_tasks(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    """Queued project ids; OIDC tokens `cloud-tasks` (the tasks account) and `other`."""
    queued: list[str] = []

    async def enqueue(project_id: str) -> None:
        queued.append(project_id)

    def verify(token: str, request: object, audience: str) -> dict[str, Any]:
        assert audience == f"{get_settings().agent_url}{TASK}"
        if token == "cloud-tasks":
            return {"email": get_settings().tasks_service_account, "email_verified": True}
        if token == "other":
            return {"email": "someone@example.com", "email_verified": True}
        raise ValueError("invalid token")

    monkeypatch.setattr(start, "enqueue_draft_job", enqueue)
    monkeypatch.setattr(tasks.id_token, "verify_oauth2_token", verify)
    return queued


@pytest.fixture
def documents() -> FakeDraftDocument:
    fake = FakeDraftDocument()
    app.dependency_overrides[get_draft_document] = lambda: fake
    return fake


async def finish_interview(client: httpx.AsyncClient, db: AsyncClient) -> None:
    await client.post(SESSION, headers=headers())
    ref = advisor_state_ref(db, PROJECT_ID)
    state = (await ref.get()).to_dict() or {}
    for section in state["sections"]:
        for question in section["questions"]:
            question["status"] = "done"
    state["sections"][0]["questions"][0]["advisorNotes"] = "Avery and Sam split equity 50/50."
    await ref.set(state)


async def draft_status(db: AsyncClient) -> str | None:
    return ((await project_ref(db, PROJECT_ID).get()).to_dict() or {})["draftStatus"]


async def run_task(client: httpx.AsyncClient, retry_count: int = 0) -> httpx.Response:
    return await client.post(
        TASK,
        headers={**TASK_HEADERS, "X-CloudTasks-TaskRetryCount": str(retry_count)},
        json={"projectId": PROJECT_ID},
    )


def drafting_then_review() -> FakeModel:
    """Drafting writes MARKDOWN; Review fixes block b1 and raises an open item on it."""
    return FakeModel(
        message(text(MARKDOWN)),
        message(
            tool_use(
                "t1",
                "propose_replace_text",
                {"para": "b1", "old": "founders", "new": "Founders"},
            ),
            tool_use("t2", "create_thread", {"para": "b1", "message": "Is 50/50 final?"}),
            stop_reason="tool_use",
        ),
        message(text("Fixed one term; raised one item.")),
    )


# ---------------------------------------------------------------------------
# Starting
# ---------------------------------------------------------------------------


async def test_starts_once_the_interview_is_finished(
    client: httpx.AsyncClient, db: AsyncClient, fake_cloud_tasks: list[str]
) -> None:
    await finish_interview(client, db)
    response = await client.post(DRAFT, headers=headers())
    assert response.status_code == 200
    assert response.json() == {"draftStatus": "queued"}
    assert await draft_status(db) == "queued"
    assert fake_cloud_tasks == [PROJECT_ID]

    again = await client.post(DRAFT, headers=headers())
    assert again.status_code == 409
    assert fake_cloud_tasks == [PROJECT_ID]


async def test_cannot_start_before_the_interview_is_finished(
    client: httpx.AsyncClient, db: AsyncClient, fake_cloud_tasks: list[str]
) -> None:
    await client.post(SESSION, headers=headers())
    response = await client.post(DRAFT, headers=headers())
    assert response.status_code == 409
    assert await draft_status(db) is None
    assert fake_cloud_tasks == []


async def test_can_start_again_after_a_failure(
    client: httpx.AsyncClient, db: AsyncClient, fake_cloud_tasks: list[str]
) -> None:
    await finish_interview(client, db)
    await project_ref(db, PROJECT_ID).update({"draftStatus": "failed"})
    response = await client.post(DRAFT, headers=headers())
    assert response.status_code == 200
    assert fake_cloud_tasks == [PROJECT_ID]


async def test_a_task_that_cannot_be_queued_leaves_the_job_failed(
    client: httpx.AsyncClient, db: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def unavailable(project_id: str) -> None:
        raise RuntimeError("Cloud Tasks is down")

    monkeypatch.setattr(start, "enqueue_draft_job", unavailable)
    await finish_interview(client, db)
    with pytest.raises(RuntimeError):
        await client.post(DRAFT, headers=headers())
    assert await draft_status(db) == "failed"


async def test_only_the_project_admin_can_start(client: httpx.AsyncClient, db: AsyncClient) -> None:
    await finish_interview(client, db)
    response = await client.post(DRAFT, headers=headers(uid="user_stranger"))
    assert response.status_code == 403


async def test_drafting_closes_the_advisor(client: httpx.AsyncClient, db: AsyncClient) -> None:
    await client.post(SESSION, headers=headers())
    await project_ref(db, PROJECT_ID).update({"draftStatus": "queued"})
    use_model(FakeModel(message(text(advisor_json("background_idea")))))
    response = await client.post(
        f"/v1/projects/{PROJECT_ID}/advisor/turns",
        headers=headers(),
        json={"reply": "One more thing", "expectedTurnIndex": 0},
    )
    assert response.status_code == 409


# ---------------------------------------------------------------------------
# The worker
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "request_headers",
    [{}, {"Authorization": "Bearer forged"}, {"Authorization": "Bearer other"}],
    ids=["no token", "invalid token", "another account"],
)
async def test_the_worker_accepts_only_cloud_tasks(
    client: httpx.AsyncClient, db: AsyncClient, request_headers: dict[str, str]
) -> None:
    await project_ref(db, PROJECT_ID).update({"draftStatus": "queued"})
    response = await client.post(TASK, headers=request_headers, json={"projectId": PROJECT_ID})
    assert response.status_code == 401
    assert await draft_status(db) == "queued"


async def test_the_job_drafts_reviews_and_saves_the_draft_with_its_threads(
    client: httpx.AsyncClient, db: AsyncClient, documents: FakeDraftDocument
) -> None:
    await finish_interview(client, db)
    await client.post(DRAFT, headers=headers())
    model = use_model(drafting_then_review())

    response = await run_task(client)
    assert response.status_code == 204
    assert await draft_status(db) == "ready"

    # Drafting got the template and the transcript (with the question list), cached as one prefix.
    drafting_input = model.calls[0]["messages"][0]["content"]
    assert drafting_input[0]["text"].startswith("<agreement_template")
    assert "50/50" in drafting_input[1]["text"]
    assert drafting_input[1]["cache_control"] == {"type": "ephemeral", "ttl": "5m"}
    # Review read the converted draft with its block ids.
    review_input = model.calls[1]["messages"][0]["content"]
    assert "[b1] The founders split equity 50/50." in review_input[2]["text"]

    [(fixes, anchors)] = documents.applied
    assert fixes == [DraftFix(op="replace", para="b1", old="founders", new="Founders")]
    [anchor] = anchors

    draft = (await draft_ref(db, PROJECT_ID).get()).to_dict() or {}
    assert draft["version"] == 1
    assert draft["templateVersion"].startswith("agreement-template.md@")
    assert draft["blockVersions"] == {"b0": 1, "b1": 1}
    assert draft["content"][1] == {
        "type": "p",
        "id": "b1",
        "children": [{"text": "The founders split equity 50/50."}],
    }

    thread = (
        await project_ref(db, PROJECT_ID).collection("threads").document(anchor.thread_id).get()
    ).to_dict() or {}
    assert thread["status"] == "open"
    assert thread["createdBy"] == "agent"
    assert [(m["author"], m["uid"], m["text"]) for m in thread["messages"]] == [
        ("agent", None, "Is 50/50 final?")
    ]


async def test_a_retry_after_success_never_creates_a_second_draft(
    client: httpx.AsyncClient, db: AsyncClient, documents: FakeDraftDocument
) -> None:
    await finish_interview(client, db)
    await client.post(DRAFT, headers=headers())
    use_model(drafting_then_review())
    await run_task(client)
    first = (await draft_ref(db, PROJECT_ID).get()).to_dict()

    model = use_model(FakeModel())
    response = await run_task(client, retry_count=1)
    assert response.status_code == 204
    assert model.calls == []
    assert (await draft_ref(db, PROJECT_ID).get()).to_dict() == first


async def test_a_failed_attempt_is_retried_until_the_last_one_fails_the_job(
    client: httpx.AsyncClient, db: AsyncClient, documents: FakeDraftDocument
) -> None:
    await finish_interview(client, db)
    await client.post(DRAFT, headers=headers())

    def model_down() -> None:
        raise RuntimeError("model unavailable")

    for attempt in range(DRAFT_JOB_MAX_ATTEMPTS - 1):
        use_model(FakeModel(model_down))
        response = await run_task(client, retry_count=attempt)
        assert response.status_code == 503
        assert await draft_status(db) == "drafting"

    use_model(FakeModel(model_down))
    response = await run_task(client, retry_count=DRAFT_JOB_MAX_ATTEMPTS - 1)
    assert response.status_code == 204
    assert await draft_status(db) == "failed"
    assert not (await draft_ref(db, PROJECT_ID).get()).exists


async def test_a_refusal_fails_the_job_without_retrying(
    client: httpx.AsyncClient, db: AsyncClient, documents: FakeDraftDocument
) -> None:
    await finish_interview(client, db)
    await client.post(DRAFT, headers=headers())
    use_model(FakeModel(message(stop_reason="refusal")))
    response = await run_task(client)
    assert response.status_code == 204
    assert await draft_status(db) == "failed"

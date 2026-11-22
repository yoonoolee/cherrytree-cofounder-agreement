"""The draft editor's endpoints: saving, agent rewrites and comment threads."""

import json
from datetime import UTC, datetime
from typing import Any

import httpx
import pytest
from google.cloud.firestore import AsyncClient

from cherrytree_agent.editing.run import REPLY_FAILED
from cherrytree_agent.firebase import (
    draft_ref,
    edit_ref,
    project_ref,
    thread_ref,
)
from tests.helpers import PROJECT_ID, FakeModel, headers, message, text, use_model

BASE = f"/v1/projects/{PROJECT_ID}"
THREAD = "thread_abc123"
QUOTE = "The founders split equity 50/50."


def content(sentence: str = QUOTE) -> list[dict[str, Any]]:
    return [
        {"type": "h1", "id": "b0", "children": [{"text": "Cofounder Agreement"}]},
        {"type": "p", "id": "b1", "children": [{"text": sentence}]},
    ]


@pytest.fixture
async def draft(client: httpx.AsyncClient, db: AsyncClient) -> None:
    now = datetime.now(UTC)
    await project_ref(db, PROJECT_ID).update({"draftStatus": "ready"})
    await draft_ref(db, PROJECT_ID).set(
        {"templateVersion": "t@1", "version": 3, "content": content(), "updatedAt": now}
    )


def reply(**output: Any) -> FakeModel:
    return use_model(FakeModel(message(text(json.dumps(output)))))


async def thread(db: AsyncClient, thread_id: str = THREAD) -> dict[str, Any]:
    return (await thread_ref(db, PROJECT_ID, thread_id).get()).to_dict() or {}


# ---------------------------------------------------------------------------
# Saving
# ---------------------------------------------------------------------------


async def test_saves_on_top_of_the_current_version_only(
    client: httpx.AsyncClient, db: AsyncClient, draft: None
) -> None:
    edited = content("The Founders split equity 60/40.")
    saved = await client.put(
        f"{BASE}/draft", headers=headers(), json={"content": edited, "version": 3}
    )
    assert saved.json() == {"version": 4}
    stored = (await draft_ref(db, PROJECT_ID).get()).to_dict() or {}
    assert (stored["version"], stored["content"]) == (4, edited)

    stale = await client.put(
        f"{BASE}/draft", headers=headers(), json={"content": content(), "version": 3}
    )
    assert stale.status_code == 409


async def test_rejects_a_document_with_repeated_block_ids(
    client: httpx.AsyncClient, draft: None
) -> None:
    blocks = content()
    blocks[1]["id"] = "b0"
    response = await client.put(
        f"{BASE}/draft", headers=headers(), json={"content": blocks, "version": 3}
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Agent rewrites
# ---------------------------------------------------------------------------


async def test_a_rewrite_answers_with_the_new_text_and_logs_it(
    client: httpx.AsyncClient, db: AsyncClient, draft: None
) -> None:
    model = reply(
        message="I made it plainer.",
        title="Smoothed the wording",
        replacement="The founders share equity evenly.",
    )
    response = await client.post(
        f"{BASE}/draft/edits",
        headers=headers(),
        json={"quote": QUOTE, "instruction": "make it plainer"},
    )
    body = response.json()
    assert body["replacement"] == "The founders share equity evenly."
    assert (body["message"], body["title"]) == ("I made it plainer.", "Smoothed the wording")

    sent = model.calls[0]["messages"][0]["content"]
    assert f"[b1] {QUOTE}" in sent[2]["text"]
    assert sent[3]["text"] == f"<quote>\n{QUOTE}\n</quote>"

    logged = (await edit_ref(db, PROJECT_ID, body["id"]).get()).to_dict() or {}
    assert (logged["quote"], logged["status"]) == (QUOTE, "applied")

    undo = await client.post(f"{BASE}/draft/edits/{body['id']}/undo", headers=headers())
    assert undo.status_code == 204
    undone = (await edit_ref(db, PROJECT_ID, body["id"]).get()).to_dict() or {}
    assert undone["status"] == "undone"


async def test_there_is_nothing_to_edit_before_the_draft_is_ready(
    client: httpx.AsyncClient,
) -> None:
    reply(message="", title="", replacement="")
    response = await client.post(
        f"{BASE}/draft/edits", headers=headers(), json={"quote": QUOTE, "instruction": "shorter"}
    )
    assert response.status_code == 409


# ---------------------------------------------------------------------------
# Comment threads
# ---------------------------------------------------------------------------


async def test_a_comment_starts_a_thread_and_the_agent_suggests_wording(
    client: httpx.AsyncClient, db: AsyncClient, draft: None
) -> None:
    reply(message="Here's wording for that:", suggestion="The founders split equity 60/40.")
    response = await client.post(
        f"{BASE}/threads",
        headers=headers(),
        json={"threadId": THREAD, "quote": QUOTE, "text": "We agreed on 60/40."},
    )
    assert response.status_code == 204
    saved = await thread(db)
    assert (saved["status"], saved["createdBy"], saved["quote"]) == ("open", "user", QUOTE)
    assert [(m["author"], m["text"], m["suggestion"]) for m in saved["messages"]] == [
        ("user", "We agreed on 60/40.", None),
        ("agent", "Here's wording for that:", "The founders split equity 60/40."),
    ]

    again = await client.post(
        f"{BASE}/threads",
        headers=headers(),
        json={"threadId": THREAD, "quote": QUOTE, "text": "Again"},
    )
    assert again.status_code == 409


async def test_a_reply_gets_an_answer_and_approving_resolves_the_thread(
    client: httpx.AsyncClient, db: AsyncClient, draft: None
) -> None:
    reply(message="Noted.", suggestion=None)
    await client.post(
        f"{BASE}/threads",
        headers=headers(),
        json={"threadId": THREAD, "quote": QUOTE, "text": "Is this standard?"},
    )
    model = reply(message="Yes, for two founders.", suggestion=None)
    await client.post(
        f"{BASE}/threads/{THREAD}/messages", headers=headers(), json={"text": "And for three?"}
    )
    assert "User: And for three?" in model.calls[0]["messages"][0]["content"][4]["text"]
    assert [m["text"] for m in (await thread(db))["messages"]][-1] == "Yes, for two founders."

    await client.post(
        f"{BASE}/threads/{THREAD}/status", headers=headers(), json={"status": "resolved"}
    )
    assert (await thread(db))["status"] == "resolved"
    closed = await client.post(
        f"{BASE}/threads/{THREAD}/messages", headers=headers(), json={"text": "One more"}
    )
    assert closed.status_code == 409


async def test_a_failed_reply_still_answers_so_no_thread_waits(
    client: httpx.AsyncClient, db: AsyncClient, draft: None
) -> None:
    def fail() -> None:
        raise RuntimeError("model down")

    use_model(FakeModel(fail))
    await client.post(
        f"{BASE}/threads",
        headers=headers(),
        json={"threadId": THREAD, "quote": QUOTE, "text": "Thoughts?"},
    )
    assert [m["text"] for m in (await thread(db))["messages"]] == ["Thoughts?", REPLY_FAILED]

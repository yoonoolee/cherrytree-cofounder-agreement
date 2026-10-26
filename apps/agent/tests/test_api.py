"""The HTTP API against the Firestore emulator, with token verification and the model faked."""

import json
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
import pytest
from google.cloud.firestore import AsyncClient

from cherrytree_agent.firebase import advisor_state_ref, project_ref
from cherrytree_agent.rate_limit import AGENT_RUNS_PER_WINDOW
from tests.helpers import (
    ADMIN,
    PROJECT_ID,
    STRANGER,
    FakeModel,
    advisor_json,
    headers,
    message,
    text,
    tool_use,
    use_model,
)

SESSION = f"/v1/projects/{PROJECT_ID}/advisor/session"
TURNS = f"/v1/projects/{PROJECT_ID}/advisor/turns"


def events(response: httpx.Response) -> list[dict[str, Any]]:
    return [
        json.loads(line.removeprefix("data: "))
        for line in response.text.splitlines()
        if line.startswith("data: ")
    ]


async def send(client: httpx.AsyncClient, reply: str, index: int = 0) -> httpx.Response:
    return await client.post(
        TURNS, headers=headers(), json={"reply": reply, "expectedTurnIndex": index}
    )


async def saved(db: AsyncClient, collection: str) -> list[dict[str, Any]]:
    docs = project_ref(db, PROJECT_ID).collection(collection).order_by("index").stream()
    return [snapshot.to_dict() async for snapshot in docs]


async def state(db: AsyncClient) -> dict[str, Any]:
    snapshot = await advisor_state_ref(db, PROJECT_ID).get()
    return snapshot.to_dict() or {}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("request_headers", "status"),
    [
        ({}, 401),
        (headers(app_check="consumed"), 401),
        (headers(app_check="forged"), 401),
        ({"X-Firebase-AppCheck": "valid"}, 401),
        ({"X-Firebase-AppCheck": "valid", "Authorization": "Bearer forged"}, 401),
        (headers(uid=STRANGER), 403),
    ],
    ids=[
        "no tokens",
        "replayed App Check",
        "invalid App Check",
        "no ID token",
        "bad ID token",
        "not a member",
    ],
)
async def test_rejects_unverified_callers(
    client: httpx.AsyncClient, request_headers: dict[str, str], status: int
) -> None:
    response = await client.post(SESSION, headers=request_headers)
    assert response.status_code == status


async def test_a_missing_project_looks_like_one_you_cannot_access(
    client: httpx.AsyncClient,
) -> None:
    response = await client.post("/v1/projects/org_missing/advisor/session", headers=headers())
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------


async def test_starting_the_session_copies_the_questions_once(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    first = await client.post(SESSION, headers=headers())
    assert first.json() == {"turnCount": 0}
    created = await state(db)
    assert created["sections"][0]["questions"][0]["status"] == "current"

    await advisor_state_ref(db, PROJECT_ID).update({"turnCount": 3})
    again = await client.post(SESSION, headers=headers())
    assert again.json() == {"turnCount": 3}


# ---------------------------------------------------------------------------
# Turns
# ---------------------------------------------------------------------------


async def test_a_turn_streams_and_saves_with_its_question_list_changes(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    response_json = advisor_json(
        highlights=["at a park"],
        answer="That's a long friendship.",
        question={
            "type": "next_question",
            "text": "Whose idea was the company, and what work happened before you teamed up?",
        },
    )
    use_model(
        FakeModel(
            message(
                tool_use(
                    "t1",
                    "update_questions",
                    {
                        "additions": [],
                        "updates": [
                            {
                                "question_id": "background_meet",
                                "status": "done",
                                "advisor_notes": None,
                            },
                            {
                                "question_id": "background_idea",
                                "status": "current",
                                "advisor_notes": None,
                            },
                        ],
                    },
                ),
                stop_reason="tool_use",
            ),
            message(text(response_json)),
        )
    )

    response = await send(client, "We met at a park.")

    assert response.headers["content-type"].startswith("text/event-stream")
    stream = events(response)
    assert [e["type"] for e in stream if e["type"] != "answer_delta"] == [
        "highlights",
        "sources",
        "done",
    ]
    assert "".join(e["text"] for e in stream if e["type"] == "answer_delta") == (
        "That's a long friendship."
    )
    assert stream[-1] == {"type": "done", "index": 0, "response": json.loads(response_json)}

    [turn] = await saved(db, "turns")
    assert turn["uid"] == ADMIN
    assert turn["reply"] == "We met at a park."
    assert turn["response"] == json.loads(response_json)

    [entry] = await saved(db, "transcript")
    replay = json.loads(entry["messages"])
    assert [m["role"] for m in replay] == ["user", "assistant", "user", "assistant"]
    assert replay[0]["content"][1] == {"type": "text", "text": "We met at a park."}
    assert "<question_list>" in replay[0]["content"][0]["text"]

    saved_state = await state(db)
    assert saved_state["turnCount"] == 1
    statuses = {q["id"]: q["status"] for q in saved_state["sections"][0]["questions"]}
    assert statuses == {"background_meet": "done", "background_idea": "current"}


async def test_the_next_turn_replays_the_saved_history_exactly(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    use_model(FakeModel(message(text(advisor_json(answer="One.")))))
    await send(client, "First reply.")
    [entry] = await saved(db, "transcript")

    model = use_model(FakeModel(message(text(advisor_json(answer="Two.")))))
    response = await send(client, "Second reply.", index=1)

    assert events(response)[-1]["type"] == "done"
    sent = model.calls[0]["messages"]
    assert sent[:-1] == json.loads(entry["messages"])
    assert sent[-1]["content"][1]["text"] == "Second reply."


async def test_a_stale_send_is_rejected_before_streaming(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    use_model(FakeModel())
    response = await send(client, "Hello", index=1)
    assert response.status_code == 409
    assert await saved(db, "turns") == []


async def test_a_reply_must_not_be_empty(client: httpx.AsyncClient) -> None:
    await client.post(SESSION, headers=headers())
    response = await send(client, "")
    assert response.status_code == 422


@pytest.mark.parametrize(
    ("model", "code"),
    [
        (
            FakeModel(
                message(
                    stop_reason="refusal",
                    stop_details={"type": "refusal", "category": "cyber", "explanation": None},
                )
            ),
            "refusal",
        ),
        (FakeModel(message(text("not the response format"))), "temporary"),
        (FakeModel(message(text('{"highlights": ['), stop_reason="max_tokens")), "temporary"),
    ],
    ids=["refusal", "invalid response", "cut off"],
)
async def test_a_failed_turn_saves_nothing(
    client: httpx.AsyncClient, db: AsyncClient, model: FakeModel, code: str
) -> None:
    await client.post(SESSION, headers=headers())
    before = await state(db)
    use_model(model)

    response = await send(client, "Hello")

    assert events(response)[-1] == {"type": "error", "code": code}
    assert await saved(db, "turns") == []
    assert await saved(db, "transcript") == []
    assert await state(db) == before


async def test_a_turn_saved_meanwhile_wins(client: httpx.AsyncClient, db: AsyncClient) -> None:
    await client.post(SESSION, headers=headers())

    async def another_tab_saves_first() -> None:
        await advisor_state_ref(db, PROJECT_ID).update({"turnCount": 1})

    use_model(FakeModel(another_tab_saves_first, message(text(advisor_json(answer="Late.")))))
    response = await send(client, "Hello")

    assert events(response)[-1] == {"type": "error", "code": "stale"}
    assert await saved(db, "turns") == []


async def test_turns_are_rate_limited_per_user(client: httpx.AsyncClient, db: AsyncClient) -> None:
    await client.post(SESSION, headers=headers())
    limits = db.collection("rateLimits").document(ADMIN)
    await limits.set({"windowStart": datetime.now(UTC), "count": AGENT_RUNS_PER_WINDOW})
    use_model(FakeModel())

    response = await send(client, "Hello")

    assert response.status_code == 429
    assert 0 < int(response.headers["Retry-After"]) <= 3600
    assert await saved(db, "turns") == []


async def test_the_rate_limit_window_resets(client: httpx.AsyncClient, db: AsyncClient) -> None:
    await client.post(SESSION, headers=headers())
    limits = db.collection("rateLimits").document(ADMIN)
    an_hour_ago = datetime.now(UTC) - timedelta(hours=1, seconds=1)
    await limits.set({"windowStart": an_hour_ago, "count": AGENT_RUNS_PER_WINDOW})
    use_model(FakeModel(message(text(advisor_json(answer="Hi.")))))

    response = await send(client, "Hello")

    assert events(response)[-1]["type"] == "done"
    assert ((await limits.get()).to_dict() or {})["count"] == 1


async def test_the_saved_question_follows_the_question_list(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    """The model moved to the next question but sent a follow-up: the turn opens its screen."""
    await client.post(SESSION, headers=headers())
    use_model(
        FakeModel(
            message(
                tool_use(
                    "t1",
                    "update_questions",
                    {
                        "additions": [],
                        "updates": [
                            {
                                "question_id": "background_meet",
                                "status": "done",
                                "advisor_notes": None,
                            },
                            {
                                "question_id": "background_idea",
                                "status": "current",
                                "advisor_notes": None,
                            },
                        ],
                    },
                ),
                stop_reason="tool_use",
            ),
            message(text(advisor_json(question={"type": "followup", "text": "Who wrote code?"}))),
        )
    )
    response = await send(client, "We met at a park, and it was my idea.")
    done = events(response)[-1]
    assert done["response"]["question"] == {
        "type": "next_question",
        "text": "Whose idea was the company, and what work happened before you teamed up?",
    }
    [turn] = await saved(db, "turns")
    assert turn["response"]["question"] == done["response"]["question"]

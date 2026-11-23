"""The HTTP API against the Firestore emulator, with token verification and the model faked."""

import json
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
import pytest
from google.cloud.firestore import AsyncClient

from cherrytree_agent.firebase import advisor_state_ref, project_ref
from cherrytree_agent.rate_limit import AGENT_RUNS_PER_WINDOW
from cherrytree_agent.settings import get_settings
from tests.helpers import (
    ADMIN,
    PROJECT_ID,
    STRANGER,
    FakeModel,
    advisor_json,
    btw_json,
    followup_update,
    headers,
    message,
    status_update,
    text,
    tool_use,
    use_model,
)

SESSION = f"/v1/projects/{PROJECT_ID}/advisor/session"
TURNS = f"/v1/projects/{PROJECT_ID}/advisor/turns"
BTW = f"/v1/projects/{PROJECT_ID}/advisor/btw"
SKIP = f"/v1/projects/{PROJECT_ID}/advisor/skip"
REPLY = "We met at a park in middle school. We talked about starting something for years."


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


async def ask_btw(
    client: httpx.AsyncClient, quote: str, question: str, index: int
) -> httpx.Response:
    return await client.post(
        BTW,
        headers=headers(),
        json={"quote": quote, "question": question, "expectedTurnIndex": index},
    )


def items(saved_state: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {i["id"]: i for s in saved_state["sections"] for i in s["checklist"]}


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


async def test_starting_the_session_copies_the_checklist_once(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    first = await client.post(SESSION, headers=headers())
    assert first.json() == {"turnCount": 0}
    created = await state(db)
    assert all(item["status"] == "todo" for item in items(created).values())
    assert [screen["id"] for screen in created["screens"]] == ["screen_1"]

    await advisor_state_ref(db, PROJECT_ID).update({"turnCount": 3})
    again = await client.post(SESSION, headers=headers())
    assert again.json() == {"turnCount": 3}


@pytest.fixture
def dev_tools(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setenv("DEV_TOOLS", "true")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


async def test_skipping_ends_the_interview_with_the_answers_so_far(
    client: httpx.AsyncClient, db: AsyncClient, dev_tools: None
) -> None:
    await client.post(SESSION, headers=headers())
    before = await state(db)
    response = await client.post(SKIP, headers=headers())
    assert response.status_code == 204
    after = await state(db)
    assert after["complete"] is True
    unchanged = {k: v for k, v in after.items() if k not in ("complete", "updatedAt")}
    assert unchanged == {k: v for k, v in before.items() if k not in ("complete", "updatedAt")}

    again = await client.post(SKIP, headers=headers())
    assert again.status_code == 409


async def test_skipping_does_not_exist_without_dev_tools(client: httpx.AsyncClient) -> None:
    get_settings.cache_clear()
    await client.post(SESSION, headers=headers())
    response = await client.post(SKIP, headers=headers())
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Turns
# ---------------------------------------------------------------------------


async def test_a_turn_streams_highlights_and_saves_with_its_checklist_changes(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    use_model(
        FakeModel(
            message(
                tool_use("t1", "add_green_highlights", {"quotes": ["at a park", "middle school"]}),
                tool_use(
                    "t2",
                    "update_checklist",
                    {
                        "updates": [
                            followup_update(
                                "f_idea",
                                "talked about starting something for years",
                                "Whose idea was it to actually start?",
                            ),
                            status_update("company_2", "skipped", "Covered here."),
                        ]
                    },
                ),
                stop_reason="tool_use",
            ),
            message(text(advisor_json("f_idea", answer="That's a long friendship."))),
        )
    )

    response = await send(client, REPLY)

    assert response.headers["content-type"].startswith("text/event-stream")
    stream = events(response)
    assert [e["type"] for e in stream if e["type"] != "answer_delta"] == [
        "green_highlight",
        "green_highlight",
        "red_highlight",
        "done",
    ]
    assert stream[2] == {
        "type": "red_highlight",
        "followupId": "f_idea",
        "highlight": {
            "turn": 0,
            "text": "talked about starting something for years",
            "start": 38,
            "end": 79,
        },
    }
    assert "".join(e["text"] for e in stream if e["type"] == "answer_delta") == (
        "That's a long friendship."
    )
    done_message = {
        "type": "followup",
        "question": None,
        "followupId": "f_idea",
        "answer": "That's a long friendship.",
        "sources": [],
    }
    assert stream[-1] == {"type": "done", "index": 0, "message": done_message}

    [turn] = await saved(db, "turns")
    assert (turn["kind"], turn["uid"], turn["screen"]) == ("turn", ADMIN, "screen_1")
    assert turn["reply"] == REPLY
    assert turn["greenHighlights"] == [
        {"text": "at a park", "start": 7, "end": 16},
        {"text": "middle school", "start": 20, "end": 33},
    ]
    assert turn["message"] == done_message

    [entry] = await saved(db, "transcript")
    replay = json.loads(entry["messages"])
    assert [m["role"] for m in replay] == ["user", "assistant", "user", "assistant"]
    assert replay[0]["content"] == [{"type": "text", "text": REPLY}]

    saved_state = await state(db)
    assert saved_state["turnCount"] == 1
    assert saved_state["screens"][0]["followups"][0]["status"] == "current"
    assert items(saved_state)["company_2"]["status"] == "skipped"


async def test_moving_on_opens_the_next_screen(client: httpx.AsyncClient, db: AsyncClient) -> None:
    await client.post(SESSION, headers=headers())
    use_model(FakeModel(message(text(advisor_json(question="Are you incorporated?")))))
    first = await send(client, REPLY)
    assert events(first)[-1]["message"]["question"] == "Are you incorporated?"

    model = use_model(
        FakeModel(
            message(
                tool_use(
                    "t1",
                    "update_checklist",
                    {"updates": [followup_update("f_x", "my idea")]},
                ),
                stop_reason="tool_use",
            ),
            message(text(advisor_json("f_x"))),
        )
    )
    second = await send(client, "It was my idea.", index=1)

    assert events(second)[-1]["message"]["followupId"] == "f_x"
    turns = await saved(db, "turns")
    assert [t["screen"] for t in turns] == ["screen_1", "screen_2"]
    screens = (await state(db))["screens"]
    assert [(s["id"], s["question"]) for s in screens][1] == ("screen_2", "Are you incorporated?")
    assert screens[1]["followups"][0]["highlight"]["turn"] == 1
    assert len(model.calls) == 2


async def test_a_message_that_does_not_fit_is_rewritten(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    model = use_model(
        FakeModel(
            message(text(advisor_json("no_such_followup"))),
            message(text(advisor_json(question="Are you incorporated?"))),
        )
    )
    response = await send(client, REPLY)

    assert events(response)[-1]["message"]["type"] == "next_question"
    correction = model.calls[1]["messages"][-1]
    assert correction["role"] == "user"
    assert "no_such_followup is not an open follow-up" in correction["content"]
    [entry] = await saved(db, "transcript")
    assert [m["role"] for m in json.loads(entry["messages"])] == [
        "user",
        "assistant",
        "user",
        "assistant",
    ]


async def test_a_btw_answers_and_changes_only_the_history(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    before = await state(db)
    model = use_model(
        FakeModel(
            message(
                tool_use("t1", "add_green_highlights", {"quotes": ["middle school"]}),
                stop_reason="tool_use",
            ),
            message(text(btw_json("Plenty of founders met young."))),
        )
    )

    response = await ask_btw(client, "middle school", "Is that unusual?", 0)

    stream = events(response)
    assert [e["type"] for e in stream if e["type"] != "answer_delta"] == ["btw_done"]
    assert stream[-1]["message"] == {
        "type": "answer",
        "text": "Plenty of founders met young.",
        "sources": [],
    }
    tool_result = model.calls[1]["messages"][-1]["content"][0]
    assert tool_result["is_error"] is True
    assert "btw" in tool_result["content"]
    sent = model.calls[0]["messages"][-1]["content"]
    assert "<checklist>" in sent[0]["text"]
    assert "<selected_text>\nmiddle school\n</selected_text>" in sent[1]["text"]
    assert sent[2]["text"] == "Is that unusual?"

    [turn] = await saved(db, "turns")
    assert (turn["kind"], turn["quote"], turn["question"]) == (
        "btw",
        "middle school",
        "Is that unusual?",
    )
    saved_state = await state(db)
    assert saved_state["turnCount"] == 1
    assert (saved_state["sections"], saved_state["screens"]) == (
        before["sections"],
        before["screens"],
    )


async def test_the_next_turn_replays_the_saved_history_exactly(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    use_model(FakeModel(message(text(advisor_json(question="First?", answer="One.")))))
    await send(client, "First reply.")
    [entry] = await saved(db, "transcript")

    model = use_model(FakeModel(message(text(advisor_json(question="Second?", answer="Two.")))))
    response = await send(client, "Second reply.", index=1)

    assert events(response)[-1]["type"] == "done"
    sent = model.calls[0]["messages"]
    history = json.loads(entry["messages"])
    *earlier, last = sent[:-1]
    assert earlier == history[:-1]
    assert last["content"][:-1] == history[-1]["content"][:-1]
    assert last["content"][-1] == {
        **history[-1]["content"][-1],
        "cache_control": {"type": "ephemeral", "ttl": "1h"},
    }
    current = sent[-1]["content"]
    assert "<checklist>" in current[0]["text"] and "<screen>" in current[0]["text"]
    assert current[1]["text"] == "Second reply."


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
        (FakeModel(*[message(text("not the response format"))] * 3), "temporary"),
        (FakeModel(message(text('{"message": {'), stop_reason="max_tokens")), "temporary"),
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

    use_model(FakeModel(another_tab_saves_first, message(text(advisor_json(question="Next?")))))
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
    use_model(FakeModel(message(text(advisor_json(question="Next?")))))

    response = await send(client, "Hello")

    assert events(response)[-1]["type"] == "done"
    assert ((await limits.get()).to_dict() or {})["count"] == 1

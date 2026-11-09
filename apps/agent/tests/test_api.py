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


def questions(saved_state: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {q["id"]: q for s in saved_state["sections"] for q in s["questions"]}


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


async def test_a_turn_streams_highlights_and_saves_with_its_question_list_changes(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    use_model(
        FakeModel(
            message(
                tool_use("t1", "add_green_highlights", {"quotes": ["at a park", "middle school"]}),
                tool_use(
                    "t2",
                    "update_question_list",
                    {
                        "updates": [
                            followup_update(
                                "f_idea",
                                "background_meet",
                                "talked about starting something for years",
                                "Whose idea was it to actually start?",
                            ),
                            status_update("background_idea", "skipped", "Covered here."),
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
        "questionId": "f_idea",
        "answer": "That's a long friendship.",
        "sources": [],
    }
    assert stream[-1] == {"type": "done", "index": 0, "message": done_message}

    [turn] = await saved(db, "turns")
    assert (turn["kind"], turn["uid"], turn["screen"]) == ("turn", ADMIN, "background_meet")
    assert turn["reply"] == REPLY
    assert turn["greenHighlights"] == [
        {"text": "at a park", "start": 7, "end": 16},
        {"text": "middle school", "start": 20, "end": 33},
    ]
    assert turn["message"] == done_message

    [entry] = await saved(db, "transcript")
    replay = json.loads(entry["messages"])
    assert [m["role"] for m in replay] == ["user", "assistant", "user", "assistant"]
    assert replay[0]["content"][1] == {"type": "text", "text": REPLY}
    assert "<question_list>" in replay[0]["content"][0]["text"]

    saved_state = await state(db)
    assert saved_state["turnCount"] == 1
    listed = questions(saved_state)
    assert listed["background_meet"]["status"] == "current"
    assert listed["background_meet"]["followups"][0]["status"] == "current"
    assert listed["background_idea"]["status"] == "skipped"


async def test_moving_on_opens_the_next_screen(client: httpx.AsyncClient, db: AsyncClient) -> None:
    """The model sent a follow-up type for a main question: the list decides it's next_question."""
    await client.post(SESSION, headers=headers())
    use_model(FakeModel(message(text(advisor_json("background_idea")))))
    first = await send(client, REPLY)
    assert events(first)[-1]["message"]["type"] == "next_question"

    model = use_model(
        FakeModel(
            message(
                tool_use(
                    "t1",
                    "update_question_list",
                    {"updates": [followup_update("f_x", "background_idea", "my idea")]},
                ),
                stop_reason="tool_use",
            ),
            message(text(advisor_json("f_x"))),
        )
    )
    second = await send(client, "It was my idea.", index=1)

    assert events(second)[-1]["message"]["questionId"] == "f_x"
    turns = await saved(db, "turns")
    assert [t["screen"] for t in turns] == ["background_meet", "background_idea"]
    listed = questions(await state(db))
    assert listed["background_meet"]["status"] == "done"
    assert listed["background_idea"]["followups"][0]["highlight"]["turn"] == 1
    assert len(model.calls) == 2


async def test_a_message_that_does_not_fit_is_rewritten(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    model = use_model(
        FakeModel(
            message(text(advisor_json("no_such_question"))),
            message(text(advisor_json("background_idea"))),
        )
    )
    response = await send(client, REPLY)

    assert events(response)[-1]["message"]["questionId"] == "background_idea"
    correction = model.calls[1]["messages"][-1]
    assert correction["role"] == "user"
    assert "Unknown id: no_such_question" in correction["content"]
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
    before = questions(await state(db))
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
    assert "<selected_text>\nmiddle school\n</selected_text>" in sent[0]["text"]
    assert sent[1]["text"] == "Is that unusual?"

    [turn] = await saved(db, "turns")
    assert (turn["kind"], turn["quote"], turn["question"]) == (
        "btw",
        "middle school",
        "Is that unusual?",
    )
    saved_state = await state(db)
    assert saved_state["turnCount"] == 1
    assert questions(saved_state) == before


async def test_the_next_turn_replays_the_saved_history_exactly(
    client: httpx.AsyncClient, db: AsyncClient
) -> None:
    await client.post(SESSION, headers=headers())
    use_model(FakeModel(message(text(advisor_json("background_idea", answer="One.")))))
    await send(client, "First reply.")
    [entry] = await saved(db, "transcript")

    model = use_model(FakeModel(message(text(advisor_json("roles_titles", answer="Two.")))))
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

    use_model(FakeModel(another_tab_saves_first, message(text(advisor_json("background_idea")))))
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
    use_model(FakeModel(message(text(advisor_json("background_idea")))))

    response = await send(client, "Hello")

    assert events(response)[-1]["type"] == "done"
    assert ((await limits.get()).to_dict() or {})["count"] == 1

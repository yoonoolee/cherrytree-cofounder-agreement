"""Builders and fakes shared by the tests."""

import json
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from anthropic.types.beta import BetaMessage

from cherrytree_agent.main import app, get_call_model

PROJECT_ID = "org_1"
ADMIN = "user_admin"
STRANGER = "user_stranger"


PROJECT = {
    "name": "Acme",
    "members": {ADMIN: {"role": "admin"}},
    "onboardingCompleted": {ADMIN: False},
    "currentPlan": "starter",
    "payments": {},
    "draftStatus": None,
    "createdAt": datetime(2026, 1, 1, tzinfo=UTC),
    "lastUpdated": datetime(2026, 1, 1, tzinfo=UTC),
    "lastOpened": datetime(2026, 1, 1, tzinfo=UTC),
}


def headers(uid: str = ADMIN, app_check: str = "valid") -> dict[str, str]:
    """A browser request's tokens, as the faked verifiers in conftest.py accept them."""
    return {"Authorization": f"Bearer uid:{uid}", "X-Firebase-AppCheck": app_check}


# ---------------------------------------------------------------------------
# Model responses
# ---------------------------------------------------------------------------


def message(*content: dict[str, Any], stop_reason: str = "end_turn", **fields: Any) -> BetaMessage:
    return BetaMessage.model_validate(
        {
            "id": "msg_1",
            "type": "message",
            "role": "assistant",
            "model": "claude-opus-5-5",
            "content": list(content),
            "stop_reason": stop_reason,
            "stop_sequence": None,
            "usage": {"input_tokens": 10, "output_tokens": 5},
            **fields,
        }
    )


def text(value: str) -> dict[str, Any]:
    return {"type": "text", "text": value}


def tool_use(tool_id: str, name: str, tool_input: dict[str, Any]) -> dict[str, Any]:
    return {"type": "tool_use", "id": tool_id, "name": name, "input": tool_input}


def advisor_json(
    question_id: str | None = None,
    *,
    type: str = "followup",
    answer: str | None = None,
) -> str:
    """A turn's output."""
    return json.dumps(
        {"message": {"type": type, "questionId": question_id, "answer": answer, "sources": []}}
    )


def btw_json(answer: str) -> str:
    return json.dumps({"message": {"type": "answer", "text": answer, "sources": []}})


def followup_update(
    followup_id: str, under: str, highlight: str, text: str = "Tell me more?"
) -> dict[str, Any]:
    return {
        "op": "add",
        "id": followup_id,
        "under": under,
        "highlight": highlight,
        "text": text,
        "description": None,
        "status": None,
        "note": None,
    }


def status_update(item_id: str, status: str, note: str | None = None) -> dict[str, Any]:
    return {
        "op": "status",
        "id": item_id,
        "under": None,
        "highlight": None,
        "text": None,
        "description": None,
        "status": status,
        "note": note,
    }


type Step = BetaMessage | Callable[[], Any]


class FakeModel:
    """Plays scripted responses in order, streaming their text and tool inputs in small chunks. A
    callable step runs (awaited if async) before the next response, e.g. to change Firestore
    mid-run."""

    def __init__(self, *steps: Step) -> None:
        self.steps = list(steps)
        self.calls: list[dict[str, Any]] = []

    async def __call__(self, settings: Any, **kwargs: Any) -> BetaMessage:
        self.calls.append(json.loads(json.dumps(kwargs, default=str)))
        step = self.steps.pop(0)
        while callable(step) and not isinstance(step, BetaMessage):
            result = step()
            if hasattr(result, "__await__"):
                await result
            step = self.steps.pop(0)
        handler = kwargs["handler"]
        await handler.on_message_start()
        for block in step.content:
            if block.type == "text":
                for start in range(0, len(block.text), 7):
                    await handler.on_text(block.text[start : start + 7])
            elif block.type == "tool_use":
                tool_input = json.dumps(block.input)
                for end in range(7, len(tool_input) + 7, 7):
                    await handler.on_tool_input(block.id, block.name, tool_input[:end])
        return step


def use_model(model: FakeModel) -> FakeModel:
    app.dependency_overrides[get_call_model] = lambda: model
    return model


class RecordingHandler:
    def __init__(self) -> None:
        self.text = ""
        self.starts = 0
        self.tool_inputs: dict[str, str] = {}
        self.tool_results: dict[str, bool] = {}

    async def on_message_start(self) -> None:
        self.starts += 1

    async def on_text(self, text: str) -> None:
        self.text += text

    async def on_tool_input(self, tool_use_id: str, name: str, partial_json: str) -> None:
        self.tool_inputs[tool_use_id] = partial_json

    async def on_tool_result(self, tool_use_id: str, is_error: bool) -> None:
        self.tool_results[tool_use_id] = is_error

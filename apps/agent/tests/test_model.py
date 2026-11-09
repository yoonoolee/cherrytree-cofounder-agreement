from collections.abc import AsyncIterator
from types import SimpleNamespace
from typing import Any

import pytest
from anthropic.types.beta import BetaMessage

from cherrytree_agent.advisor.config import ADVISOR
from cherrytree_agent.llm import model
from cherrytree_agent.llm.model import request_params, usage_and_cost
from cherrytree_agent.tools.registry import definitions
from tests.helpers import RecordingHandler, message, text


def test_every_call_uses_the_designed_settings() -> None:
    params = request_params(
        ADVISOR.model,
        system="System prompt",
        messages=[],
        tools=definitions(ADVISOR.tools),
        output_schema=ADVISOR.output_schema,
    )
    assert params["model"] == "claude-sonnet-5-5"
    assert params["thinking"] == {"type": "adaptive"}
    assert params["output_config"]["effort"] == "medium"
    assert params["output_config"]["format"]["type"] == "json_schema"
    assert params["fallbacks"] == "default"
    assert set(params["betas"]) == {"compact-2026-01-12", "server-side-fallback-2026-07-01"}
    assert params["system"][0]["cache_control"] == {"type": "ephemeral", "ttl": "1h"}
    assert params["cache_control"] == {"type": "ephemeral"}
    assert params["context_management"]["edits"][0]["trigger"]["value"] == 350_000
    assert "temperature" not in params


def test_the_advisor_message_keeps_the_streaming_order() -> None:
    schema = ADVISOR.output_schema
    assert schema is not None
    assert schema["required"] == ["message"]
    turn_message = schema["$defs"]["AdvisorMessage"]
    assert turn_message["required"] == ["type", "questionId", "answer", "sources"]
    assert turn_message["additionalProperties"] is False


def test_our_tools_are_strict_and_server_tools_are_declared_by_type() -> None:
    tools = {tool["name"]: tool for tool in definitions(ADVISOR.tools)}
    assert tools["web_search"]["type"] == "web_search_20260318"
    assert tools["web_fetch"]["type"] == "web_fetch_20260209"
    for name in ("add_green_highlights", "update_question_list", "read_project", "search_rag"):
        assert tools[name]["strict"] is True
        assert tools[name]["input_schema"]["additionalProperties"] is False
    # The highlight tools stream their input, so highlights show as they are written.
    eager = {name for name, tool in tools.items() if tool.get("eager_input_streaming")}
    assert eager == {"add_green_highlights", "update_question_list"}


def test_cost_counts_every_attempt_cache_write_ttl_and_search() -> None:
    usage = {
        "input_tokens": 1_000,
        "output_tokens": 100,
        "server_tool_use": {"web_search_requests": 2, "web_fetch_requests": 1},
        "iterations": [
            {
                "type": "compaction",
                "input_tokens": 1_000_000,
                "output_tokens": 1_000,
                "cache_read_input_tokens": 0,
                "cache_creation_input_tokens": 0,
            },
            {
                "type": "message",
                "model": "claude-opus-5-5",
                "input_tokens": 1_000,
                "output_tokens": 100,
                "cache_read_input_tokens": 100_000,
                "cache_creation_input_tokens": 30_000,
                "cache_creation": {
                    "ephemeral_5m_input_tokens": 10_000,
                    "ephemeral_1h_input_tokens": 20_000,
                },
            },
        ],
    }
    result: BetaMessage = message(text("{}"), usage=usage)
    tokens, cost = usage_and_cost(result)
    assert tokens == {
        "input": 1_001_000,
        "output": 1_100,
        "cache_read": 100_000,
        "cache_write_5m": 10_000,
        "cache_write_1h": 20_000,
        "web_search_requests": 2,
    }
    expected = (
        1_001_000 * 4 + 1_100 * 20 + 100_000 * 0.2 + 10_000 * 5 + 20_000 * 8
    ) / 1_000_000 + 2 * 0.01
    assert cost == {"total": round(expected, 6)}


class _FakeStream:
    """Stands in for the SDK's beta message stream: events, then the accumulated message."""

    request_id = "req_1"

    def __init__(self, events: list[Any], final: BetaMessage) -> None:
        self.events = events
        self.final = final
        self.params: dict[str, Any] = {}

    async def __aenter__(self) -> "_FakeStream":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    def __aiter__(self) -> AsyncIterator[Any]:
        async def events() -> AsyncIterator[Any]:
            for event in self.events:
                yield event

        return events()

    async def get_final_message(self) -> BetaMessage:
        return self.final


async def test_call_model_streams_text_and_tool_input_to_the_handler(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    final = message(text('{"a": 1}'))

    def delta(index: int, **fields: str) -> SimpleNamespace:
        return SimpleNamespace(
            type="content_block_delta", index=index, delta=SimpleNamespace(**fields)
        )

    tool = SimpleNamespace(type="tool_use", id="t1", name="add_green_highlights")
    events = [
        SimpleNamespace(type="message_start"),
        delta(0, type="text_delta", text='{"a"'),
        SimpleNamespace(type="content_block_start", index=1, content_block=tool),
        delta(1, type="input_json_delta", partial_json='{"quotes": ['),
        delta(1, type="input_json_delta", partial_json='"x"]}'),
        delta(0, type="text_delta", text=": 1}"),
    ]
    stream = _FakeStream(events, final)

    def open_stream(**params: Any) -> _FakeStream:
        stream.params = params
        return stream

    client = SimpleNamespace(beta=SimpleNamespace(messages=SimpleNamespace(stream=open_stream)))
    monkeypatch.setattr(model, "_client", lambda: client)
    handler = RecordingHandler()

    result = await model.call_model(
        ADVISOR.model, system="S", messages=[], tools=[], output_schema=None, handler=handler
    )

    assert result is final
    assert handler.starts == 1
    assert handler.text == '{"a": 1}'
    assert handler.tool_inputs == {"t1": '{"quotes": ["x"]}'}
    assert stream.params["model"] == "claude-sonnet-5-5"

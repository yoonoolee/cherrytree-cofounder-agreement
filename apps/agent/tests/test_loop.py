import json
from typing import Any

import pytest

from cherrytree_agent.advisor.config import ADVISOR
from cherrytree_agent.advisor.session import initial_state
from cherrytree_agent.advisor.working_state import AdvisorWorkingState
from cherrytree_agent.llm.loop import (
    IncompleteResponseError,
    RefusalError,
    replayable_content,
    run_agent,
)
from cherrytree_agent.tools.context import ToolContext
from tests.helpers import FakeModel, RecordingHandler, message, status_update, text, tool_use

USER = {"role": "user", "content": [{"type": "text", "text": "We met in 2011."}]}


def context() -> ToolContext:
    state = AdvisorWorkingState.start(
        initial_state(),
        kind="turn",
        index=0,
        screen="background_meet",
        replies={0: "We met in 2011."},
    )
    return ToolContext(db=None, project_id="org_1", advisor=state)  # type: ignore[arg-type]


async def run(
    model: FakeModel, ctx: ToolContext | None = None, handler: RecordingHandler | None = None
) -> Any:
    return await run_agent(
        ADVISOR,
        history=[],
        new_messages=[USER],
        context=ctx or context(),
        handler=handler or RecordingHandler(),
        call=model,
    )


async def test_runs_tools_until_the_model_answers() -> None:
    ctx = context()
    handler = RecordingHandler()
    change = {"updates": [status_update("background_idea", "skipped")]}
    model = FakeModel(
        message(tool_use("t1", "update_question_list", change), stop_reason="tool_use"),
        message(text('{"done": true}')),
    )
    result = await run(model, ctx, handler)

    assert ctx.advisor is not None
    assert ctx.advisor.sections[0].questions[1].status == "skipped"
    assert handler.tool_results == {"t1": False}
    assert handler.tool_inputs["t1"] == json.dumps(change)
    assert [m["role"] for m in result.messages] == ["user", "assistant", "user", "assistant"]
    assert result.messages[2]["content"][0]["tool_use_id"] == "t1"
    assert "is_error" not in result.messages[2]["content"][0]
    assert result.text == '{"done": true}'
    # The second call sees the tool result.
    assert model.calls[1]["messages"][-1]["content"][0]["type"] == "tool_result"


async def test_tool_errors_go_back_to_the_model() -> None:
    handler = RecordingHandler()
    model = FakeModel(
        message(
            tool_use("t1", "update_question_list", {"updates": [status_update("nope", "done")]}),
            tool_use("t2", "update_question_list", {"bad": "input"}),
            tool_use("t3", "no_such_tool", {}),
            stop_reason="tool_use",
        ),
        message(text("{}")),
    )
    result = await run(model, handler=handler)
    results = result.messages[2]["content"]
    assert [r["tool_use_id"] for r in results] == ["t1", "t2", "t3"]
    assert all(r["is_error"] for r in results)
    assert handler.tool_results == {"t1": True, "t2": True, "t3": True}
    assert "Unknown id" in results[0]["content"]
    assert "Invalid input" in results[1]["content"]
    assert "Unknown tool" in results[2]["content"]


async def test_resumes_a_paused_server_tool_turn() -> None:
    model = FakeModel(message(text(""), stop_reason="pause_turn"), message(text("{}")))
    result = await run(model)
    assert len(model.calls) == 2
    assert [m["role"] for m in result.messages] == ["user", "assistant", "assistant"]


async def test_raises_on_refusal_and_on_max_tokens() -> None:
    refusal = message(
        stop_reason="refusal",
        stop_details={"type": "refusal", "category": "cyber", "explanation": None},
    )
    with pytest.raises(RefusalError) as error:
        await run(FakeModel(refusal))
    assert error.value.category == "cyber"

    with pytest.raises(IncompleteResponseError):
        await run(FakeModel(message(text('{"mess'), stop_reason="max_tokens")))


def test_replay_drops_the_declined_models_blocks_before_a_fallback() -> None:
    declined = message(
        {"type": "thinking", "thinking": "", "signature": "sig"},
        text('{"message": {'),
        {"type": "server_tool_use", "id": "s1", "name": "web_search", "input": {"query": "q"}},
        tool_use("t1", "read_project", {"part": "transcript"}),
        {
            "type": "fallback",
            "from": {"model": "claude-opus-5-5"},
            "to": {"model": "claude-opus-5"},
            "trigger": {"type": "refusal", "category": "cyber"},
        },
        text('"type": "answer"}}'),
    )
    content = replayable_content(declined)
    assert [block["type"] for block in content] == ["text", "text"]


def test_replay_keeps_everything_without_a_fallback() -> None:
    content = replayable_content(
        message({"type": "thinking", "thinking": "", "signature": "sig"}, text("{}"))
    )
    assert [block["type"] for block in content] == ["thinking", "text"]

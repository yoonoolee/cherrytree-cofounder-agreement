"""`run_agent`: the one loop every agent runs. The model calls tools until it ends with its answer;
our tools run here, Anthropic's server tools run inside the call."""

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from anthropic.types.beta import BetaMessage
from langfuse import get_client
from pydantic import ValidationError

from cherrytree_agent.llm.config import AgentConfig
from cherrytree_agent.llm.model import StreamHandler, call_model
from cherrytree_agent.tools.context import ToolContext, ToolError
from cherrytree_agent.tools.registry import TOOLS, definitions

type CallModel = Callable[..., Awaitable[BetaMessage]]

# Blocks kept from before a refusal fallback's boundary when the turn is replayed; the rest
# (thinking, unanswered tool calls, unknown model-internal blocks) belong to the declined model.
_KEPT_BEFORE_FALLBACK = {"text", "compaction"}


class RefusalError(Exception):
    """The model (and its fallback) declined. Not retried; logged and alerted on."""

    def __init__(self, category: str | None) -> None:
        super().__init__(f"Model refusal (category: {category})")
        self.category = category


class IncompleteResponseError(Exception):
    """The model stopped before finishing (`max_tokens`). The run fails and saves nothing."""


@dataclass(frozen=True)
class AgentRun:
    message: BetaMessage
    """The final model response."""
    content: list[dict[str, Any]]
    """The final response's content, as replayed in later requests."""
    messages: list[dict[str, Any]]
    """Every message this run added to the conversation, starting with its input."""

    @property
    def text(self) -> str:
        return "".join(block["text"] for block in self.content if block["type"] == "text")


def replayable_content(message: BetaMessage) -> list[dict[str, Any]]:
    """The response content to send back on later requests. After a refusal fallback, only text,
    compaction and answered server-tool blocks from before the last `fallback` block are kept."""
    content: list[dict[str, Any]] = [block.to_dict() for block in message.content]
    boundaries = [i for i, block in enumerate(content) if block["type"] == "fallback"]
    if not boundaries:
        return content

    boundary = boundaries[-1]
    before, after = content[:boundary], content[boundary + 1 :]
    answered = {block["tool_use_id"] for block in before if "tool_use_id" in block}
    kept = [
        block
        for block in before
        if block["type"] in _KEPT_BEFORE_FALLBACK
        or block["type"].endswith("_tool_result")
        or (block["type"] == "server_tool_use" and block["id"] in answered)
    ]
    return kept + after


async def _run_tool(context: ToolContext, block: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {"type": "tool_result", "tool_use_id": block["id"]}
    tool = TOOLS.get(block["name"])
    with get_client().start_as_current_observation(
        as_type="tool", name=block["name"], input=block["input"]
    ) as observation:
        try:
            if tool is None:
                raise ToolError(f"Unknown tool: {block['name']}")
            try:
                tool_input = tool.input_model.model_validate(block["input"])
            except ValidationError as error:
                raise ToolError(f"Invalid input: {error}") from error
            result["content"] = await tool.run(context, tool_input)
        except ToolError as error:
            result |= {"content": str(error), "is_error": True}
        observation.update(
            output=result["content"], level="ERROR" if result.get("is_error") else None
        )
    return result


async def run_agent(
    config: AgentConfig,
    *,
    history: list[dict[str, Any]],
    new_messages: list[dict[str, Any]],
    context: ToolContext,
    handler: StreamHandler,
    call: CallModel = call_model,
) -> AgentRun:
    """Runs `config` on `history` + `new_messages` until the model answers without calling one of
    our tools. Raises on a refusal or an incomplete response; nothing is saved here."""
    system = config.system_prompt
    tools = definitions(config.tools)
    added = list(new_messages)
    while True:
        message = await call(
            config.model,
            system=system,
            messages=[*history, *added],
            tools=tools,
            output_schema=config.output_schema,
            handler=handler,
        )
        content = replayable_content(message)
        added.append({"role": "assistant", "content": content})

        if message.stop_reason == "refusal":
            details = message.stop_details
            raise RefusalError(details.category if details else None)
        if message.stop_reason == "max_tokens":
            raise IncompleteResponseError(f"Stopped at max_tokens ({config.model.max_tokens})")
        if message.stop_reason == "pause_turn":
            # A server tool hit its iteration limit; sending the turn back resumes it.
            continue

        tool_uses = [block for block in content if block["type"] == "tool_use"]
        if not tool_uses:
            return AgentRun(message=message, content=content, messages=added)
        # Every result goes back in one message, so the model keeps calling tools in parallel.
        results: list[dict[str, Any]] = []
        for block in tool_uses:
            result = await _run_tool(context, block)
            await handler.on_tool_result(block["id"], bool(result.get("is_error")))
            results.append(result)
        added.append({"role": "user", "content": results})

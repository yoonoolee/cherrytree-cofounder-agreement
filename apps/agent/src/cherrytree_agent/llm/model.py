"""`call_model`: the only code that calls the model API, so a provider change touches one module.

Every call streams, uses adaptive thinking at the agent's fixed effort, caches the system prompt
for an hour and the rest automatically for five minutes, carries server-side compaction as a
safety net, and falls back to Anthropic's recommended model when a safety classifier declines.
Usage and cost go to Langfuse.
"""

from functools import lru_cache
from typing import Any, Protocol

from anthropic import AsyncAnthropic
from anthropic.types.beta import BetaMessage
from langfuse import get_client, observe

from cherrytree_agent.llm.config import PRICES, WEB_SEARCH_PRICE_USD, ModelSettings

BETAS = ["compact-2026-01-12", "server-side-fallback-2026-07-01"]

MILLION = 1_000_000


class StreamHandler(Protocol):
    async def on_message_start(self) -> None:
        """A model call started; text from an earlier call of the same run is not the answer."""
        ...

    async def on_text(self, text: str) -> None: ...


class NoStream:
    """A `StreamHandler` for background runs, where nobody watches the text arrive."""

    async def on_message_start(self) -> None:
        pass

    async def on_text(self, text: str) -> None:
        pass


@lru_cache
def _client() -> AsyncAnthropic:
    # Retries connection errors, 408, 409, 429 and 5xx with backoff before failing the call.
    return AsyncAnthropic(max_retries=3)


def request_params(
    settings: ModelSettings,
    *,
    system: str,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]],
    output_schema: dict[str, Any] | None,
) -> dict[str, Any]:
    output_config: dict[str, Any] = {"effort": settings.effort}
    if output_schema is not None:
        output_config["format"] = {"type": "json_schema", "schema": output_schema}
    params: dict[str, Any] = {
        "model": settings.model,
        "max_tokens": settings.max_tokens,
        "betas": BETAS,
        "fallbacks": "default",
        "thinking": {"type": "adaptive"},
        "output_config": output_config,
        "system": [
            {
                "type": "text",
                "text": system,
                "cache_control": {"type": "ephemeral", "ttl": settings.system_cache_ttl},
            }
        ],
        "tools": tools,
        "messages": messages,
        "context_management": {
            "edits": [
                {
                    "type": "compact_20260112",
                    "trigger": {
                        "type": "input_tokens",
                        "value": settings.compaction_trigger_tokens,
                    },
                }
            ]
        },
    }
    if settings.cache_tail:
        params["cache_control"] = {"type": "ephemeral"}
    return params


def usage_and_cost(message: BetaMessage) -> tuple[dict[str, int], dict[str, float]]:
    """Token usage and USD cost of one call, every attempt included: `usage.iterations` lists the
    compaction step and any refusal-fallback hops, which the top-level usage leaves out."""
    usage: dict[str, Any] = message.usage.to_dict()
    iterations: list[dict[str, Any]] = usage.get("iterations") or [usage]

    totals = {"input": 0, "output": 0, "cache_read": 0, "cache_write_5m": 0, "cache_write_1h": 0}
    cost = 0.0
    for iteration in iterations:
        price = PRICES.get(str(iteration.get("model") or message.model), PRICES["claude-opus-5-5"])
        # Cache writes are split by TTL when the API reports the split; otherwise priced as 5m.
        creation: dict[str, int] = iteration.get("cache_creation") or {
            "ephemeral_5m_input_tokens": iteration.get("cache_creation_input_tokens") or 0
        }
        counts = {
            "input": iteration.get("input_tokens") or 0,
            "output": iteration.get("output_tokens") or 0,
            "cache_read": iteration.get("cache_read_input_tokens") or 0,
            "cache_write_5m": creation.get("ephemeral_5m_input_tokens") or 0,
            "cache_write_1h": creation.get("ephemeral_1h_input_tokens") or 0,
        }
        for key, count in counts.items():
            totals[key] += count
            cost += count * getattr(price, key) / MILLION

    server_tools: dict[str, int] = usage.get("server_tool_use") or {}
    searches = server_tools.get("web_search_requests") or 0
    totals["web_search_requests"] = searches
    cost += searches * WEB_SEARCH_PRICE_USD
    return totals, {"total": round(cost, 6)}


@observe(as_type="generation", capture_input=False, capture_output=False)
async def call_model(
    settings: ModelSettings,
    *,
    system: str,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]],
    output_schema: dict[str, Any] | None,
    handler: StreamHandler,
    trace_input: object = None,
) -> BetaMessage:
    """One streamed model call. `trace_input` is what Langfuse records as the call's input (the
    messages new to this call); the full history is in Firestore."""
    params = request_params(
        settings, system=system, messages=messages, tools=tools, output_schema=output_schema
    )
    async with _client().beta.messages.stream(**params) as stream:
        async for event in stream:
            if event.type == "message_start":
                await handler.on_message_start()
            elif event.type == "content_block_delta" and event.delta.type == "text_delta":
                await handler.on_text(event.delta.text)
        message = await stream.get_final_message()
        request_id = stream.request_id

    usage, cost = usage_and_cost(message)
    get_client().update_current_generation(
        model=message.model,
        model_parameters={"effort": settings.effort, "max_tokens": settings.max_tokens},
        input=trace_input,
        output=message.to_dict()["content"],
        usage_details=usage,
        cost_details=cost,
        metadata={"stop_reason": message.stop_reason, "request_id": request_id},
    )
    return message

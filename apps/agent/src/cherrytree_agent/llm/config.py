"""Per-agent model settings and the price table used for cost tracking."""

import hashlib
from dataclasses import dataclass, field
from functools import cached_property
from pathlib import Path
from typing import Any, Literal

Effort = Literal["low", "medium", "high", "xhigh", "max"]

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


@dataclass(frozen=True)
class ModelSettings:
    model: str
    effort: Effort
    """Fixed per agent: changing it mid-conversation invalidates the cache. Always explicit: the
    default differs by model. Start low and raise it only where quality falls short."""
    max_tokens: int = 64_000
    """A backstop, not a length limit; response length belongs in the prompt."""
    system_cache_ttl: Literal["5m", "1h"] = "1h"
    """Explicit cache breakpoint on the system prompt (and the tool definitions before it)."""
    prefix_cache_ttl: Literal["5m", "1h"] = "1h"
    """Drafting, Review and Editing: the breakpoint after their fixed prefix (template, transcript;
    `draft/context.py`). An hour pays off only when runs repeat within it."""
    cache_tail: bool = True
    """Automatic 5-minute breakpoint on the last block, so a turn's tool loop re-reads its own
    history from the cache."""
    compaction_trigger_tokens: int = 350_000
    """Server-side compaction summarizes the conversation once a request's input passes this: 35%
    of the 1M context window. Later requests still send the full history; the API drops what
    comes before the summary."""


@dataclass(frozen=True)
class AgentConfig:
    name: str
    prompt_file: str
    """Markdown file in `prompts/`, the agent's system prompt."""
    model: ModelSettings
    tools: tuple[str, ...]
    """Tool names from the registry (`tools/registry.py`), in the order they are sent."""
    output_schema: dict[str, Any] | None = field(default=None)
    """JSON Schema the final response must follow (structured outputs), if any."""

    @cached_property
    def system_prompt(self) -> str:
        return (PROMPTS_DIR / self.prompt_file).read_text()

    @cached_property
    def prompt_version(self) -> str:
        """E.g. `advisor.md@3f2a1c`, on every trace so Langfuse can compare prompt versions."""
        digest = hashlib.sha256(self.system_prompt.encode()).hexdigest()[:6]
        return f"{self.prompt_file}@{digest}"


@dataclass(frozen=True)
class Price:
    """USD per million tokens."""

    input: float
    output: float
    cache_read: float
    cache_write_5m: float
    cache_write_1h: float


PRICES: dict[str, Price] = {
    "claude-sonnet-5-5": Price(
        input=2.0, output=10.0, cache_read=0.20, cache_write_5m=2.50, cache_write_1h=4.0
    ),
    # Refusal fallback target of Claude Sonnet 5.5 (`fallbacks: "default"`).
    "claude-sonnet-5": Price(
        input=2.0, output=10.0, cache_read=0.20, cache_write_5m=2.50, cache_write_1h=4.0
    ),
    # The step up for an agent whose quality falls short; also prices unknown models.
    "claude-opus-5-5": Price(
        input=4.0, output=20.0, cache_read=0.20, cache_write_5m=5.0, cache_write_1h=8.0
    ),
}

WEB_SEARCH_PRICE_USD = 0.01
"""$10 per 1,000 searches."""

"""The Editing Agent's configuration: one prompt, with an output for each kind of request."""

from anthropic import transform_schema
from pydantic import BaseModel, ConfigDict

from cherrytree_agent.llm.config import AgentConfig, ModelSettings


class RewriteOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str
    title: str
    replacement: str


class CommentOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str
    suggestion: str | None


def _editing(output: type[BaseModel]) -> AgentConfig:
    return AgentConfig(
        name="editing",
        prompt_file="editing.md",
        # The user waits on each run, and runs on one draft come minutes apart.
        model=ModelSettings(model="claude-sonnet-5-5", effort="low", prefix_cache_ttl="5m"),
        tools=("read_project", "search_rag"),
        output_schema=transform_schema(output),
    )


REWRITE = _editing(RewriteOutput)
COMMENT = _editing(CommentOutput)

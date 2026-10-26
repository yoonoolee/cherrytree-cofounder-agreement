"""The Drafting Agent's configuration."""

from cherrytree_agent.llm.config import AgentConfig, ModelSettings

DRAFTING = AgentConfig(
    name="drafting",
    prompt_file="drafting.md",
    # Runs once per job: nothing re-reads its prefix within an hour, so the cheaper 5-minute cache.
    model=ModelSettings(model="claude-sonnet-5-5", effort="medium", prefix_cache_ttl="5m"),
    # No edit tools: there is no draft yet; the agent's answer is the draft, in markdown.
    tools=("read_project", "search_rag", "web_search", "web_fetch"),
)

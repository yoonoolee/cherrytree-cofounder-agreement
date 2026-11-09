"""The Review Agent's configuration."""

from cherrytree_agent.llm.config import AgentConfig, ModelSettings

REVIEW = AgentConfig(
    name="review",
    prompt_file="review.md",
    # Runs once per job: nothing re-reads its prefix within an hour, so the cheaper 5-minute cache.
    model=ModelSettings(model="claude-sonnet-5-5", effort="medium", prefix_cache_ttl="5m"),
    tools=(
        "propose_replace_text",
        "propose_insert_paragraphs",
        "propose_delete_paragraph",
        "withdraw_edit",
        "create_thread",
        "read_project",
        "search_rag",
        "web_search",
        "web_fetch",
    ),
)

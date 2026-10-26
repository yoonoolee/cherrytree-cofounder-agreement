"""The Advisor Agent's configuration."""

from anthropic import transform_schema

from cherrytree_agent.contracts.models import AdvisorResponse
from cherrytree_agent.llm.config import AgentConfig, ModelSettings

ADVISOR = AgentConfig(
    name="advisor",
    prompt_file="advisor.md",
    model=ModelSettings(model="claude-sonnet-5-5", effort="medium"),
    tools=(
        "update_questions",
        "write_section_summary",
        "read_project",
        "search_rag",
        "web_search",
        "web_fetch",
    ),
    output_schema=transform_schema(AdvisorResponse),
)

"""The Advisor Agent's configuration. Turns and btws share it (prompt, tools and output schema),
so both read the same cached prefix."""

from anthropic import transform_schema

from cherrytree_agent.contracts.models import AdvisorOutput
from cherrytree_agent.llm.config import AgentConfig, ModelSettings

ADVISOR = AgentConfig(
    name="advisor",
    prompt_file="advisor.md",
    model=ModelSettings(model="claude-sonnet-5-5", effort="medium"),
    tools=(
        "add_green_highlights",
        "update_question_list",
        "read_project",
        "search_rag",
        "web_search",
        "web_fetch",
    ),
    output_schema=transform_schema(AdvisorOutput),
)

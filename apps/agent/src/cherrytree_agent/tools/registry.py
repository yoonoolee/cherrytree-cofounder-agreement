"""Every tool an agent can be given, by name: our own tools (run here) and Anthropic's server
tools (run by Anthropic). An agent's config lists the names it gets."""

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from anthropic import transform_schema
from pydantic import BaseModel

from cherrytree_agent.tools import draft, project, questions, rag
from cherrytree_agent.tools.context import ToolContext


@dataclass(frozen=True)
class Tool[I: BaseModel]:
    name: str
    description: str
    input_model: type[I]
    run: Callable[[ToolContext, I], Awaitable[str]]

    def definition(self) -> dict[str, Any]:
        # `strict` guarantees schema-valid input; the model is validated again before running.
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": transform_schema(self.input_model),
            "strict": True,
        }


TOOLS: dict[str, Tool[Any]] = {
    tool.name: tool
    for tool in [
        Tool(
            "update_questions",
            questions.UPDATE_QUESTIONS_DESCRIPTION,
            questions.UpdateQuestionsInput,
            questions.update_questions,
        ),
        Tool(
            "write_section_summary",
            questions.WRITE_SECTION_SUMMARY_DESCRIPTION,
            questions.WriteSectionSummaryInput,
            questions.write_section_summary,
        ),
        Tool(
            "read_project",
            project.READ_PROJECT_DESCRIPTION,
            project.ReadProjectInput,
            project.read_project,
        ),
        Tool("search_rag", rag.SEARCH_RAG_DESCRIPTION, rag.SearchRagInput, rag.search_rag),
        Tool(
            "propose_replace_text",
            draft.PROPOSE_REPLACE_TEXT_DESCRIPTION,
            draft.ProposeReplaceTextInput,
            draft.propose_replace_text,
        ),
        Tool(
            "propose_insert_paragraphs",
            draft.PROPOSE_INSERT_PARAGRAPHS_DESCRIPTION,
            draft.ProposeInsertParagraphsInput,
            draft.propose_insert_paragraphs,
        ),
        Tool(
            "propose_delete_paragraph",
            draft.PROPOSE_DELETE_PARAGRAPH_DESCRIPTION,
            draft.ProposeDeleteParagraphInput,
            draft.propose_delete_paragraph,
        ),
        Tool(
            "withdraw_edit",
            draft.WITHDRAW_EDIT_DESCRIPTION,
            draft.WithdrawEditInput,
            draft.withdraw_edit,
        ),
        Tool(
            "create_thread",
            draft.CREATE_THREAD_DESCRIPTION,
            draft.CreateThreadInput,
            draft.create_thread,
        ),
    ]
}

SERVER_TOOLS: dict[str, dict[str, Any]] = {
    # Dynamic filtering trims results in Anthropic's sandbox before they reach the context;
    # excluding the raw results it consumed keeps each saved turn small.
    "web_search": {
        "type": "web_search_20260318",
        "name": "web_search",
        "response_inclusion": "excluded",
    },
    # Bounded so one fetched page cannot outgrow a turn's Firestore document (1 MiB).
    "web_fetch": {"type": "web_fetch_20260209", "name": "web_fetch", "max_content_tokens": 20_000},
}


def definitions(names: tuple[str, ...]) -> list[dict[str, Any]]:
    """Tool definitions in the order given, so the cached prefix stays byte-identical."""
    return [
        SERVER_TOOLS[name] if name in SERVER_TOOLS else TOOLS[name].definition() for name in names
    ]

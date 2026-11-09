"""Draft tools for the Review and Editing agents: edits are proposals against the saved draft, and
the Review Agent raises open items as threads. Nothing is applied during the run."""

from pydantic import BaseModel, ConfigDict, Field

from cherrytree_agent.draft.working import DraftEditError, WorkingDraft
from cherrytree_agent.tools.context import ToolContext, ToolError


def _draft(context: ToolContext) -> WorkingDraft:
    if context.draft is None:
        raise ToolError("There is no draft to edit yet.")
    return context.draft


def _proposed(edit_id: str, withdrawn: list[str]) -> str:
    replaced = f" It replaces your earlier edit {', '.join(withdrawn)}." if withdrawn else ""
    return f"Proposed edit {edit_id}.{replaced}"


class ProposeReplaceTextInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    para: str = Field(description="Id of the paragraph to change.")
    old: str = Field(
        description="Text in that paragraph, exactly as written, that appears exactly once. Can "
        "be the whole paragraph."
    )
    new: str = Field(description="The replacement text.")


PROPOSE_REPLACE_TEXT_DESCRIPTION = """\
Propose replacing text inside one paragraph of the draft. Quote the draft's saved text, not \
another of your pending edits. If it overlaps one of your pending edits, it replaces that edit."""


async def propose_replace_text(context: ToolContext, request: ProposeReplaceTextInput) -> str:
    try:
        edit, withdrawn = _draft(context).propose_replace(request.para, request.old, request.new)
    except DraftEditError as error:
        raise ToolError(str(error)) from error
    return _proposed(edit.id, withdrawn)


class ProposeInsertParagraphsInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    after: str = Field(description="Id of the paragraph the new text follows.")
    text: str = Field(
        description="The new paragraphs or sections, in markdown (`##` for a section heading)."
    )


PROPOSE_INSERT_PARAGRAPHS_DESCRIPTION = """\
Propose inserting new paragraphs or sections after a paragraph of the draft."""


async def propose_insert_paragraphs(
    context: ToolContext, request: ProposeInsertParagraphsInput
) -> str:
    try:
        edit = _draft(context).propose_insert(request.after, request.text)
    except DraftEditError as error:
        raise ToolError(str(error)) from error
    return _proposed(edit.id, [])


class ProposeDeleteParagraphInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    para: str = Field(description="Id of the paragraph to delete.")


PROPOSE_DELETE_PARAGRAPH_DESCRIPTION = """\
Propose deleting a paragraph of the draft. It replaces your pending edits to that paragraph."""


async def propose_delete_paragraph(
    context: ToolContext, request: ProposeDeleteParagraphInput
) -> str:
    try:
        edit, withdrawn = _draft(context).propose_delete(request.para)
    except DraftEditError as error:
        raise ToolError(str(error)) from error
    return _proposed(edit.id, withdrawn)


class WithdrawEditInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    edit: str = Field(description="Id of one of your pending edits.")


WITHDRAW_EDIT_DESCRIPTION = "Withdraw one of your own pending edits."


async def withdraw_edit(context: ToolContext, request: WithdrawEditInput) -> str:
    try:
        _draft(context).withdraw(request.edit)
    except DraftEditError as error:
        raise ToolError(str(error)) from error
    return f"Withdrew edit {request.edit}."


class CreateThreadInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    para: str = Field(description="Id of the paragraph the open item is about.")
    message: str = Field(
        description="The thread's first message: what is open, why it matters, and what the "
        "founders need to decide or confirm."
    )


CREATE_THREAD_DESCRIPTION = """\
Raise an open item as a comment thread on a paragraph: facts that conflict, a standard topic the \
draft is missing, or something that needs the founders' decision. The founders reply in the \
thread. Use edits for wording fixes, never threads."""


async def create_thread(context: ToolContext, request: CreateThreadInput) -> str:
    try:
        thread = _draft(context).create_thread(request.para, request.message)
    except DraftEditError as error:
        raise ToolError(str(error)) from error
    return f"Created thread {thread.id} on paragraph {request.para}."

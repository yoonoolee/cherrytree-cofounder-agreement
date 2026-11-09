"""The draft as the agents read it (each block's text with its id), and the edits and threads one
run proposes against it.

Proposals target the saved draft text, never another pending edit. A proposal that overlaps one of
the run's pending edits replaces it (the older edit becomes `withdrawn`), so the pending edits never
overlap and Plate can apply them all.
"""

from dataclasses import dataclass
from uuid import uuid4

from cherrytree_agent.contracts.models import DraftBlock, DraftFix, Edit, PlateElement, PlateText

_HEADINGS = {f"h{level}": "#" * level for level in range(1, 7)}


def node_text(node: DraftBlock | PlateElement | PlateText) -> str:
    """A node's text as Plate reads it (`editor.api.string`): its text leaves, in order."""
    if isinstance(node, PlateText):
        return node.text
    return "".join(node_text(child) for child in node.children)


def _prefix(block: DraftBlock) -> str:
    extra = block.model_extra or {}
    if block.type in _HEADINGS:
        return f"{_HEADINGS[block.type]} "
    if block.type == "blockquote":
        return "> "
    if "listStyleType" in extra:
        indent = "  " * max(int(extra.get("indent") or 1) - 1, 0)
        marker = "1." if extra["listStyleType"] == "decimal" else "-"
        return f"{indent}{marker} "
    return ""


def render_draft(blocks: list[DraftBlock]) -> str:
    """One line per block, `[id] text`, with markdown markers for headings, quotes and lists."""
    return "\n".join(f"[{block.id}] {_prefix(block)}{node_text(block)}" for block in blocks)


class DraftEditError(ValueError):
    """A proposal that does not fit the draft. Nothing is changed."""


@dataclass(frozen=True)
class NewThread:
    """An open item the Review Agent raises: a thread anchored to block `para`."""

    id: str
    para: str
    message: str


class WorkingDraft:
    def __init__(self, blocks: list[DraftBlock]) -> None:
        self.blocks = blocks
        self._text = {block.id: node_text(block) for block in blocks}
        self.edits: list[Edit] = []
        self.threads: list[NewThread] = []

    def _block_text(self, para: str) -> str:
        if para not in self._text:
            raise DraftEditError(f"No paragraph with id {para}")
        return self._text[para]

    def _pending(self) -> list[Edit]:
        return [edit for edit in self.edits if edit.status == "pending"]

    def _span(self, edit: Edit) -> tuple[int, int]:
        """The saved-text range a pending edit changes; a delete covers the whole block."""
        text = self._text[edit.para]
        if edit.op == "replace" and edit.old is not None:
            start = text.index(edit.old)
            return start, start + len(edit.old)
        return 0, len(text)

    def _add(self, op: str, para: str, old: str | None, new: str | None) -> tuple[Edit, list[str]]:
        edit = Edit.model_validate(
            {"id": f"edit_{uuid4().hex[:8]}", "op": op, "para": para, "old": old, "new": new}
            | {"status": "pending"}
        )
        withdrawn: list[str] = []
        if op != "insert_after":
            start, end = self._span(edit)
            for other in self._pending():
                if other.op == "insert_after" or other.para != para:
                    continue
                other_start, other_end = self._span(other)
                overlaps = start < other_end and other_start < end
                if overlaps or op == "delete" or other.op == "delete":
                    other.status = "withdrawn"
                    withdrawn.append(other.id)
        self.edits.append(edit)
        return edit, withdrawn

    def propose_replace(self, para: str, old: str, new: str) -> tuple[Edit, list[str]]:
        """Returns the edit and the ids of the run's earlier edits it replaces."""
        count = self._block_text(para).count(old) if old else 0
        if count != 1:
            raise DraftEditError(
                f"`old` must appear exactly once in paragraph {para}; it appears {count} times. "
                "Quote more of the paragraph's text."
            )
        return self._add("replace", para, old, new)

    def propose_insert(self, after: str, markdown: str) -> Edit:
        self._block_text(after)
        if not markdown.strip():
            raise DraftEditError("The text to insert is empty.")
        return self._add("insert_after", after, None, markdown)[0]

    def propose_delete(self, para: str) -> tuple[Edit, list[str]]:
        self._block_text(para)
        if any(thread.para == para for thread in self.threads):
            raise DraftEditError(f"An open item is anchored to paragraph {para}; keep it.")
        return self._add("delete", para, None, None)

    def withdraw(self, edit_id: str) -> None:
        for edit in self._pending():
            if edit.id == edit_id:
                edit.status = "withdrawn"
                return
        raise DraftEditError(f"No pending edit with id {edit_id}")

    def create_thread(self, para: str, message: str) -> NewThread:
        self._block_text(para)
        if any(e.op == "delete" and e.para == para for e in self._pending()):
            raise DraftEditError(f"Paragraph {para} is being deleted; anchor the item elsewhere.")
        thread = NewThread(id=uuid4().hex, para=para, message=message)
        self.threads.append(thread)
        return thread

    def fixes(self) -> list[DraftFix]:
        """The pending edits, to apply directly (the Review Agent's first-draft fixes)."""
        return [
            DraftFix(op=edit.op, para=edit.para, old=edit.old, new=edit.new)
            for edit in self._pending()
        ]

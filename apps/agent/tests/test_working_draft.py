"""The draft as the agents read it, and the proposal rules of the edit tools."""

import pytest

from cherrytree_agent.contracts.models import DraftBlock, DraftFix
from cherrytree_agent.draft.working import DraftEditError, WorkingDraft, render_draft


def block(block_id: str, text: str, block_type: str = "p", **extra: object) -> DraftBlock:
    return DraftBlock.model_validate(
        {"type": block_type, "id": block_id, "children": [{"text": text}], **extra}
    )


BLOCKS = [
    block("t", "Cofounder Agreement", "h1"),
    DraftBlock.model_validate(
        {
            "type": "p",
            "id": "intro",
            "children": [
                {"text": "This agreement is between "},
                {"text": "Avery", "bold": True},
                {"text": " and Sam."},
            ],
        }
    ),
    block("eq", "Equity", "h2"),
    block("a", "Avery: 50%", listStyleType="disc", indent=1),
    block("s", "Sam: 50%", listStyleType="decimal", indent=2),
]


def test_renders_one_line_per_block_with_its_id_and_markdown_markers() -> None:
    assert render_draft(BLOCKS) == (
        "[t] # Cofounder Agreement\n"
        "[intro] This agreement is between Avery and Sam.\n"
        "[eq] ## Equity\n"
        "[a] - Avery: 50%\n"
        "[s]   1. Sam: 50%"
    )


def test_collects_pending_edits_as_fixes_in_order() -> None:
    draft = WorkingDraft(BLOCKS)
    draft.propose_replace("intro", "agreement", "Agreement")
    draft.propose_insert("s", "## Vesting\n\nFour years.")
    draft.propose_delete("a")
    assert draft.fixes() == [
        DraftFix(op="replace", para="intro", old="agreement", new="Agreement"),
        DraftFix(op="insert_after", para="s", old=None, new="## Vesting\n\nFour years."),
        DraftFix(op="delete", para="a", old=None, new=None),
    ]


@pytest.mark.parametrize(
    ("para", "old"),
    [("missing", "x"), ("intro", "nowhere"), ("intro", "a"), ("intro", "")],
    ids=["unknown paragraph", "text not there", "text twice", "empty text"],
)
def test_rejects_a_replace_that_does_not_match_exactly_once(para: str, old: str) -> None:
    draft = WorkingDraft(BLOCKS)
    with pytest.raises(DraftEditError):
        draft.propose_replace(para, old, "y")
    assert draft.fixes() == []


def test_an_overlapping_proposal_replaces_the_earlier_edit() -> None:
    draft = WorkingDraft(BLOCKS)
    first, _ = draft.propose_replace("intro", "between Avery", "between Avery Lee")
    kept, _ = draft.propose_replace("intro", "This agreement", "This Agreement")
    second, withdrawn = draft.propose_replace("intro", "Avery and", "Avery Lee and")
    assert withdrawn == [first.id]
    assert [fix.old for fix in draft.fixes()] == ["This agreement", "Avery and"]

    _, withdrawn = draft.propose_delete("intro")
    assert withdrawn == [kept.id, second.id]
    assert draft.fixes() == [DraftFix(op="delete", para="intro", old=None, new=None)]


def test_withdraws_its_own_pending_edits_only() -> None:
    draft = WorkingDraft(BLOCKS)
    edit, _ = draft.propose_replace("eq", "Equity", "Ownership")
    draft.withdraw(edit.id)
    assert draft.fixes() == []
    with pytest.raises(DraftEditError):
        draft.withdraw(edit.id)


def test_threads_cannot_sit_on_deleted_paragraphs() -> None:
    draft = WorkingDraft(BLOCKS)
    thread = draft.create_thread("a", "Is the split final?")
    assert draft.threads == [thread]
    with pytest.raises(DraftEditError):
        draft.propose_delete("a")

    draft.propose_delete("s")
    with pytest.raises(DraftEditError):
        draft.create_thread("s", "Is the split final?")
    with pytest.raises(DraftEditError):
        draft.create_thread("missing", "?")

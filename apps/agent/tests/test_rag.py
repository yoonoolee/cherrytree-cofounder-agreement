from cherrytree_agent.tools.context import ToolContext
from cherrytree_agent.tools.rag import RAG_STORE, SearchRagInput, search_rag


async def test_finds_the_most_relevant_curated_passages() -> None:
    chunks = await RAG_STORE.search("What vesting schedule and cliff do founders usually use?")
    assert chunks[0].id == "vesting-standard-schedule"
    assert len(chunks) <= 3


async def test_says_so_when_nothing_matches() -> None:
    context = ToolContext(db=None, project_id="org_1")  # type: ignore[arg-type]
    result = await search_rag(context, SearchRagInput(query="zzz qqq"))
    assert result.startswith("No curated content matches")


async def test_results_name_their_source() -> None:
    context = ToolContext(db=None, project_id="org_1")  # type: ignore[arg-type]
    result = await search_rag(context, SearchRagInput(query="deadlock between founders"))
    assert result.startswith("## Breaking a deadlock between two founders")
    assert "Source: Cherrytree curated content" in result

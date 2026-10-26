"""Per-user limit on agent runs (Advisor turns, and later Editing runs), so one account cannot run
up model spend. A fixed window counted in Firestore (`rateLimits/{uid}`), which every Cloud Run
instance shares; an in-memory count would not be."""

import math
from datetime import UTC, datetime, timedelta

from google.cloud.firestore import AsyncClient, AsyncTransaction, async_transactional

from cherrytree_agent.contracts.models import RateLimit
from cherrytree_agent.firebase import read, to_firestore

AGENT_RUNS_PER_WINDOW = 60
"""Far above a person's pace (a turn is a typed reply plus a model response), so it only stops
scripts and runaway loops."""
WINDOW = timedelta(hours=1)


class RateLimitedError(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(f"Rate limited; retry in {retry_after_seconds}s")
        self.retry_after_seconds = retry_after_seconds


async def count_agent_run(db: AsyncClient, uid: str) -> None:
    """Counts one run for `uid`, or raises `RateLimitedError` if the window is used up."""
    ref = db.collection("rateLimits").document(uid)

    @async_transactional
    async def count(transaction: AsyncTransaction) -> None:
        now = datetime.now(UTC)
        limit = await read(ref, RateLimit, transaction)
        if limit is None or now - limit.window_start >= WINDOW:
            limit = RateLimit(window_start=now, count=0)
        elif limit.count >= AGENT_RUNS_PER_WINDOW:
            remaining = limit.window_start + WINDOW - now
            raise RateLimitedError(math.ceil(remaining.total_seconds()))
        transaction.set(ref, to_firestore(limit.model_copy(update={"count": limit.count + 1})))

    await count(db.transaction())

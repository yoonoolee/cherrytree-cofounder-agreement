"""Langfuse spans start their own traces, whatever trace context a request carries."""

import httpx
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.trace import SpanContext

from cherrytree_agent.main import create_app

# Cloud Run adds a `traceparent` to every request, most of them flagged not sampled (`-00`).
UNSAMPLED_TRACEPARENT = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00"


async def test_a_request_does_not_continue_the_platform_trace() -> None:
    # A configured provider, as Langfuse sets one up in the service.
    trace.set_tracer_provider(TracerProvider())
    app = create_app()
    seen: list[SpanContext] = []

    @app.get("/probe")
    async def probe() -> None:  # pyright: ignore[reportUnusedFunction]
        seen.append(trace.get_current_span().get_span_context())

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        await client.get("/probe", headers={"traceparent": UNSAMPLED_TRACEPARENT})

    assert seen and not seen[0].is_valid, "the run's spans would inherit the unsampled flag"

"""API endpoints - orchestrates pipeline and meeting flows."""
from dataclasses import dataclass

from ..pipeline.orchestrator import run_pipeline, PipelineResult, StageResult
from ..meeting.graph import run_meeting, MeetingResult
from .schemas import PipelineResponse, MeetingResponse


@dataclass
class APIRequest:
    """Generic API request."""
    topic: str
    provider: str = "openai"


async def handle_pipeline_request(request: APIRequest) -> PipelineResponse:
    """Handle a pipeline execution request."""
    result: PipelineResult = await run_pipeline(
        topic=request.topic,
        provider_name=request.provider,
    )
    return PipelineResponse.from_pipeline_result(result)


async def handle_meeting_request(
    request: APIRequest, meeting_id: str
) -> MeetingResponse:
    """Handle a meeting execution request."""
    result: MeetingResult = await run_meeting(
        meeting_id=meeting_id,
        topic=request.topic,
        provider_name=request.provider,
    )
    return MeetingResponse.from_meeting_result(result)


async def handle_full_workflow(
    request: APIRequest, meeting_id: str
) -> dict:
    """Run both pipeline and meeting, returning combined results."""
    pipeline_resp = await handle_pipeline_request(request)
    meeting_resp = await handle_meeting_request(request, meeting_id)
    return {
        "pipeline": pipeline_resp,
        "meeting": meeting_resp,
        "provider": request.provider,
    }

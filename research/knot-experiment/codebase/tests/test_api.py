"""Tests for API routes and schemas."""
import asyncio
import pytest

from src.api.routes import (
    APIRequest,
    handle_pipeline_request,
    handle_meeting_request,
    handle_full_workflow,
)
from src.api.schemas import (
    PipelineResponse,
    MeetingResponse,
    StageView,
)
from src.pipeline.orchestrator import (
    PipelineResult,
    StageResult,
    StageStatus,
)
from src.meeting.graph import MeetingResult


class TestSchemas:
    def test_stage_view_from_result(self):
        sr = StageResult("script", StageStatus.COMPLETED, output="ok", tokens_used=42)
        sv = StageView.from_stage_result(sr)
        assert sv.name == "script"
        assert sv.status == "completed"
        assert sv.tokens == 42

    def test_pipeline_response_from_result(self):
        pr = PipelineResult()
        pr.add_stage(StageResult("s1", StageStatus.COMPLETED, tokens_used=10))
        pr.add_stage(StageResult("s2", StageStatus.FAILED, error="oops"))
        resp = PipelineResponse.from_pipeline_result(pr)
        assert len(resp.stages) == 2
        assert resp.success is False
        assert resp.total_tokens == 10

    def test_meeting_response_from_result(self):
        mr = MeetingResult(meeting_id="m1", topic="test", tokens_used=99)
        resp = MeetingResponse.from_meeting_result(mr)
        assert resp.meeting_id == "m1"
        assert resp.tokens_used == 99
        assert resp.item_count == 0


class TestRoutes:
    def test_handle_pipeline(self):
        req = APIRequest(topic="AI ethics")
        resp = asyncio.run(handle_pipeline_request(req))
        assert isinstance(resp, PipelineResponse)
        assert resp.success is True
        assert len(resp.stages) == 5

    def test_handle_meeting(self):
        req = APIRequest(topic="sprint planning")
        resp = asyncio.run(handle_meeting_request(req, meeting_id="m1"))
        assert isinstance(resp, MeetingResponse)
        assert resp.meeting_id == "m1"
        assert resp.summary is not None

    def test_handle_full_workflow(self):
        req = APIRequest(topic="quarterly review", provider="anthropic")
        result = asyncio.run(handle_full_workflow(req, meeting_id="m99"))
        assert "pipeline" in result
        assert "meeting" in result
        assert result["provider"] == "anthropic"

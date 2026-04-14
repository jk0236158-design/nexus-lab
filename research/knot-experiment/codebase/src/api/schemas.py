"""Response schemas for the API layer."""
from dataclasses import dataclass, field

from ..pipeline.orchestrator import StageResult, PipelineResult, StageStatus
from ..meeting.graph import MeetingResult


@dataclass
class StageView:
    """Serializable view of a single stage."""
    name: str
    status: str
    output: str | None
    error: str | None
    tokens: int

    @classmethod
    def from_stage_result(cls, sr: StageResult) -> "StageView":
        return cls(
            name=sr.stage_name,
            status=sr.status.value,
            output=sr.output,
            error=sr.error,
            tokens=sr.tokens_used,
        )


@dataclass
class PipelineResponse:
    """Serializable response for a pipeline run."""
    stages: list[StageView] = field(default_factory=list)
    total_tokens: int = 0
    success: bool = True

    @classmethod
    def from_pipeline_result(cls, pr: PipelineResult) -> "PipelineResponse":
        stages = [StageView.from_stage_result(s) for s in pr.stages]
        success = all(s.status == StageStatus.COMPLETED for s in pr.stages)
        return cls(
            stages=stages,
            total_tokens=pr.total_tokens,
            success=success,
        )


@dataclass
class MeetingResponse:
    """Serializable response for a meeting run."""
    meeting_id: str
    topic: str
    item_count: int
    summary: str | None
    tokens_used: int

    @classmethod
    def from_meeting_result(cls, mr: MeetingResult) -> "MeetingResponse":
        return cls(
            meeting_id=mr.meeting_id,
            topic=mr.topic,
            item_count=mr.item_count,
            summary=mr.summary,
            tokens_used=mr.tokens_used,
        )

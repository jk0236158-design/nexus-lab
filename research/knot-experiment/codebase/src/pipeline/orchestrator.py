"""Pipeline orchestrator - manages stage execution."""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from ..provider.registry import get_provider
from ..provider.base import LLMResponse


class StageStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class StageResult:
    """Result of a single pipeline stage."""
    stage_name: str
    status: StageStatus
    output: Optional[str] = None
    error: Optional[str] = None
    tokens_used: int = 0


@dataclass
class PipelineResult:
    """Aggregated result of a full pipeline run."""
    stages: list[StageResult] = field(default_factory=list)
    total_tokens: int = 0

    def add_stage(self, result: StageResult) -> None:
        self.stages.append(result)
        self.total_tokens += result.tokens_used

    def get_stage(self, name: str) -> Optional[StageResult]:
        for s in self.stages:
            if s.stage_name == name:
                return s
        return None

    @property
    def succeeded(self) -> bool:
        return all(s.status == StageStatus.COMPLETED for s in self.stages)


PIPELINE_STAGES = ["script", "voice", "visual", "render", "evaluate"]


async def run_pipeline(
    topic: str, provider_name: str = "openai"
) -> PipelineResult:
    """Execute all pipeline stages sequentially."""
    provider = get_provider(provider_name)
    result = PipelineResult()

    for stage_name in PIPELINE_STAGES:
        try:
            response: LLMResponse = await provider.generate(
                prompt=f"Execute {stage_name} stage for: {topic}",
                config={"stage": stage_name},
            )
            stage_result = StageResult(
                stage_name=stage_name,
                status=StageStatus.COMPLETED,
                output=response.text,
                tokens_used=response.tokens_used,
            )
        except Exception as exc:
            stage_result = StageResult(
                stage_name=stage_name,
                status=StageStatus.FAILED,
                error=str(exc),
            )
        result.add_stage(stage_result)

    return result

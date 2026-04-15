"""Evaluation module - scores pipeline results."""
from dataclasses import dataclass

from .orchestrator import PipelineResult, StageResult, StageStatus


@dataclass
class EvaluationScore:
    """Quality score for a pipeline run."""
    completeness: float  # 0.0 - 1.0
    avg_tokens_per_stage: float
    failed_stages: list[str]
    overall_score: float  # 0.0 - 1.0


def evaluate_pipeline(result: PipelineResult) -> EvaluationScore:
    """Score a pipeline result on quality metrics."""
    if not result.stages:
        return EvaluationScore(
            completeness=0.0,
            avg_tokens_per_stage=0.0,
            failed_stages=[],
            overall_score=0.0,
        )

    completed = [
        s for s in result.stages if s.status == StageStatus.COMPLETED
    ]
    failed = [
        s.stage_name
        for s in result.stages
        if s.status == StageStatus.FAILED
    ]

    completeness = len(completed) / len(result.stages)
    avg_tokens = (
        result.total_tokens / len(result.stages) if result.stages else 0.0
    )

    # Score: completeness weighted at 70%, token-efficiency at 30%.
    # Efficiency uses a rational decay f(x) = B / (B + x) with baseline B=100.
    # Properties: bounded in [0,1], monotonically decreasing in avg_tokens,
    # f(0)=1, f(B)=0.5, heavy tail preserves ordering across high-token runs.
    TOKEN_BASELINE = 100.0
    token_score = TOKEN_BASELINE / (TOKEN_BASELINE + max(avg_tokens, 0.0))
    overall = completeness * 0.7 + token_score * 0.3

    return EvaluationScore(
        completeness=round(completeness, 3),
        avg_tokens_per_stage=round(avg_tokens, 1),
        failed_stages=failed,
        overall_score=round(overall, 3),
    )


def format_evaluation(score: EvaluationScore) -> str:
    """Format an evaluation score as a human-readable string."""
    lines = [
        f"Completeness: {score.completeness:.0%}",
        f"Avg tokens/stage: {score.avg_tokens_per_stage:.0f}",
        f"Failed stages: {', '.join(score.failed_stages) or 'none'}",
        f"Overall score: {score.overall_score:.0%}",
    ]
    return "\n".join(lines)

"""Tests for pipeline orchestrator."""
import asyncio
import pytest

from src.pipeline.orchestrator import (
    run_pipeline,
    PipelineResult,
    StageResult,
    StageStatus,
    PIPELINE_STAGES,
)
from src.pipeline.evaluation import evaluate_pipeline, EvaluationScore


class TestStageResult:
    def test_create_completed(self):
        sr = StageResult(
            stage_name="script",
            status=StageStatus.COMPLETED,
            output="test output",
            tokens_used=100,
        )
        assert sr.stage_name == "script"
        assert sr.status == StageStatus.COMPLETED
        assert sr.tokens_used == 100

    def test_create_failed(self):
        sr = StageResult(
            stage_name="voice",
            status=StageStatus.FAILED,
            error="timeout",
        )
        assert sr.error == "timeout"
        assert sr.output is None


class TestPipelineResult:
    def test_add_stage(self):
        pr = PipelineResult()
        pr.add_stage(StageResult("s1", StageStatus.COMPLETED, tokens_used=50))
        pr.add_stage(StageResult("s2", StageStatus.COMPLETED, tokens_used=75))
        assert len(pr.stages) == 2
        assert pr.total_tokens == 125

    def test_get_stage(self):
        pr = PipelineResult()
        pr.add_stage(StageResult("s1", StageStatus.COMPLETED, output="hi"))
        assert pr.get_stage("s1") is not None
        assert pr.get_stage("s1").output == "hi"
        assert pr.get_stage("missing") is None

    def test_succeeded(self):
        pr = PipelineResult()
        pr.add_stage(StageResult("s1", StageStatus.COMPLETED))
        assert pr.succeeded is True
        pr.add_stage(StageResult("s2", StageStatus.FAILED))
        assert pr.succeeded is False


class TestRunPipeline:
    def test_run_openai(self):
        result = asyncio.run(run_pipeline("test topic", "openai"))
        assert isinstance(result, PipelineResult)
        assert len(result.stages) == len(PIPELINE_STAGES)
        assert result.succeeded is True
        assert result.total_tokens > 0

    def test_run_anthropic(self):
        result = asyncio.run(run_pipeline("test topic", "anthropic"))
        assert isinstance(result, PipelineResult)
        assert len(result.stages) == len(PIPELINE_STAGES)
        assert result.succeeded is True

    def test_unknown_provider(self):
        with pytest.raises(ValueError, match="Unknown provider"):
            asyncio.run(run_pipeline("topic", "nonexistent"))


class TestEvaluation:
    def test_evaluate_successful(self):
        result = asyncio.run(run_pipeline("test", "openai"))
        score = evaluate_pipeline(result)
        assert isinstance(score, EvaluationScore)
        assert score.completeness == 1.0
        assert score.failed_stages == []
        assert score.overall_score > 0

    def test_evaluate_empty(self):
        score = evaluate_pipeline(PipelineResult())
        assert score.completeness == 0.0
        assert score.overall_score == 0.0

    def _make_result(self, tokens_per_stage: int, n_stages: int = 4) -> PipelineResult:
        pr = PipelineResult()
        for i in range(n_stages):
            pr.add_stage(
                StageResult(
                    stage_name=f"s{i}",
                    status=StageStatus.COMPLETED,
                    tokens_used=tokens_per_stage,
                )
            )
        return pr

    def test_efficiency_monotonic_low_beats_high(self):
        """At equal completeness, fewer tokens must yield a higher score."""
        low = evaluate_pipeline(self._make_result(50))
        high = evaluate_pipeline(self._make_result(250))
        assert low.completeness == high.completeness == 1.0
        assert low.overall_score > high.overall_score

    def test_efficiency_bounded_and_decreasing(self):
        """Token score is bounded in [0,1] and strictly decreasing in tokens."""
        scores = [
            evaluate_pipeline(self._make_result(t)).overall_score
            for t in (0, 50, 100, 250, 1000)
        ]
        assert all(0.0 <= s <= 1.0 for s in scores)
        assert scores == sorted(scores, reverse=True)
        assert scores != sorted(scores)  # not constant

    def test_efficiency_never_saturates_at_high_tokens(self):
        """Distinct high-token runs must still be distinguishable (no clip to 0)."""
        s1 = evaluate_pipeline(self._make_result(500)).overall_score
        s2 = evaluate_pipeline(self._make_result(1000)).overall_score
        assert s1 > s2  # heavy tail preserves ordering

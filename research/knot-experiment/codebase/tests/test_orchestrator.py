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

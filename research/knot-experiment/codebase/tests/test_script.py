"""Tests for script generation."""
import asyncio
import pytest

from src.pipeline.script import (
    generate_script,
    ScriptPackage,
    ScriptSection,
    SCRIPT_PARTS,
)


class TestScriptSection:
    def test_defaults(self):
        s = ScriptSection(title="intro", content="hello")
        assert s.duration_seconds == 30

    def test_custom_duration(self):
        s = ScriptSection(title="body", content="main", duration_seconds=90)
        assert s.duration_seconds == 90


class TestScriptPackage:
    def test_empty(self):
        pkg = ScriptPackage(topic="test")
        assert pkg.total_duration == 0
        assert len(pkg.sections) == 0

    def test_add_sections(self):
        pkg = ScriptPackage(topic="test")
        pkg.add_section(ScriptSection("a", "content a", 30))
        pkg.add_section(ScriptSection("b", "content b", 60))
        assert pkg.total_duration == 90
        assert len(pkg.sections) == 2


class TestGenerateScript:
    def test_generate_openai(self):
        pkg = asyncio.run(generate_script("climate change"))
        assert isinstance(pkg, ScriptPackage)
        assert pkg.topic == "climate change"
        assert len(pkg.sections) == len(SCRIPT_PARTS)
        assert pkg.total_tokens > 0

    def test_generate_anthropic(self):
        pkg = asyncio.run(
            generate_script("space exploration", provider_name="anthropic")
        )
        assert len(pkg.sections) == len(SCRIPT_PARTS)
        # Body section should have 60s duration
        body = [s for s in pkg.sections if s.title == "body"]
        assert len(body) == 1
        assert body[0].duration_seconds == 60

    def test_section_content_nonempty(self):
        pkg = asyncio.run(generate_script("AI safety"))
        for section in pkg.sections:
            assert len(section.content) > 0

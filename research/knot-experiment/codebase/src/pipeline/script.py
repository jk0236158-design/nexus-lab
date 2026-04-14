"""Script generation module - produces structured scripts."""
from dataclasses import dataclass, field

from ..provider.registry import get_provider
from ..provider.base import LLMResponse


@dataclass
class ScriptSection:
    """A single section within a script."""
    title: str
    content: str
    duration_seconds: int = 30


@dataclass
class ScriptPackage:
    """Complete script with multiple sections."""
    topic: str
    sections: list[ScriptSection] = field(default_factory=list)
    total_tokens: int = 0

    @property
    def total_duration(self) -> int:
        return sum(s.duration_seconds for s in self.sections)

    def add_section(self, section: ScriptSection) -> None:
        self.sections.append(section)


SCRIPT_PARTS = ["intro", "body", "conclusion"]


async def generate_script(
    topic: str, provider_name: str = "openai"
) -> ScriptPackage:
    """Generate a multi-section script for the given topic."""
    provider = get_provider(provider_name)
    package = ScriptPackage(topic=topic)

    for part in SCRIPT_PARTS:
        response: LLMResponse = await provider.generate(
            prompt=f"Write the {part} section for a script about: {topic}",
            config={"stage": "script", "part": part},
        )
        section = ScriptSection(
            title=part,
            content=response.text,
            duration_seconds=30 if part != "body" else 60,
        )
        package.add_section(section)
        package.total_tokens += response.tokens_used

    return package

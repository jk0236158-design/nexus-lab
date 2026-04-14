"""Voice synthesis module - converts text to speech metadata."""
from dataclasses import dataclass
from typing import Optional

from ..provider.registry import get_provider
from ..provider.base import LLMResponse
from .orchestrator import StageResult, StageStatus


@dataclass
class VoiceClip:
    """Metadata for a synthesized voice clip."""
    text: str
    voice_id: str
    duration_estimate: float
    tokens_used: int = 0


async def synthesize_voice(
    stage_result: StageResult,
    provider_name: str = "openai",
    voice_id: str = "default",
) -> Optional[VoiceClip]:
    """Synthesize voice from a completed stage result."""
    if stage_result.status != StageStatus.COMPLETED:
        return None
    if stage_result.output is None:
        return None

    provider = get_provider(provider_name)
    response: LLMResponse = await provider.generate(
        prompt=f"Synthesize voice for: {stage_result.output[:100]}",
        config={"stage": "voice", "voice_id": voice_id},
    )

    words = len(stage_result.output.split())
    duration = words / 2.5  # ~150 wpm

    return VoiceClip(
        text=stage_result.output,
        voice_id=voice_id,
        duration_estimate=round(duration, 2),
        tokens_used=response.tokens_used,
    )

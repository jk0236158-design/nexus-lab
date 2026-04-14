"""Meeting flow - generates structured meeting content."""
from dataclasses import dataclass, field
from typing import Optional

from ..provider.registry import get_provider
from ..provider.base import LLMResponse


@dataclass
class AgendaItem:
    """A single item on the meeting agenda."""
    title: str
    notes: str
    priority: int = 1  # 1=high, 3=low


@dataclass
class MeetingResult:
    """Complete result of a meeting flow."""
    meeting_id: str
    topic: str
    agenda: list[AgendaItem] = field(default_factory=list)
    summary: Optional[str] = None
    tokens_used: int = 0

    @property
    def item_count(self) -> int:
        return len(self.agenda)


MEETING_PHASES = ["agenda", "discussion", "summary"]


async def run_meeting(
    meeting_id: str,
    topic: str,
    provider_name: str = "openai",
) -> MeetingResult:
    """Execute a meeting flow and produce a MeetingResult."""
    provider = get_provider(provider_name)
    result = MeetingResult(meeting_id=meeting_id, topic=topic)

    # Generate agenda items
    response: LLMResponse = await provider.generate(
        prompt=f"Create agenda for meeting about: {topic}",
        config={"stage": "meeting", "phase": "agenda"},
    )
    result.agenda.append(
        AgendaItem(title="Main Topic", notes=response.text, priority=1)
    )
    result.agenda.append(
        AgendaItem(title="Action Items", notes="TBD", priority=2)
    )
    result.tokens_used += response.tokens_used

    # Generate summary
    summary_resp: LLMResponse = await provider.generate(
        prompt=f"Summarize meeting on: {topic}",
        config={"stage": "meeting", "phase": "summary"},
    )
    result.summary = summary_resp.text
    result.tokens_used += summary_resp.tokens_used

    return result

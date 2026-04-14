"""Abstract LLM provider interface."""
from dataclasses import dataclass
from abc import ABC, abstractmethod


@dataclass
class LLMResponse:
    """Standard response from any LLM provider."""
    text: str
    model: str
    tokens_used: int
    finish_reason: str


class LLMProvider(ABC):
    """Base class for all LLM provider implementations."""

    @abstractmethod
    async def generate(self, prompt: str, config: dict) -> LLMResponse:
        """Generate a text completion."""
        ...

    @abstractmethod
    async def generate_structured(
        self, prompt: str, schema: dict, config: dict
    ) -> dict:
        """Generate a structured (JSON) completion."""
        ...

"""OpenAI provider - mock implementation for testing."""
from .base import LLMProvider, LLMResponse
from .registry import register_provider


class OpenAIProvider(LLMProvider):
    """Mock OpenAI provider that returns deterministic responses."""

    MODEL = "gpt-4o-mock"

    def __init__(self, api_key: str = "mock-key") -> None:
        self.api_key = api_key
        self._call_count = 0

    async def generate(self, prompt: str, config: dict) -> LLMResponse:
        self._call_count += 1
        stage = config.get("stage", "unknown")
        return LLMResponse(
            text=f"[OpenAI] Generated output for stage '{stage}': {prompt[:60]}",
            model=self.MODEL,
            tokens_used=150 + self._call_count * 10,
            finish_reason="stop",
        )

    async def generate_structured(
        self, prompt: str, schema: dict, config: dict
    ) -> dict:
        self._call_count += 1
        return {
            "result": f"structured output for: {prompt[:40]}",
            "model": self.MODEL,
            "schema_keys": list(schema.keys()),
        }


# Auto-register when module is imported
register_provider("openai", OpenAIProvider)

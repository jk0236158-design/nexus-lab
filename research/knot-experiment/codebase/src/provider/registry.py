"""Provider registry - dispatches by name."""
from .base import LLMProvider

_providers: dict[str, type[LLMProvider]] = {}


def register_provider(name: str, cls: type[LLMProvider]) -> None:
    """Register a provider class under the given name."""
    if not issubclass(cls, LLMProvider):
        raise TypeError(f"{cls} is not a subclass of LLMProvider")
    _providers[name] = cls


def get_provider(name: str, **kwargs) -> LLMProvider:
    """Instantiate and return a registered provider by name."""
    if name not in _providers:
        available = ", ".join(_providers.keys()) or "(none)"
        raise ValueError(
            f"Unknown provider: {name}. Available: {available}"
        )
    return _providers[name](**kwargs)


def list_providers() -> list[str]:
    """Return names of all registered providers."""
    return list(_providers.keys())


def clear_providers() -> None:
    """Remove all registered providers (useful for testing)."""
    _providers.clear()

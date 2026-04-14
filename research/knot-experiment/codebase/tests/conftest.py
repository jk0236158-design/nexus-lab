"""Shared test fixtures."""
import sys
from pathlib import Path

import pytest

# Ensure the src package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import providers to trigger auto-registration
import src.provider.openai_client  # noqa: F401
import src.provider.anthropic_client  # noqa: F401

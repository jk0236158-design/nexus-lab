"""Session management - CRUD for meetings."""
from dataclasses import dataclass, field
from typing import Optional

from .graph import MeetingResult


@dataclass
class Session:
    """Tracks a meeting session with its result."""
    session_id: str
    owner: str
    meeting: Optional[MeetingResult] = None
    is_active: bool = True


class SessionManager:
    """Manages creation, retrieval, and cleanup of sessions."""

    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}

    def create_session(self, session_id: str, owner: str) -> Session:
        """Create a new session."""
        if session_id in self._sessions:
            raise ValueError(f"Session already exists: {session_id}")
        session = Session(session_id=session_id, owner=owner)
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        """Retrieve a session by ID."""
        return self._sessions.get(session_id)

    def attach_meeting(
        self, session_id: str, meeting: MeetingResult
    ) -> None:
        """Attach a meeting result to an existing session."""
        session = self._sessions.get(session_id)
        if session is None:
            raise ValueError(f"Session not found: {session_id}")
        session.meeting = meeting

    def close_session(self, session_id: str) -> bool:
        """Mark a session as inactive."""
        session = self._sessions.get(session_id)
        if session is None:
            return False
        session.is_active = False
        return True

    def list_active(self) -> list[Session]:
        """Return all active sessions."""
        return [s for s in self._sessions.values() if s.is_active]

    def delete_session(self, session_id: str) -> bool:
        """Permanently remove a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

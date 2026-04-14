"""Tests for meeting flow and session management."""
import asyncio
import pytest

from src.meeting.graph import run_meeting, MeetingResult, AgendaItem
from src.meeting.session import SessionManager, Session


class TestMeetingResult:
    def test_create(self):
        mr = MeetingResult(meeting_id="m1", topic="test")
        assert mr.meeting_id == "m1"
        assert mr.item_count == 0

    def test_item_count(self):
        mr = MeetingResult(meeting_id="m1", topic="test")
        mr.agenda.append(AgendaItem(title="A", notes="n"))
        mr.agenda.append(AgendaItem(title="B", notes="n"))
        assert mr.item_count == 2


class TestRunMeeting:
    def test_run_basic(self):
        result = asyncio.run(run_meeting("m1", "project update"))
        assert isinstance(result, MeetingResult)
        assert result.meeting_id == "m1"
        assert result.item_count >= 2
        assert result.summary is not None
        assert result.tokens_used > 0

    def test_run_anthropic(self):
        result = asyncio.run(
            run_meeting("m2", "retrospective", provider_name="anthropic")
        )
        assert result.summary is not None


class TestSessionManager:
    def test_create_and_get(self):
        mgr = SessionManager()
        s = mgr.create_session("s1", "alice")
        assert s.session_id == "s1"
        assert mgr.get_session("s1") is s

    def test_duplicate_raises(self):
        mgr = SessionManager()
        mgr.create_session("s1", "alice")
        with pytest.raises(ValueError, match="already exists"):
            mgr.create_session("s1", "bob")

    def test_attach_meeting(self):
        mgr = SessionManager()
        mgr.create_session("s1", "alice")
        mr = MeetingResult(meeting_id="m1", topic="test")
        mgr.attach_meeting("s1", mr)
        session = mgr.get_session("s1")
        assert session.meeting is mr

    def test_attach_missing_raises(self):
        mgr = SessionManager()
        mr = MeetingResult(meeting_id="m1", topic="test")
        with pytest.raises(ValueError, match="not found"):
            mgr.attach_meeting("nope", mr)

    def test_close_session(self):
        mgr = SessionManager()
        mgr.create_session("s1", "alice")
        assert mgr.close_session("s1") is True
        assert mgr.get_session("s1").is_active is False
        assert mgr.close_session("nope") is False

    def test_list_active(self):
        mgr = SessionManager()
        mgr.create_session("s1", "alice")
        mgr.create_session("s2", "bob")
        mgr.close_session("s1")
        active = mgr.list_active()
        assert len(active) == 1
        assert active[0].session_id == "s2"

    def test_delete_session(self):
        mgr = SessionManager()
        mgr.create_session("s1", "alice")
        assert mgr.delete_session("s1") is True
        assert mgr.get_session("s1") is None
        assert mgr.delete_session("s1") is False

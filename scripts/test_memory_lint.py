"""Unit tests for memory_lint MVP (L1 + L2).

Covers:
- L1 inconsistency detection on a synthetic fixture
- L1 happy path (all files agree)
- L1 no-match edge case (regex miss)
- L2 not-adopted -> no violation
- L2 adopted + missing keyword -> violation
- L2 adopted + present keyword -> no violation
- 4/18 Zenn 誤記 retroactive scenario (spec §acceptance)

Run:
    python -m pytest scripts/test_memory_lint.py -v

Iwa / 2026-04-19
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))

import memory_lint as ml  # noqa: E402


def _write(p: Path, text: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


# ------------------------------------------------------------------
# L1
# ------------------------------------------------------------------
def test_l1_detects_inconsistency(tmp_path, monkeypatch):
    monkeypatch.setattr(ml, "HOME", tmp_path)
    readme = tmp_path / "nexus-lab" / "README.md"
    status = tmp_path / ".shared-ops" / "status" / "zen_status.md"
    _write(readme, "blah\nZenn 記事: 8 本\n")
    _write(status, "- プロフィール記事数: **9 本**\n")

    cfg = {
        "assertions": [
            {
                "key": "zenn_article_count",
                "hint": "sync to profile",
                "files": [
                    {
                        "path": "nexus-lab/README.md",
                        "regex": r"Zenn\s*記事[^0-9]{0,6}(?P<value>\d+)\s*本",
                    },
                    {
                        "path": ".shared-ops/status/zen_status.md",
                        "regex": r"プロフィール記事数[:：]\s*\*{0,2}(?P<value>\d+)\s*本",
                    },
                ],
            }
        ]
    }
    seen: set[Path] = set()
    violations = ml.run_l1(cfg, seen)
    assert len(violations) == 1
    v = violations[0]
    assert v.cls == "L1"
    assert v.key == "zenn_article_count"
    assert "mismatch" in v.summary
    assert any("8" in d for d in v.details)
    assert any("9" in d for d in v.details)
    assert v.hint == "sync to profile"


def test_l1_happy_path_no_violation(tmp_path, monkeypatch):
    monkeypatch.setattr(ml, "HOME", tmp_path)
    a = tmp_path / "nexus-lab" / "a.json"
    b = tmp_path / "nexus-lab" / "b.md"
    _write(a, '{"version": "1.1.1"}\n')
    _write(b, "## [1.1.1] - 2026-04-18\n")

    cfg = {
        "assertions": [
            {
                "key": "api_proxy_version",
                "files": [
                    {
                        "path": "nexus-lab/a.json",
                        "regex": r'"version"\s*:\s*"(?P<value>[0-9.]+)"',
                    },
                    {
                        "path": "nexus-lab/b.md",
                        "regex": r"##\s*\[?(?P<value>[0-9.]+)\]?",
                    },
                ],
            }
        ]
    }
    violations = ml.run_l1(cfg, set())
    assert violations == []


def test_l1_all_regex_miss_reports_soft_warning(tmp_path, monkeypatch):
    monkeypatch.setattr(ml, "HOME", tmp_path)
    f = tmp_path / "nexus-lab" / "noise.md"
    _write(f, "nothing matching here")

    cfg = {
        "assertions": [
            {
                "key": "some_key",
                "files": [
                    {
                        "path": "nexus-lab/noise.md",
                        "regex": r"VERSION:\s*(?P<value>\d+)",
                    },
                    {
                        "path": "nexus-lab/missing.md",
                        "regex": r"VERSION:\s*(?P<value>\d+)",
                    },
                ],
            }
        ]
    }
    violations = ml.run_l1(cfg, set())
    assert len(violations) == 1
    assert "could not extract" in violations[0].summary


def test_l1_single_match_is_not_violation(tmp_path, monkeypatch):
    """If only one file matches, we can't prove inconsistency -> silent.
    This keeps false positives low when a file is temporarily absent."""
    monkeypatch.setattr(ml, "HOME", tmp_path)
    a = tmp_path / "nexus-lab" / "a.md"
    _write(a, "VERSION: 42\n")

    cfg = {
        "assertions": [
            {
                "key": "solo",
                "files": [
                    {
                        "path": "nexus-lab/a.md",
                        "regex": r"VERSION:\s*(?P<value>\d+)",
                    },
                    {
                        "path": "nexus-lab/absent.md",
                        "regex": r"VERSION:\s*(?P<value>\d+)",
                    },
                ],
            }
        ]
    }
    violations = ml.run_l1(cfg, set())
    assert violations == []


# ------------------------------------------------------------------
# L2
# ------------------------------------------------------------------
def test_l2_unadopted_inbox_is_silent(tmp_path, monkeypatch):
    monkeypatch.setattr(ml, "HOME", tmp_path)
    inbox = tmp_path / ".shared-ops" / "inbox" / "2026-04-18_x.md"
    _write(inbox, "Status: pending\nNo decision yet.\n")
    target = tmp_path / ".claude" / "projects" / "c--Users-jk023-nexus-lab" / "team_memory" / "zen" / "identity.md"
    _write(target, "identity content\n")

    cfg = {
        "inbox_followups": [
            {
                "inbox": ".shared-ops/inbox/2026-04-18_x.md",
                "adopted_markers": ["A採用"],
                "target_path": ".claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/identity.md",
                "target_keywords": ["監視対象 8"],
            }
        ]
    }
    assert ml.run_l2(cfg, set()) == []


def test_l2_adopted_and_missing_keyword_violates(tmp_path, monkeypatch):
    monkeypatch.setattr(ml, "HOME", tmp_path)
    inbox = tmp_path / ".shared-ops" / "inbox" / "2026-04-18_x.md"
    _write(inbox, "default=A 採用\n監視対象8 を追加する。\n")
    target = tmp_path / ".claude" / "projects" / "c--Users-jk023-nexus-lab" / "team_memory" / "zen" / "identity.md"
    _write(target, "監視対象 6 項目あり。\n")  # does NOT contain "監視対象8"

    cfg = {
        "inbox_followups": [
            {
                "inbox": ".shared-ops/inbox/2026-04-18_x.md",
                "adopted_markers": ["default=A", "A採用"],
                "target_path": ".claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/identity.md",
                "target_keywords": ["監視対象8"],
                "hint": "identity.md に追記",
            }
        ]
    }
    violations = ml.run_l2(cfg, set())
    assert len(violations) == 1
    assert violations[0].cls == "L2"
    assert "監視対象8" in str(violations[0].details)
    assert violations[0].hint == "identity.md に追記"


def test_l2_adopted_and_keyword_present_clean(tmp_path, monkeypatch):
    monkeypatch.setattr(ml, "HOME", tmp_path)
    inbox = tmp_path / ".shared-ops" / "inbox" / "2026-04-18_x.md"
    _write(inbox, "A採用。\n")
    target = tmp_path / ".claude" / "projects" / "c--Users-jk023-nexus-lab" / "team_memory" / "zen" / "identity.md"
    _write(target, "監視対象8: Origin 正動機の負読み替え\n")

    cfg = {
        "inbox_followups": [
            {
                "inbox": ".shared-ops/inbox/2026-04-18_x.md",
                "adopted_markers": ["A採用"],
                "target_path": ".claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/identity.md",
                "target_keywords": ["監視対象8", "Origin 正動機"],
            }
        ]
    }
    assert ml.run_l2(cfg, set()) == []


def test_l2_adopted_but_target_missing_violates(tmp_path, monkeypatch):
    monkeypatch.setattr(ml, "HOME", tmp_path)
    inbox = tmp_path / ".shared-ops" / "inbox" / "2026-04-18_x.md"
    _write(inbox, "A採用\n")
    # target NOT written

    cfg = {
        "inbox_followups": [
            {
                "inbox": ".shared-ops/inbox/2026-04-18_x.md",
                "adopted_markers": ["A採用"],
                "target_path": ".claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/identity.md",
                "target_keywords": ["X"],
            }
        ]
    }
    violations = ml.run_l2(cfg, set())
    assert len(violations) == 1
    assert "target file missing" in violations[0].summary


# ------------------------------------------------------------------
# Retroactive acceptance test (spec §acceptance): 4/18 Zenn 誤記クラス
# ------------------------------------------------------------------
def test_retroactive_418_zenn_drift_detected(tmp_path, monkeypatch):
    """
    Spec acceptance: the 4/18 Zenn drift (README '7 本' vs status '8 本' vs
    real URL '9 本') must be detected by L1.

    We synthesize the 3-file state that existed on 4/18 and confirm the
    lint produces a single L1 violation with all three values visible.
    """
    monkeypatch.setattr(ml, "HOME", tmp_path)

    readme = tmp_path / "nexus-lab" / "README.md"
    status = tmp_path / ".shared-ops" / "status" / "zen_status.md"
    profile = tmp_path / ".shared-ops" / "status" / "zenn_profile_snapshot.md"

    _write(readme, "blah\n公開済みの Zenn 記事 7 本（2026-04-18 時点）\n")
    _write(status, "- プロフィール記事数: **8 本**\n")
    _write(profile, "# zenn profile snapshot\n記事数: 9 本（external）\n")

    cfg = {
        "assertions": [
            {
                "key": "zenn_article_count",
                "hint": "README と status は Zenn プロフィールに同期",
                "files": [
                    {
                        "path": "nexus-lab/README.md",
                        "regex": r"Zenn\s*記事[^0-9]{0,10}(?P<value>\d+)\s*本",
                    },
                    {
                        "path": ".shared-ops/status/zen_status.md",
                        "regex": r"プロフィール記事数[:：]\s*\*{0,2}(?P<value>\d+)\s*本",
                    },
                    {
                        "path": ".shared-ops/status/zenn_profile_snapshot.md",
                        "regex": r"記事数[:：]\s*(?P<value>\d+)\s*本",
                    },
                ],
            }
        ]
    }

    violations = ml.run_l1(cfg, set())
    assert len(violations) == 1
    flat = "\n".join(violations[0].details)
    assert "7" in flat
    assert "8" in flat
    assert "9" in flat


# ------------------------------------------------------------------
# CLI smoke
# ------------------------------------------------------------------
def test_cli_returns_nonzero_on_violation(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(ml, "HOME", tmp_path)
    monkeypatch.setattr(ml, "STATUS_OUT", tmp_path / "status" / "out.md")

    a = tmp_path / "nexus-lab" / "a.md"
    b = tmp_path / "nexus-lab" / "b.md"
    _write(a, "V: 1\n")
    _write(b, "V: 2\n")

    yaml_path = tmp_path / "assertions.yaml"
    yaml_path.write_text(
        "assertions:\n"
        "  - key: v_check\n"
        "    files:\n"
        "      - path: nexus-lab/a.md\n"
        "        regex: 'V:\\s*(?P<value>\\d+)'\n"
        "      - path: nexus-lab/b.md\n"
        "        regex: 'V:\\s*(?P<value>\\d+)'\n",
        encoding="utf-8",
    )

    rc = ml.main(["--assertions", str(yaml_path), "--no-save"])
    captured = capsys.readouterr()
    assert rc == 1
    assert "v_check" in captured.out
    assert "mismatch" in captured.out


def test_cli_returns_zero_on_clean(tmp_path, monkeypatch):
    monkeypatch.setattr(ml, "HOME", tmp_path)
    monkeypatch.setattr(ml, "STATUS_OUT", tmp_path / "status" / "out.md")

    yaml_path = tmp_path / "assertions.yaml"
    yaml_path.write_text("assertions: []\ninbox_followups: []\n", encoding="utf-8")
    rc = ml.main(["--assertions", str(yaml_path), "--no-save"])
    assert rc == 0

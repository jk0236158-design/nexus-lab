#!/usr/bin/env python3
"""memory-lint: multi-file fact inconsistency + inbox follow-up checker.

MVP (2026-04-19 Iwa, spec: team_memory/_shared/2026-04-19_zen_memory_lint_spec.md):

- L1 "Multi-file fact inconsistency"
  Reads memory_lint_assertions.yaml, extracts regex-captured values from
  each listed file, and reports when they disagree. Example: Zenn
  article count in README vs zen_status.md, api-proxy version in
  package.json vs CHANGELOG.

- L2 "Inbox -> identity/memory 未反映"
  For each configured inbox file, checks if it is "adopted" (marker text
  present), and if so verifies that the declared follow-up keywords
  appear in the target file (typically identity.md).

Out of scope (v1.x):
- L3 memory duplication, L4 dead links, L5 external URL drift.
- Auto-fix (Lint detects only; humans fix).
- LLM-based semantic lint.

Usage:
    python scripts/memory_lint.py              # MVP: L1 + L2
    python scripts/memory_lint.py --class L1   # L1 only
    python scripts/memory_lint.py --json
    python scripts/memory_lint.py --no-save    # skip status/memory_lint_last.md write

Exit code: 0 on clean, 1 on any violation. Intended to run non-blocking
from zen_startup_sweep.sh via `... || true`.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as e:
    sys.stderr.write(f"memory_lint: PyYAML required ({e})\n")
    sys.exit(2)


HOME = Path.home()
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ASSERTIONS = SCRIPT_DIR / "memory_lint_assertions.yaml"
STATUS_OUT = HOME / ".shared-ops" / "status" / "memory_lint_last.md"


def _resolve(path_str: str) -> Path:
    """Expand ~ and anchor HOME-relative paths.

    Accepts:
      - absolute path
      - "~/..."
      - HOME-relative like ".shared-ops/..." or ".claude/..."
      - nexus-lab subtree like "nexus-lab/..." (anchored to HOME/nexus-lab)
    """
    p = Path(path_str)
    if p.is_absolute():
        return p
    s = path_str
    if s.startswith("~"):
        return Path(s).expanduser()
    if s.startswith("nexus-lab/"):
        return HOME / s
    # Everything else (.shared-ops/..., .claude/..., anything) is HOME-relative.
    return HOME / s


# ------------------------------------------------------------------
# Data classes
# ------------------------------------------------------------------
@dataclass
class Violation:
    cls: str            # "L1" or "L2"
    key: str            # assertion key / inbox identifier
    summary: str
    details: list[str] = field(default_factory=list)
    hint: str | None = None


@dataclass
class LintReport:
    generated_at: str
    classes_run: list[str]
    files_examined: int
    violations: list[Violation] = field(default_factory=list)

    @property
    def clean(self) -> bool:
        return not self.violations


# ------------------------------------------------------------------
# L1
# ------------------------------------------------------------------
def _extract_first_match(file_path: Path, pattern: re.Pattern) -> tuple[str | None, int | None]:
    """Return (captured value, 1-indexed line number) of the first regex
    match in file_path. Returns (None, None) if the file does not exist or
    the pattern does not match."""
    try:
        text = file_path.read_text(encoding="utf-8", errors="replace")
    except FileNotFoundError:
        return None, None
    except OSError:
        return None, None

    match = pattern.search(text)
    if not match:
        return None, None
    try:
        value = match.group("value")
    except IndexError:
        value = match.group(0)
    # Compute line number from the match start.
    line_no = text.count("\n", 0, match.start()) + 1
    return value, line_no


def run_l1(assertions_yaml: dict, files_seen: set[Path]) -> list[Violation]:
    violations: list[Violation] = []
    for a in assertions_yaml.get("assertions", []):
        key = a.get("key", "<unknown>")
        hint = a.get("hint")
        pattern_cache: dict[str, re.Pattern] = {}
        observations: list[tuple[str, Path, str | None, int | None]] = []
        for f in a.get("files", []):
            path = _resolve(f["path"])
            files_seen.add(path)
            regex_src = f["regex"]
            patt = pattern_cache.get(regex_src) or re.compile(regex_src, re.MULTILINE)
            pattern_cache[regex_src] = patt
            value, line_no = _extract_first_match(path, patt)
            observations.append((f["path"], path, value, line_no))

        # Require at least two non-None observations for a meaningful check.
        non_null = [o for o in observations if o[2] is not None]
        if len(non_null) < 2:
            # Not enough evidence — likely a pattern miss or missing file.
            # Record as a soft warning only if ALL were None (likely regex regression).
            if not non_null:
                details = [f"- {orig}: <no match>" for orig, _, _, _ in observations]
                violations.append(
                    Violation(
                        cls="L1",
                        key=key,
                        summary=f"{key}: could not extract value from any listed file",
                        details=details,
                        hint=hint,
                    )
                )
            continue

        values = {o[2] for o in non_null}
        if len(values) == 1:
            continue  # consistent

        # Inconsistency: report every observation, missing included.
        details = []
        for orig, _path, value, line_no in observations:
            if value is None:
                details.append(f"- {orig}: <no match>")
            else:
                details.append(f"- {orig}:{line_no} -> {value!r}")
        violations.append(
            Violation(
                cls="L1",
                key=key,
                summary=f"{key} mismatch across files ({sorted(values)})",
                details=details,
                hint=hint,
            )
        )
    return violations


# ------------------------------------------------------------------
# L2
# ------------------------------------------------------------------
def _is_inbox_adopted(inbox_text: str, markers: list[str]) -> bool:
    """Adopted = any marker appears in the inbox file body."""
    for m in markers:
        if m and m in inbox_text:
            return True
    return False


def _target_has_keywords(target_text: str, keywords: list[str]) -> tuple[bool, list[str]]:
    """Returns (all_present, missing_list).

    "all_present" means every keyword was found. The pragmatic choice
    here is strict-AND because L2 detection should be loud when the
    follow-up is only half-done (an identity.md that mentions "監視対象8"
    but not the concept description is incomplete).
    """
    missing = [k for k in keywords if k not in target_text]
    return (not missing), missing


def run_l2(assertions_yaml: dict, files_seen: set[Path]) -> list[Violation]:
    violations: list[Violation] = []
    for rule in assertions_yaml.get("inbox_followups", []):
        inbox_path = _resolve(rule["inbox"])
        target_path = _resolve(rule["target_path"])
        files_seen.add(inbox_path)
        files_seen.add(target_path)

        try:
            inbox_text = inbox_path.read_text(encoding="utf-8", errors="replace")
        except FileNotFoundError:
            # If the inbox file itself is gone, we silently skip — the rule
            # is obsolete until the maintainer removes it from the YAML.
            continue

        if not _is_inbox_adopted(inbox_text, rule.get("adopted_markers", [])):
            continue  # not adopted yet, nothing to enforce

        try:
            target_text = target_path.read_text(encoding="utf-8", errors="replace")
        except FileNotFoundError:
            violations.append(
                Violation(
                    cls="L2",
                    key=rule["inbox"],
                    summary=f"adopted inbox but target file missing: {rule['target_path']}",
                    details=[f"- inbox: {rule['inbox']}"],
                    hint=rule.get("hint"),
                )
            )
            continue

        keywords = rule.get("target_keywords", [])
        ok, missing = _target_has_keywords(target_text, keywords)
        if not ok:
            violations.append(
                Violation(
                    cls="L2",
                    key=rule["inbox"],
                    summary=(
                        f"adopted inbox not reflected in {rule['target_path']} "
                        f"(missing: {missing})"
                    ),
                    details=[
                        f"- inbox: {rule['inbox']}",
                        f"- target: {rule['target_path']}",
                        f"- missing keywords: {missing}",
                    ],
                    hint=rule.get("hint"),
                )
            )
    return violations


# ------------------------------------------------------------------
# Formatting
# ------------------------------------------------------------------
def format_report_text(report: LintReport) -> str:
    lines: list[str] = []
    lines.append(f"memory-lint {report.generated_at}")
    lines.append("================================")
    lines.append(f"classes: {','.join(report.classes_run)}")
    lines.append(f"files examined: {report.files_examined}")
    lines.append("")
    if report.clean:
        lines.append("OK: no violations detected")
        return "\n".join(lines) + "\n"

    # Group by class.
    by_cls: dict[str, list[Violation]] = {}
    for v in report.violations:
        by_cls.setdefault(v.cls, []).append(v)
    total = len(report.violations)
    lines.append(f"violations: {total}")
    lines.append("")
    for cls in sorted(by_cls):
        lines.append(f"[{cls}] {len(by_cls[cls])} violation(s)")
        for v in by_cls[cls]:
            lines.append(f"  * {v.summary}")
            for d in v.details:
                lines.append(f"    {d}")
            if v.hint:
                lines.append(f"    hint: {v.hint}")
            lines.append("")
    return "\n".join(lines) + "\n"


def format_report_json(report: LintReport) -> str:
    payload = {
        "generated_at": report.generated_at,
        "classes_run": report.classes_run,
        "files_examined": report.files_examined,
        "clean": report.clean,
        "violations": [asdict(v) for v in report.violations],
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


# ------------------------------------------------------------------
# Entry point
# ------------------------------------------------------------------
def load_assertions(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ValueError(f"assertions yaml root must be a mapping: {path}")
    return data


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="memory-lint MVP (L1 + L2)")
    parser.add_argument(
        "--class",
        dest="classes",
        default="L1,L2",
        help="comma-separated class list (default: L1,L2)",
    )
    parser.add_argument("--json", action="store_true", help="emit JSON instead of text")
    parser.add_argument(
        "--assertions",
        default=str(DEFAULT_ASSERTIONS),
        help=f"assertions yaml path (default: {DEFAULT_ASSERTIONS})",
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="do not write status/memory_lint_last.md",
    )
    args = parser.parse_args(argv)

    classes_run = [c.strip().upper() for c in args.classes.split(",") if c.strip()]
    valid = {"L1", "L2"}
    invalid = [c for c in classes_run if c not in valid]
    if invalid:
        sys.stderr.write(f"memory_lint: unknown class(es): {invalid}\n")
        return 2

    assertions_path = Path(args.assertions).expanduser()
    if not assertions_path.exists():
        sys.stderr.write(f"memory_lint: assertions yaml not found: {assertions_path}\n")
        return 2

    assertions = load_assertions(assertions_path)

    files_seen: set[Path] = set()
    violations: list[Violation] = []
    if "L1" in classes_run:
        violations.extend(run_l1(assertions, files_seen))
    if "L2" in classes_run:
        violations.extend(run_l2(assertions, files_seen))

    report = LintReport(
        generated_at=datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        classes_run=classes_run,
        files_examined=len(files_seen),
        violations=violations,
    )

    if args.json:
        out = format_report_json(report)
    else:
        out = format_report_text(report)

    sys.stdout.write(out)

    if not args.no_save:
        try:
            STATUS_OUT.parent.mkdir(parents=True, exist_ok=True)
            # Always write the human-readable form to the status file; JSON
            # callers still get JSON on stdout if they asked for it.
            STATUS_OUT.write_text(format_report_text(report), encoding="utf-8")
        except OSError as e:
            sys.stderr.write(f"memory_lint: could not persist status: {e}\n")

    return 0 if report.clean else 1


if __name__ == "__main__":
    sys.exit(main())

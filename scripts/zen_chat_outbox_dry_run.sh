#!/bin/bash
# zen_chat_outbox_dry_run.sh — Yuino chat_outbox/zen v0 consumer end-to-end dry run
#
# 起点:
#   - 2026-05-09 Kai-side chat_outbox/zen v0 reify 完了 (commit dbd63c1)
#   - Iwa 着手 (Zen 委任): chat_outbox consumer 完了条件確認用 dry run script
#
# step:
#   1. ~/.shared-ops/chat_outbox/zen/{task_id}.md sample packet 起稿 (status: pending)
#   2. consumer の --dry-run task_id で end-to-end fire
#      (lock acquire -> --start -> dummy board response -> --complete + result marker -> schema validate -> archive -> lock release)
#   3. result marker JSON validate (schema_version + status=completed + response_paths 非空)
#   4. cleanup (sample packet + dummy board file 削除、 result marker は preserve、 processed/ 配下も cleanup)
#
# usage:
#   ./scripts/zen_chat_outbox_dry_run.sh
#
# exit code:
#   0 = pass
#   1 = arg/setup error
#   2 = step fail (詳細 step number は stderr)

set -uo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONSUMER_SCRIPT="$REPO_DIR/scripts/zen_chat_outbox_consume.sh"
CHAT_OUTBOX_DIR="$HOME/.shared-ops/chat_outbox/zen"
CHAT_OUTBOX_PROCESSED_DIR="$CHAT_OUTBOX_DIR/processed"
CHAT_RESULTS_DIR="$HOME/.shared-ops/chat_results/zen"
LOCKS_DIR="$HOME/.shared-ops/locks"

SAMPLE_ID="task-dryrun$(date +%s)"
SAMPLE_PACKET_FILE="$CHAT_OUTBOX_DIR/${SAMPLE_ID}.md"

mkdir -p "$CHAT_OUTBOX_DIR" "$CHAT_OUTBOX_PROCESSED_DIR" "$CHAT_RESULTS_DIR" "$LOCKS_DIR" 2>/dev/null

if [[ ! -x "$CONSUMER_SCRIPT" ]]; then
  if [[ ! -f "$CONSUMER_SCRIPT" ]]; then
    echo "[dry-run] error: consumer script not found: $CONSUMER_SCRIPT" >&2
    exit 1
  fi
  chmod +x "$CONSUMER_SCRIPT" 2>/dev/null || true
fi

cleanup() {
  rm -f "$SAMPLE_PACKET_FILE"
  rm -f "$CHAT_OUTBOX_PROCESSED_DIR/${SAMPLE_ID}.md"
  # dummy board file (consumer --dry-run が起稿)
  rm -f "$HOME/.shared-ops/board/$(date +%Y-%m-%d)_zen_chatoutbox_dryrun_response_${SAMPLE_ID}.md"
  # consumer lockfile も release (stale 防止)
  bash "$CONSUMER_SCRIPT" --lock-release >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "================================================================"
echo " zen_chat_outbox_dry_run — Yuino chat_outbox/zen v0 end-to-end test"
echo "================================================================"
echo ""

# step 1: sample packet 起稿
echo "[step 1/4] sample packet 起稿 (status: pending)"
WIN_BOARD_PATH="C:/Users/jk023/.shared-ops/board/$(date +%Y-%m-%d)_dryrun_target.md"
cat > "$SAMPLE_PACKET_FILE" <<EOF
---
schema_version: yuino.chat_outbox.v0
task_id: $SAMPLE_ID
target_agent: zen
status: pending
priority: normal
permission_level: green
completion_condition: "Dry-run synthetic packet for end-to-end consumer test."
source_of_truth_refs:
  - "$WIN_BOARD_PATH"
expected_output: board_response
return_format: markdown
created_at: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
---

# From: Dry-run harness

## Task

Synthetic dry-run packet, no real action expected.

## Boundary

- local synthetic packet for end-to-end test
- auto-cleanup after dry-run completion
EOF
echo "  sample: $SAMPLE_PACKET_FILE"
echo "  task_id: $SAMPLE_ID"
echo ""

# step 2: end-to-end dry run via consumer --dry-run
echo "[step 2/4] consumer --dry-run fire"
if ! bash "$CONSUMER_SCRIPT" --dry-run "$SAMPLE_ID"; then
  echo "[dry-run] FAIL step 2: consumer --dry-run returned non-zero" >&2
  exit 2
fi
echo ""

# step 3: result marker JSON validate
echo "[step 3/4] result marker JSON validate"
MARKER_FILE="$CHAT_RESULTS_DIR/${SAMPLE_ID}.json"
if [[ ! -f "$MARKER_FILE" ]]; then
  echo "[dry-run] FAIL step 3: result marker not found: $MARKER_FILE" >&2
  exit 2
fi

# 必須 field check (grep ベース、 jq 不在環境でも動作)
EXPECTED_FIELDS=(
  '"schema_version": "yuino.chat_result.v0"'
  '"target": "zen"'
  '"status": "completed"'
  "\"task_id\": \"$SAMPLE_ID\""
)
for field in "${EXPECTED_FIELDS[@]}"; do
  if ! grep -q "$field" "$MARKER_FILE"; then
    echo "[dry-run] FAIL step 3: required field missing: $field" >&2
    echo "[dry-run]   marker content:" >&2
    cat "$MARKER_FILE" >&2
    exit 2
  fi
done

# response_paths 非空 check (空 array `[]` を reject)
if grep -qE '"response_paths":[[:space:]]*\[\]' "$MARKER_FILE"; then
  echo "[dry-run] FAIL step 3: response_paths is empty array in completed marker" >&2
  exit 2
fi

# started_at + completed_at 非 null check (duration_seconds 計算に必要)
if grep -qE '"started_at":[[:space:]]*null' "$MARKER_FILE"; then
  echo "[dry-run] FAIL step 3: started_at is null in completed marker" >&2
  exit 2
fi
if grep -qE '"completed_at":[[:space:]]*null' "$MARKER_FILE"; then
  echo "[dry-run] FAIL step 3: completed_at is null in completed marker" >&2
  exit 2
fi

echo "  marker: $MARKER_FILE"
echo "  schema_version + target=zen + status=completed + task_id + response_paths 非空 + started_at + completed_at: PASS"
echo ""

# step 4: cleanup (trap で auto)
echo "[step 4/4] cleanup (sample packet + dummy board file 削除、 result marker は preserve)"
echo ""

echo "================================================================"
echo " DRY RUN PASS"
echo "================================================================"
echo ""
echo "evidence:"
echo "  sample_id:   $SAMPLE_ID"
echo "  marker_path: $MARKER_FILE"
echo "  marker content (preserved as evidence):"
sed 's/^/    /' "$MARKER_FILE"
echo ""
exit 0

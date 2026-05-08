#!/bin/bash
# zen_wake_queue_dry_run.sh — Controlled Wake v0 consumer end-to-end dry run
#
# 起点:
#   - 2026-05-08 Kai contract (commit 2f1a732) § Implementation Completion Condition reify
#   - Zen-side consumer 12 step を sample request で空転、 全 step pass evidence を出す
#
# 連動:
#   - scripts/zen_wake_queue_consume.sh (主 consumer)
#
# step:
#   1. ~/.shared-ops/wake-queue/zen/controlled_dry-run-test.md sample request 起稿
#   2. consumer の --dry-run sample-id で end-to-end fire
#      (lockfile -> read marker -> dummy board response -> replied marker -> schema validate -> lock release)
#   3. result marker JSON validate (schema_version + status=replied + response_board_path 非 null)
#   4. cleanup (sample request + dummy board file 削除、 result marker は preserve)
#
# usage:
#   ./scripts/zen_wake_queue_dry_run.sh
#
# exit code:
#   0 = pass
#   1 = arg/setup error
#   2 = step fail (詳細 step number は stderr)

set -uo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONSUMER_SCRIPT="$REPO_DIR/scripts/zen_wake_queue_consume.sh"
WAKE_QUEUE_DIR="$HOME/.shared-ops/wake-queue/zen"
WAKE_PROCESSED_DIR="$WAKE_QUEUE_DIR/processed"
WAKE_RESULTS_DIR="$HOME/.shared-ops/wake-results/zen"
LOCKS_DIR="$HOME/.shared-ops/locks"

SAMPLE_ID="response-dryrun$(date +%s)"
SAMPLE_REQUEST_FILE="$WAKE_QUEUE_DIR/controlled_${SAMPLE_ID}.md"

mkdir -p "$WAKE_QUEUE_DIR" "$WAKE_RESULTS_DIR" "$LOCKS_DIR" 2>/dev/null

if [[ ! -x "$CONSUMER_SCRIPT" ]]; then
  if [[ ! -f "$CONSUMER_SCRIPT" ]]; then
    echo "[dry-run] error: consumer script not found: $CONSUMER_SCRIPT" >&2
    exit 1
  fi
  chmod +x "$CONSUMER_SCRIPT" 2>/dev/null || true
fi

cleanup() {
  rm -f "$SAMPLE_REQUEST_FILE"
  rm -f "$WAKE_PROCESSED_DIR/controlled_${SAMPLE_ID}.md"
  # dummy board files (consumer --dry-run が起稿)
  rm -f "$HOME/.shared-ops/board/$(date +%Y-%m-%d)_zen_dryrun_response_${SAMPLE_ID}.md"
  # consumer lockfile も release (stale 防止)
  bash "$CONSUMER_SCRIPT" --lock-release >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "================================================================"
echo " zen_wake_queue_dry_run — Controlled Wake v0 end-to-end test"
echo "================================================================"
echo ""

# step 1: sample request 起稿
echo "[step 1/4] sample request 起稿"
WIN_BOARD_PATH="C:\\Users\\jk023\\.shared-ops\\board\\$(date +%Y-%m-%d)_dryrun_target.md"
cat > "$SAMPLE_REQUEST_FILE" <<EOF
# Yuino Controlled Wake Request (DRY RUN sample)

- generated_at: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
- request_id: $SAMPLE_ID
- target: zen
- board_path: $WIN_BOARD_PATH
- score: 99
- safety: green
- safety_reason: dry_run_synthetic_request

## Boundary

- Synthetic request for end-to-end dry run.
- Auto-cleanup after dry run completion.
EOF
echo "  sample: $SAMPLE_REQUEST_FILE"
echo "  request_id: $SAMPLE_ID"
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
MARKER_FILE="$WAKE_RESULTS_DIR/${SAMPLE_ID}.json"
if [[ ! -f "$MARKER_FILE" ]]; then
  echo "[dry-run] FAIL step 3: result marker not found: $MARKER_FILE" >&2
  exit 2
fi

# 必須 field check (grep ベース、 jq 不在環境でも動作)
EXPECTED_FIELDS=(
  '"schema_version": "yuino.wake_result.v1"'
  '"target": "zen"'
  '"status": "replied"'
)
for field in "${EXPECTED_FIELDS[@]}"; do
  if ! grep -q "$field" "$MARKER_FILE"; then
    echo "[dry-run] FAIL step 3: required field missing: $field" >&2
    echo "[dry-run]   marker content:" >&2
    cat "$MARKER_FILE" >&2
    exit 2
  fi
done

# response_board_path 非 null check
if grep -q '"response_board_path": null' "$MARKER_FILE"; then
  echo "[dry-run] FAIL step 3: response_board_path is null in replied marker" >&2
  exit 2
fi

echo "  marker: $MARKER_FILE"
echo "  schema_version + target + status=replied + response_board_path 非 null: PASS"
echo ""

# step 4: cleanup (trap で auto)
echo "[step 4/4] cleanup (sample request + dummy board file 削除、 result marker preserve)"
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

#!/usr/bin/env bash
# zen_aira_refresh.sh — Aira Outcome Accounting Gate の status 更新 (= 「世界の動き」 query 物理化)
#
# 起点: 2026-05-31 jun + Zen articulate (= Aira review 後の Zen 側 wake_check 軸)
#   = zen_role の「1 日 1 回 数字で答える」 軸の物理 fire
#   = Aira v0_daily_numbers (= Kai 5/30 commit d432a48 land) を Zen 側から定期 invoke
#
# やること:
#   = nokaze-aira/ の yuino:outcome-accounting:local を fire
#   = Aira 自身が ~/.shared-ops/status/yuino_outcome_accounting.{json,md} を更新
#   = stdout に summary 1 行表示
#
# やらないこと:
#   = nokaze-aira/ 配下のソース改変 (= identity boundary 5 番目: 読むだけ書かない)
#   = Aira boundary を超える操作 (= Aira 自身が ~/.shared-ops/status/ にだけ書く軸を維持)
#
# Output:
#   - ~/.shared-ops/status/yuino_outcome_accounting.json (= Aira が書く)
#   - ~/.shared-ops/status/yuino_outcome_accounting.md   (= Aira が書く)
#   - stdout: business_date / world_movement / revenue_signal / conversion_gap
#
# Usage:
#   bash scripts/zen_aira_refresh.sh        # 実 fire
#   bash scripts/zen_aira_refresh.sh --preview  # 書き込まず stdout のみ

set -uo pipefail

AIRA_DIR="$HOME/Desktop/nokaze-aira"
MODE="local"
if [[ "${1:-}" = "--preview" ]]; then
    MODE="preview"
fi

if [[ ! -d "$AIRA_DIR" ]]; then
    echo "[zen_aira_refresh] nokaze-aira not found at $AIRA_DIR, skip"
    exit 0
fi

if [[ ! -f "$AIRA_DIR/package.json" ]]; then
    echo "[zen_aira_refresh] package.json missing in $AIRA_DIR, skip"
    exit 0
fi

cd "$AIRA_DIR"

# Aira boundary 維持: nokaze-aira/ の npm script を call するのみ (= source は触らない)
# Aira 側で writes_outcome_status_only が encode 済み (= yuino-outcome-accounting.ts boundary)
if ! npm run --silent "yuino:outcome-accounting:${MODE}" 2>&1 | tail -10; then
    echo "[zen_aira_refresh] npm run failed (= Aira side で error 発生)、 後続 hook は status_json 既存版を read"
    exit 1
fi

exit 0

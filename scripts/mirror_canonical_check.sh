#!/usr/bin/env bash
# mirror_canonical_check.sh
# = source (= ~/.shared-ops/decisions/registry.json) と
#   mirror (= ~/Desktop/nokaze/current/decisions/current_decisions.md) の divergence check
# = Kai 6/4 articulate「常時 hook ではなく deterministic check + status surface」 物理化
# = Cowork 7-? + Todo 8 残 1 件の解消
#
# 起稿: 2026-06-05、 Cowork 6/5 推奨経由
# 採用範囲: 朝の startup_sweep or 手動 fire、 divergence あれば warn

set -uo pipefail

SOURCE="$HOME/.shared-ops/decisions/registry.json"
MIRROR="$HOME/Desktop/nokaze/current/decisions/current_decisions.md"

if [[ ! -f "$SOURCE" ]]; then
  echo "[mirror_check] ERROR: source 不在 = $SOURCE" >&2
  exit 1
fi
if [[ ! -f "$MIRROR" ]]; then
  echo "[mirror_check] WARNING: mirror 不在 = $MIRROR" >&2
  exit 2
fi

# mtime diff check (= 1h 超え divergence なら warn)
source_mtime=$(stat -c %Y "$SOURCE" 2>/dev/null)
mirror_mtime=$(stat -c %Y "$MIRROR" 2>/dev/null)

if [[ -n "$source_mtime" && -n "$mirror_mtime" ]]; then
  diff_sec=$((source_mtime - mirror_mtime))
  if (( diff_sec > 3600 )); then
    echo "[mirror_check] DIVERGENCE: source が mirror より $diff_sec 秒新しい (= 1h 超え)、 mirror の regen 候補" >&2
    divergence_exit=3
  elif (( diff_sec < -3600 )); then
    echo "[mirror_check] WARNING: mirror が source より新しい = 想定外 (= mirror は派生のはず)" >&2
    divergence_exit=4
  else
    echo "[mirror_check] OK: source / mirror の時刻差 $diff_sec 秒、 1h 以内 = 整合範囲"
    divergence_exit=0
  fi
else
  echo "[mirror_check] WARNING: mtime 取得失敗" >&2
  divergence_exit=0
fi

# active decision 数の整合 check (= python で json parse + grep)
# path は MSYS → Windows 変換 (= python の path expansion 用)
if command -v cygpath >/dev/null 2>&1; then
  SOURCE_WIN=$(cygpath -w "$SOURCE" 2>/dev/null || echo "$SOURCE")
else
  SOURCE_WIN="$SOURCE"
fi
source_count=$(SOURCE_PATH="$SOURCE_WIN" python -c "
import json, os
try:
    d = json.load(open(os.environ['SOURCE_PATH'], encoding='utf-8'))
    decisions = d.get('decisions', {})
    if isinstance(decisions, dict):
        active = sum(1 for v in decisions.values() if isinstance(v, dict) and v.get('status') == 'active')
    elif isinstance(decisions, list):
        active = sum(1 for v in decisions if isinstance(v, dict) and v.get('status') == 'active')
    else:
        active = 0
    print(active)
except Exception:
    print(0)
" 2>/dev/null)
mirror_count=$(grep -c "^### DEC-" "$MIRROR" 2>/dev/null)

echo "[mirror_check] source active decision count = ${source_count:-0}"
echo "[mirror_check] mirror active section count = ${mirror_count:-0}"

if [[ "${source_count:-0}" != "${mirror_count:-0}" ]]; then
  echo "[mirror_check] DIVERGENCE: source ($source_count) vs mirror ($mirror_count) の active 数不一致" >&2
  if (( divergence_exit == 0 )); then
    divergence_exit=5
  fi
fi

exit $divergence_exit

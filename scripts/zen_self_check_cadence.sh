#!/usr/bin/env bash
# zen_self_check_cadence.sh — self-check 3 軸 articulate template generator
#
# 起点: 2026-05-16 jun structural shift directive 「日に 4-5 回 self-check (朝/昼/夕方/夜)」
# spec: ~/nexus-lab/docs/rules/self_check_cadence.md (= 5/17 朝 z-1 spec v0)
#
# 役割:
#   self-check fire 時に 3 軸 articulate template を stdout 出力、 ledger 追記 + chat output で使う
#   mental ritual から物理化軸への shift の reify、 朝/昼/夕方/夜 cadence 維持の instrument
#
# 動作:
#   1. time-of-day argument 解析 (morning/midday/evening/night/adhoc)
#   2. nokaze Vault の最新 ledger entry を read で見つけて last self-check timestamp 抽出
#   3. 3 軸 (= 何が終わったか / 何が終わってないか / nokaze 整合) template を stdout に出力
#   4. ledger 末尾 append candidate text を出力 (= editor copy-paste 用 or sed append fire 用)
#
# 出力先:
#   stdout = 3 軸 template + ledger 追記 form
#   stderr = 警告 (time-of-day mismatch + 前回 self-check からの経過時間が想定外)
#
# 禁忌:
#   - 自動 ledger 書き込みはしない (= sed -i 等の destructive 操作禁止、 article copy-paste で人間/Zen 判断経由)
#   - 数字盛らない narrative (= 「N 件 done」 narrative は actual fire ベースで埋める)
#   - cron 強制 fire 連携しない (= manual trigger default、 spec § 3 design 連動)
#
# Usage:
#   bash scripts/zen_self_check_cadence.sh morning
#   bash scripts/zen_self_check_cadence.sh midday
#   bash scripts/zen_self_check_cadence.sh evening
#   bash scripts/zen_self_check_cadence.sh night
#   bash scripts/zen_self_check_cadence.sh adhoc
#
# Spec: docs/rules/self_check_cadence.md

set -uo pipefail

TIME_OF_DAY="${1:-adhoc}"
VAULT_LEDGER_DIR="$HOME/Desktop/nokaze/ledger/daily_audit"
TODAY=$(date +%Y-%m-%d)
TODAY_LEDGER="$VAULT_LEDGER_DIR/${TODAY}.md"
NOW_HM=$(date +%H:%M)
NOW_HMS=$(date +%H:%M:%S)

# ---------------------------------------------------------------
# block 1: time-of-day validation + 想定 window check
# ---------------------------------------------------------------
case "$TIME_OF_DAY" in
  morning|midday|evening|night|adhoc) ;;
  *)
    echo "[zen_self_check_cadence] ERROR: unknown time-of-day '$TIME_OF_DAY'。 morning/midday/evening/night/adhoc のいずれか" >&2
    exit 1
    ;;
esac

HOUR=$((10#$(date +%H)))
WARN_WINDOW=""
case "$TIME_OF_DAY" in
  morning)
    if (( HOUR < 7 || HOUR > 10 )); then
      WARN_WINDOW="morning は通常 7:00-10:00 想定、 現在 ${NOW_HM}"
    fi
    ;;
  midday)
    if (( HOUR < 11 || HOUR > 14 )); then
      WARN_WINDOW="midday は通常 11:30-14:00 想定、 現在 ${NOW_HM}"
    fi
    ;;
  evening)
    if (( HOUR < 16 || HOUR > 19 )); then
      WARN_WINDOW="evening は通常 16:00-18:00 想定、 現在 ${NOW_HM}"
    fi
    ;;
  night)
    if (( HOUR < 20 || HOUR > 23 )); then
      WARN_WINDOW="night は通常 21:00-22:00 想定、 現在 ${NOW_HM}"
    fi
    ;;
esac

if [[ -n "$WARN_WINDOW" ]]; then
  echo "[zen_self_check_cadence] WARN: $WARN_WINDOW" >&2
fi

# ---------------------------------------------------------------
# block 2: today ledger 存在 check
# ---------------------------------------------------------------
if [[ ! -f "$TODAY_LEDGER" ]]; then
  echo "[zen_self_check_cadence] WARN: today ledger 不在 ($TODAY_LEDGER)、 ledger 起稿が先" >&2
fi

# ---------------------------------------------------------------
# block 3: 前回 self-check の経過時間 check (= ledger 内 section heading から推定)
# ---------------------------------------------------------------
LAST_SELF_CHECK=""
if [[ -f "$TODAY_LEDGER" ]]; then
  # ledger 内で「self-check」 keyword を含む最後の section heading を抽出
  LAST_SELF_CHECK=$(grep -E "^##.*self-check" "$TODAY_LEDGER" 2>/dev/null | tail -1 || echo "")
fi

# ---------------------------------------------------------------
# block 4: section number 推定 (= today ledger の最大 section number + 1)
# ---------------------------------------------------------------
NEXT_SECTION=1
if [[ -f "$TODAY_LEDGER" ]]; then
  MAX_SECTION=$(grep -E "^## [0-9]+\." "$TODAY_LEDGER" 2>/dev/null | sed -E 's/^## ([0-9]+)\..*/\1/' | sort -n | tail -1 || echo "0")
  if [[ -n "$MAX_SECTION" ]] && [[ "$MAX_SECTION" =~ ^[0-9]+$ ]]; then
    NEXT_SECTION=$((MAX_SECTION + 1))
  fi
fi

# ---------------------------------------------------------------
# block 5: 3 軸 template 出力
# ---------------------------------------------------------------
cat <<EOF

=== Zen Self-check Cadence Template ===
date: $TODAY
time-of-day: $TIME_OF_DAY
now: $NOW_HMS
last-self-check: ${LAST_SELF_CHECK:-(today ledger 内に self-check section なし、 本 fire が 1 件目)}
next-section-candidate: §$NEXT_SECTION

--- ledger 追記 template (= 編集して ledger 末尾に追加) ---

## $NEXT_SECTION. ${NOW_HM} ${TIME_OF_DAY} self-check (= 1 日 4-5 回 cadence の N 件目)

### ${NEXT_SECTION}-1. 何が終わったか (= 直前 window で完了した actual fire)
- (fill in: 完了 fire 一覧 + 物理 evidence 紐付き)

### ${NEXT_SECTION}-2. 何が終わってないか (= active_tasks.md 残り + 並走中)
- (fill in: Red boundary 軸 / Zen + Kai 自走範囲 / Zen-led / Kai-led / 並走中 articulate)

### ${NEXT_SECTION}-3. これが nokaze のためになってるか?
- (fill in: 各 fire の axis 判定 = yes / partial yes / 軸偏り surface)

### ${NEXT_SECTION}-4. 軸偏り audit (= 5/16 21:05 self-check の continuum)
- (fill in: 外向き軸 vs 内部整合性軸 vs Research Division 軸 vs その他の比率)

### ${NEXT_SECTION}-5. next fire priority (= 残 day の動き)
- (fill in: 並走中 background + Zen main session 次 fire candidate)

---

Zen
$TODAY ${NOW_HM} 頃 (= ledger §${NEXT_SECTION} = $TIME_OF_DAY self-check 1 日 N 件目)

EOF

# ---------------------------------------------------------------
# block 6: reminder
# ---------------------------------------------------------------
cat <<'EOF' >&2

[zen_self_check_cadence] reminder:
  - 上記 template を editor で fill in、 today ledger 末尾に append
  - task_table も同時に update candidate
  - 数字盛らない narrative (= actual fire ベースで articulate)
  - 内部用語 paraphrase ritual 遵守
EOF

exit 0

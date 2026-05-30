#!/bin/bash
# Zen Startup Sweep — セッション開始時の能動的 state 確認
#
# 反応型から自走型への第一歩: 新着メッセージがなくても、共有 state と
# 自分 side state を能動的に読み、「今日進める1件」を自分で決める。
#
# Usage: bash scripts/zen_startup_sweep.sh
#
# Output:
#   - 標準出力: state サマリ (人が読む)
#   - ~/.shared-ops/status/zen_today.md : 今日の1件記入テンプレ

set -euo pipefail

SHARED_OPS="$HOME/.shared-ops"
NEXUS_LAB="$HOME/nexus-lab"
TODAY=$(date +%Y-%m-%d)
NOW=$(date +%Y-%m-%dT%H:%M:%S%z)
TODAY_FILE="$SHARED_OPS/status/zen_today.md"

# ---------------------------------------------------------------
# 候補プール (優先順位で仮選択するための蓄積)
#   priority: 1=Kai→Zen 今日未返信 / 2=Kai→Zen 7日積み残し
#             3=inbox Pending / 4=knots 再発防止
#   format  : "<priority>\t<label>\t<reason>"
# ---------------------------------------------------------------
CANDIDATES_FILE=$(mktemp)
trap 'rm -f "$CANDIDATES_FILE"' EXIT

add_candidate() {
  # $1=priority  $2=label  $3=reason
  printf "%s\t%s\t%s\n" "$1" "$2" "$3" >> "$CANDIDATES_FILE"
}

# ---------------------------------------------------------------
# 表示ヘルパー
# ---------------------------------------------------------------
header() {
  echo ""
  echo "================================================================"
  echo " $1"
  echo "================================================================"
}

subheader() {
  echo ""
  echo "--- $1 ---"
}

# ---------------------------------------------------------------
# 1. 共有 state
# ---------------------------------------------------------------
header "Zen Startup Sweep — $NOW"

subheader "board/ : 今日の Kai→Zen まだ返事してない分"
# 「直近24h」ではなく「今日0時以降」をスコープにする (古い backlog で
# 自走が止まらないように、Kai 側 autonomous-sweep と同じ思想)
INCOMING=$(find "$SHARED_OPS/board" -maxdepth 1 -type f -name "${TODAY}_kai_zen_*.md" \
  ! -name "*_response_*" 2>/dev/null | sort)

# ---------------------------------------------------------------
# 返信判定ヘルパー (2026-04-23 Iwa fix for false positive)
#   旧: *_zen_kai_response_${slug}.md の完全一致 only
#   新: (1) frontmatter "replied_by:" を原 msg 側に持てば即 link (future)
#       (2) 原 msg date <= response date かつ、slug の意味トークンが
#           2 個以上一致する response を返信とみなす
#   note:
#     - 短い token (3文字未満、数字のみ、非ASCII) は除外
#     - "response/ack/reply/handoff" のような generic token は noise
#       として除外し、topic の overlap だけ見る
#     - 完全一致は依然 fast-path として通す (hash O(1))
# is_replied <orig_base> <orig_date>
#   returns 0 if replied, 1 if pending. Prints matched reply basename
#   to stdout (empty if none).
# ---------------------------------------------------------------
STOPWORDS_RE='^(response|ack|reply|replied|note|draft)$'

# 手動 resolved mark list (is_replied 自動判定を bypass、resolved confirmed 済 backlog)
# 議題 30 連動: Iwa T6 sweep filter 自動化 packet (5/05 期限) で恒久 fix 候補、暫定で manual list
SWEEP_RESOLVED_MARKS='2026-04-26_kai_zen_aira_cost_model_fitness_binding_view'

is_resolved_mark() {
  local base="$1"
  echo "$SWEEP_RESOLVED_MARKS" | tr ',' '\n' | grep -qFx "$base"
}

is_replied() {
  local orig_base="$1"
  local orig_date="$2"
  local orig_slug="${orig_base#*_kai_zen_}"

  # 0) frontmatter replied_by: <basename> を原 msg が持つか
  local orig_file="$SHARED_OPS/board/${orig_base}.md"
  if [ -f "$orig_file" ]; then
    local declared
    declared=$(grep -E "^replied_by:" "$orig_file" 2>/dev/null \
      | head -1 | sed -E 's/^replied_by:[[:space:]]*//; s/[[:space:]]*$//' | tr -d '"')
    if [ -n "$declared" ]; then
      if [ -f "$SHARED_OPS/board/${declared}.md" ] \
        || [ -f "$SHARED_OPS/board/${declared}" ]; then
        printf "%s\n" "$declared"
        return 0
      fi
    fi
  fi

  # 1) fast-path: 完全 slug 一致 (date 不問、既存挙動維持)
  local exact
  exact=$(find "$SHARED_OPS/board" -maxdepth 1 -type f \
    -name "*_zen_kai_response_${orig_slug}.md" 2>/dev/null | head -1)
  if [ -n "$exact" ]; then
    printf "%s\n" "$(basename "$exact" .md)"
    return 0
  fi

  # 2) token overlap: 原 msg 日付以降の response を列挙し、
  #    意味 token が 2 個以上 overlap するものを返信とみなす
  local orig_tokens
  orig_tokens=$(printf "%s" "$orig_slug" | tr '_' '\n' \
    | awk 'length($0) >= 3 && $0 !~ /^[0-9]+$/' \
    | grep -Ev "$STOPWORDS_RE" \
    | LC_ALL=C grep -E '^[A-Za-z0-9]+$' || true)
  # token 数が少ない (2 以下) なら 1 個一致で return、多いなら 2 個要求
  local orig_token_count
  orig_token_count=$(printf "%s" "$orig_tokens" | grep -c . || true)
  local need_overlap=2
  if [ "$orig_token_count" -le 2 ]; then
    need_overlap=1
  fi

  local resp best_base="" best_overlap=0
  while IFS= read -r resp; do
    [ -z "$resp" ] && continue
    local resp_base
    resp_base=$(basename "$resp" .md)
    # 日付 gate: response の date >= orig の date
    local resp_date="${resp_base%%_*}"
    if [[ ! "$resp_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      continue
    fi
    if [[ "$resp_date" < "$orig_date" ]]; then
      continue
    fi
    local resp_slug="${resp_base#*_zen_kai_response_}"

    # ASCII token overlap — 最大 overlap の response を選ぶ (specificity優先)
    if [ -n "$orig_tokens" ]; then
      local overlap
      overlap=$(printf "%s\n%s\n" "$orig_tokens" \
        "$(printf "%s" "$resp_slug" | tr '_' '\n' \
          | awk 'length($0) >= 3 && $0 !~ /^[0-9]+$/' \
          | grep -Ev "$STOPWORDS_RE" \
          | LC_ALL=C grep -E '^[A-Za-z0-9]+$' || true)" \
        | sort | uniq -d | wc -l)
      if [ "$overlap" -ge "$need_overlap" ] && [ "$overlap" -gt "$best_overlap" ]; then
        best_overlap="$overlap"
        best_base="$resp_base"
      fi
      continue
    fi

    # 非 ASCII (日本語) fallback: 原 msg と response の本文 title を
    # 比較できないので、同日投稿された zen→kai response を返信とみなす
    # (緩い判定、false positive は diary で再確認)
    if [ -z "$orig_tokens" ] && [ "$resp_date" = "$orig_date" ] && [ -z "$best_base" ]; then
      best_base="$resp_base"
      best_overlap=1
    fi
  done < <(find "$SHARED_OPS/board" -maxdepth 1 -type f \
    -name "*_zen_kai_response_*.md" 2>/dev/null | sort)

  if [ -n "$best_base" ]; then
    printf "%s\n" "$best_base"
    return 0
  fi
  return 1
}

if [ -z "$INCOMING" ]; then
  echo "  (今日の新着なし)"
else
  UNREPLIED_COUNT=0
  while IFS= read -r f; do
    base=$(basename "$f" .md)
    orig_date="${base%%_*}"
    if REPLY_MATCH=$(is_replied "$base" "$orig_date"); then
      echo "  [返信済み] $base  (← $REPLY_MATCH)"
    else
      echo "  [まだ返事してない] $base"
      UNREPLIED_COUNT=$((UNREPLIED_COUNT + 1))
      add_candidate 1 "Kai→Zen まだ返事してない分に応答: $base" \
        "今日 Kai から届いた、 まだ返事してないメッセージ (優先度: 最優先)"
    fi
  done <<< "$INCOMING"
  echo ""
  echo "  → 今日まだ返事してない: $UNREPLIED_COUNT 件"
fi

subheader "board/ : 7日以内のまだ手をつけてない分 (参考、 無視可)"
# 古い backlog はノイズになりがちなので「件数だけ」で済ませる
OLD_INCOMING=$(find "$SHARED_OPS/board" -maxdepth 1 -type f -name "*_kai_zen_*.md" \
  -mtime -7 ! -newermt "${TODAY} 00:00:00" \
  ! -name "*_response_*" 2>/dev/null | sort)
OLD_UNREPLIED=0
OLDEST_PENDING_BASE=""
if [ -n "$OLD_INCOMING" ]; then
  while IFS= read -r f; do
    base=$(basename "$f" .md)
    orig_date="${base%%_*}"
    if is_resolved_mark "$base"; then
      continue
    fi
    if ! is_replied "$base" "$orig_date" >/dev/null; then
      OLD_UNREPLIED=$((OLD_UNREPLIED + 1))
      # 最も古い (sort済み先頭) をひとつ記録
      if [ -z "$OLDEST_PENDING_BASE" ]; then
        OLDEST_PENDING_BASE="$base"
      fi
    fi
  done <<< "$OLD_INCOMING"
fi
echo "  過去7日でまだ手をつけてない分: $OLD_UNREPLIED 件 (詳細は手動で board/ を grep)"
if [ -n "$OLDEST_PENDING_BASE" ]; then
  add_candidate 2 "7日以内のまだ手をつけてない分に応答: $OLDEST_PENDING_BASE" \
    "過去7日 Kai→Zen でまだ手をつけてない $OLD_UNREPLIED 件の先頭 (古い順)"
fi

subheader "inbox/INDEX.md : owner 判断待ちの候補"
if [ -f "$SHARED_OPS/inbox/INDEX.md" ]; then
  # Pending セクションのテーブル行だけ抽出
  PENDING_ROWS=$(awk '/^## Pending/,/^## /' "$SHARED_OPS/inbox/INDEX.md" \
    | grep -E "^\| [0-9]" || true)
  if [ -n "$PENDING_ROWS" ]; then
    echo "$PENDING_ROWS"
    # 先頭行から #番号とタイトル相当を抜いて候補化 (パイプ区切り表)
    FIRST_PENDING=$(echo "$PENDING_ROWS" | head -1)
    # | 1 | title | ... のような形式 — 2カラム目を label に採用
    P_NUM=$(echo "$FIRST_PENDING" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
    P_TITLE=$(echo "$FIRST_PENDING" | awk -F'|' '{sub(/^ +/,"",$3); sub(/ +$/,"",$3); print $3}')
    if [ -n "$P_TITLE" ]; then
      add_candidate 3 "inbox #${P_NUM} を前進: ${P_TITLE}" \
        "inbox 判断待ちの先頭 (owner 判断キューの最上位)"
    fi
  else
    echo "  (判断待ちなし)"
  fi
else
  echo "  (INDEX.md なし)"
fi

subheader "knots/ + successes/ : 直近7日"
echo "[knots]"
RECENT_KNOTS=$(find "$SHARED_OPS/knots" -maxdepth 1 -type f -name "*.md" -mtime -7 \
  ! -name "INDEX.md" ! -name "README.md" ! -name "schema.md" \
  -printf "%T@ %f\n" 2>/dev/null | sort -rn || true)
if [ -n "$RECENT_KNOTS" ]; then
  echo "$RECENT_KNOTS" | awk '{print "  " $2}'
  # 最新の knot を候補化 (再発防止用)
  LATEST_KNOT=$(echo "$RECENT_KNOTS" | head -1 | awk '{print $2}')
  if [ -n "$LATEST_KNOT" ]; then
    add_candidate 4 "knot 再発防止レビュー: $LATEST_KNOT" \
      "直近7日で一番新しい knot (再発防止の仕組み化を検討する候補)"
  fi
else
  echo "  (なし)"
fi
echo "[successes]"
find "$SHARED_OPS/successes" -maxdepth 1 -type f -name "*.md" -mtime -7 \
  ! -name "INDEX.md" ! -name "README.md" ! -name "schema.md" \
  -printf "  %f\n" 2>/dev/null | sort || echo "  (なし)"

# ---------------------------------------------------------------
# 2. 自分 side state (Nexus Lab)
# ---------------------------------------------------------------
header "Nexus Lab side state"

subheader "git status (nexus-lab)"
if [ -d "$NEXUS_LAB/.git" ]; then
  cd "$NEXUS_LAB"
  STATUS=$(git status --short 2>/dev/null)
  if [ -z "$STATUS" ]; then
    echo "  (clean)"
  else
    echo "$STATUS" | sed 's/^/  /'
  fi
  echo ""
  BRANCH=$(git branch --show-current)
  AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "?")
  echo "  branch: $BRANCH (ahead: $AHEAD)"
fi

subheader "team_memory/ 直近 diary"
TM_BASE="$HOME/.claude/projects/c--Users-jk023-nexus-lab/team_memory"
if [ -d "$TM_BASE" ]; then
  for member in iwa oto akari kagami hoshi kura; do
    if [ -d "$TM_BASE/$member" ]; then
      LATEST=$(find "$TM_BASE/$member" -maxdepth 2 -type f -name "*.md" -mtime -7 \
        ! -name "MEMORY.md" ! -name "identity.md" ! -name "README.md" \
        -printf "%T@ %f\n" 2>/dev/null | sort -rn | head -1 | awk '{print $2}')
      if [ -n "$LATEST" ]; then
        echo "  [$member] $LATEST"
      else
        echo "  [$member] (no recent entry)"
      fi
    fi
  done
fi

# ---------------------------------------------------------------
# 3. 今日の1件 — テンプレ書き出し
# ---------------------------------------------------------------
header "今日の1件 (decision template)"

EARLY_EXIT=0
if [ -f "$TODAY_FILE" ]; then
  CURRENT_DATE=$(grep -E "^date:" "$TODAY_FILE" 2>/dev/null | head -1 | awk '{print $2}')
  if [ "$CURRENT_DATE" = "$TODAY" ]; then
    echo "  $TODAY_FILE は今日のものが既に存在 (上書きせず保持)"
    echo ""
    cat "$TODAY_FILE" | sed 's/^/  /'
    echo ""
    echo "  → 編集する場合は手動で。新規 sweep は内容を上書きしません。"
    EARLY_EXIT=1
  fi
fi

# ---------------------------------------------------------------
# 候補プールから「今日の1件」を仮選択 (rule-based)
#   優先度 1 < 2 < 3 < 4 の昇順で、最上位 1 件を採る。
#   空欄放置を防ぐための仮決定。Zen が後で上書きしてよい。
#
#   ただし EARLY_EXIT=1 (今日の zen_today.md 既存) のときは、
#   template を上書きしない。この場合は skip してから lint 段階に進む。
# ---------------------------------------------------------------
if [ "$EARLY_EXIT" = "1" ]; then
  CHOSEN_LABEL="(today already set; not overwriting)"
  CHOSEN_REASON="skipped"
  CHOSEN_PRIORITY="skipped"
  SKIP_WRITE=1
else
  SKIP_WRITE=0
fi

CHOSEN_LABEL="${CHOSEN_LABEL:-}"
CHOSEN_REASON=""
CHOSEN_PRIORITY=""
if [ -s "$CANDIDATES_FILE" ]; then
  # priority(数値) で昇順、同priority内は登場順 (stable)
  TOP=$(sort -k1,1n -s "$CANDIDATES_FILE" | head -1)
  CHOSEN_PRIORITY=$(printf "%s" "$TOP" | cut -f1)
  CHOSEN_LABEL=$(printf "%s" "$TOP" | cut -f2)
  CHOSEN_REASON=$(printf "%s" "$TOP" | cut -f3)
fi

if [ -z "$CHOSEN_LABEL" ]; then
  CHOSEN_LABEL="自走モードの棚卸し (まだ返事してない / inbox 判断待ち / knots のいずれも該当なし)"
  CHOSEN_REASON="候補プール空 — 静かな日。 diary / report 整備や、 後回しにしてた技術整理向け"
  CHOSEN_PRIORITY="fallback"
fi

# EARLY_EXIT 時は既存 zen_today.md を保持 (上書きしない)。
if [ "$SKIP_WRITE" = "1" ]; then
  echo "  zen_today.md は既存を保持 (今日のテンプレ上書きなし)"
else
  # 新規 / 古い zen_today.md を上書き
  mkdir -p "$(dirname "$TODAY_FILE")"
  cat > "$TODAY_FILE" <<EOF
---
date: $TODAY
generated: $NOW
generated_by: zen_startup_sweep.sh
auto_selected_priority: $CHOSEN_PRIORITY
---

# Zen — 今日の1件

## 選んだ1件
$CHOSEN_LABEL

## なぜこれにしたか
$CHOSEN_REASON
(sweep による仮決定 — 不適切なら上書きしてよい)

## 期待する成果物
(具体的に: PRマージ / メッセージ送信 / 実装完了 等)

## 本日の制約・注意
- 金銭発生はRed (即停止 + ジュン確認)
- Yellow判断は inbox 経由で夜のキューに積む
- 進捗は本ファイルに追記、終了時に diary/ に転記

## 進捗ログ
(時刻ベースで追記)

EOF

  echo "  $TODAY_FILE に新規テンプレを書き出した"
  echo "  → 仮選択 (優先度=$CHOSEN_PRIORITY): $CHOSEN_LABEL"
  echo "  → 合わなければ zen_today.md を上書きして決め直す"
fi

# ---------------------------------------------------------------
# 4. memory-lint (L1 + L2 MVP)
#   非ブロッキング: lint が violation 検出しても sweep 全体は通す。
#   Zen が status/memory_lint_last.md を読んで判断する。
#   2026-04-19 Iwa, spec: team_memory/_shared/2026-04-19_zen_memory_lint_spec.md
# ---------------------------------------------------------------
header "memory-lint"
if [ -f "$NEXUS_LAB/scripts/memory_lint.py" ]; then
  PYTHON_BIN=$(command -v python3 || command -v python || true)
  if [ -n "$PYTHON_BIN" ]; then
    ( cd "$NEXUS_LAB" && "$PYTHON_BIN" scripts/memory_lint.py --class L1,L2 ) || true
  else
    echo "  (python not found; memory-lint skipped)"
  fi
  echo ""
  echo "  詳細: ~/.shared-ops/status/memory_lint_last.md"
else
  echo "  (memory_lint.py 未導入)"
fi

# ---------------------------------------------------------------
# 5. BOOTH 14日観測 metric fetch reminder
#   Iwa, 2026-04-22 (cohort start) - 2026-05-06 (14日判定)
#   spec: ~/.shared-ops/docs/booth_metrics_fetch_design_2026-04-22.md
#   runbook: ~/.shared-ops/scripts/booth_metrics_fetch.runbook.md
#   実 fetch は Zen が runbook を読んで Playwright MCP 経由で実行する
#   (bash から MCP tool を直接叩けないため、ここは reminder のみ)
# ---------------------------------------------------------------
header "BOOTH metrics fetch (14日観測 cohort: 2026-04-22 → 2026-05-06)"
COHORT_START="2026-04-22"
COHORT_END="2026-05-06"
APPEND_SH="$SHARED_OPS/scripts/booth_metrics_append.sh"
DATA_FILE="$SHARED_OPS/data/booth_metrics/${TODAY}.jsonl"

# 観測窓判定 (POSIX date 引き算)
in_window() {
  local today_epoch start_epoch end_epoch
  today_epoch=$(date -d "$TODAY" +%s 2>/dev/null) || return 1
  start_epoch=$(date -d "$COHORT_START" +%s 2>/dev/null) || return 1
  end_epoch=$(date -d "$COHORT_END" +%s 2>/dev/null) || return 1
  [ "$today_epoch" -ge "$start_epoch" ] && [ "$today_epoch" -le "$end_epoch" ]
}

if ! in_window; then
  echo "  (観測窓外 — cohort: $COHORT_START 〜 $COHORT_END / today: $TODAY)"
elif [ ! -f "$APPEND_SH" ]; then
  echo "  WARN: $APPEND_SH なし、Iwa Phase 2 deliverable 未到着の可能性"
else
  if bash "$APPEND_SH" check "$TODAY" 2>/dev/null; then
    LINE_COUNT=$(bash "$APPEND_SH" count "$TODAY")
    echo "  [done] $TODAY 既に fetch 済 ($LINE_COUNT lines, 想定 5)"
    # Rebuild ledger (idempotent) so sweep output reflects latest cohort state
    LEDGER_SH="$SHARED_OPS/scripts/booth_metrics_ledger.sh"
    if [ -f "$LEDGER_SH" ]; then
      bash "$LEDGER_SH" build >/dev/null 2>&1 || true
      echo "  ledger: $SHARED_OPS/data/booth_metrics/derived/ledger.md (rebuilt)"
    fi
  else
    DAY_OFFSET=$(( ($(date -d "$TODAY" +%s) - $(date -d "$COHORT_START" +%s)) / 86400 ))
    echo "  [TODO] $TODAY (day +$DAY_OFFSET / 14) fetch 未実施"
    echo "  → Zen: runbook を読んで Playwright MCP 経由で実行"
    echo "  → runbook: $SHARED_OPS/scripts/booth_metrics_fetch.runbook.md"
    echo "  → 想定所要 35 秒 / 4 page navigate"
    add_candidate 2 "BOOTH metrics fetch (day +$DAY_OFFSET / 14)" \
      "14 日観測 cohort 中、本日分 fetch 未実施 (sweep 自動 reminder)"
  fi
fi

# ---------------------------------------------------------------
# board_audit_step (5/05 + 5/07 + 5/08 朝の 3 連発火 root fix、 Kai 5/08 17:30 判断 #1)
#   Zen が 「気をつける」 段階を超えた、 sweep に物理統合で 朝 audit miss 抑止
# ---------------------------------------------------------------
header "board audit step (read miss 抑止、 Kai 判断 #1 reify)"
BOARD_AUDIT_SH="$NEXUS_LAB/scripts/board_audit_step.sh"
if [ -x "$BOARD_AUDIT_SH" ]; then
  bash "$BOARD_AUDIT_SH" 2>&1 | tail -30
else
  echo "  (board_audit_step.sh 不在、 skip)"
fi

# ---------------------------------------------------------------
# Yuino Controlled Wake v0 (5/08 reify 連動): wake-queue/zen/ surface
#   board_audit_step は 「起きた時に読み漏らさない」、 Controlled Wake v0 は 「読むきっかけ」、 役割違いで両方必要 (Kai 5/08 17:30 判断)
# ---------------------------------------------------------------
header "Controlled Wake v0 (Yuino 経由 wake request)"
WAKE_CONSUME_SH="$NEXUS_LAB/scripts/zen_wake_queue_consume.sh"
if [ -x "$WAKE_CONSUME_SH" ]; then
  bash "$WAKE_CONSUME_SH" 2>&1 | tail -25
else
  echo "  (zen_wake_queue_consume.sh 不在、 skip)"
fi

# ---------------------------------------------------------------
# Aira Outcome Accounting (= 5/30 articulate land、 「世界の動き」 daily 1 回 fire)
#   = business_date が今日と違えば refresh、 同じなら skip (= 1 日 1 回保証)
#   = Aira boundary: ~/.shared-ops/status/ にだけ書く、 外部 action なし
# ---------------------------------------------------------------
header "Aira Outcome Accounting (= 世界の動き daily refresh)"
AIRA_STATUS_JSON_SWEEP="$SHARED_OPS/status/yuino_outcome_accounting.json"
AIRA_REFRESH_SH="$NEXUS_LAB/scripts/zen_aira_refresh.sh"
needs_refresh=1
if [ -f "$AIRA_STATUS_JSON_SWEEP" ]; then
    if command -v cygpath >/dev/null 2>&1; then
        AIRA_PATH_WIN_SWEEP=$(cygpath -w "$AIRA_STATUS_JSON_SWEEP")
    else
        AIRA_PATH_WIN_SWEEP="$AIRA_STATUS_JSON_SWEEP"
    fi
    aira_date_sweep=$(AIRA_PATH="$AIRA_PATH_WIN_SWEEP" python -c "
import json, os
try:
    d = json.load(open(os.environ['AIRA_PATH'], encoding='utf-8'))
    print(d.get('business_date', ''))
except Exception:
    print('')
" 2>/dev/null)
    if [ "$aira_date_sweep" = "$TODAY" ]; then
        needs_refresh=0
        echo "  - $TODAY status fresh (= skip refresh)"
        echo "  - read: $AIRA_STATUS_JSON_SWEEP"
    fi
fi
if [ "$needs_refresh" = "1" ]; then
    if [ -x "$AIRA_REFRESH_SH" ]; then
        echo "  - status stale or missing、 fire: $AIRA_REFRESH_SH"
        bash "$AIRA_REFRESH_SH" 2>&1 | tail -10
    else
        echo "  - zen_aira_refresh.sh 不在、 skip (= 手動 fire: cd ~/Desktop/nokaze-aira && npm run yuino:outcome-accounting:local)"
    fi
fi

# ---------------------------------------------------------------
# 終わり
# ---------------------------------------------------------------
header "Sweep完了"
echo "  Next: zen_today.md の「選んだ1件」を埋めて作業開始"
echo "  + Controlled Wake v0 actionable があれば Read → response 起稿 → ./scripts/zen_wake_queue_consume.sh --archive <id>"

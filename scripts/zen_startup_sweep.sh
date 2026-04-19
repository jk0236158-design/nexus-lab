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

subheader "board/ : 今日の Kai→Zen 未返信"
# 「直近24h」ではなく「今日0時以降」をスコープにする (古い backlog で
# 自走が止まらないように、Kai 側 autonomous-sweep と同じ思想)
INCOMING=$(find "$SHARED_OPS/board" -maxdepth 1 -type f -name "${TODAY}_kai_zen_*.md" \
  ! -name "*_response_*" 2>/dev/null | sort)

if [ -z "$INCOMING" ]; then
  echo "  (今日の未読なし)"
else
  UNREPLIED_COUNT=0
  while IFS= read -r f; do
    base=$(basename "$f" .md)
    # slug 抽出: 日付_kai_zen_{slug}
    slug="${base#*_kai_zen_}"
    # 対応する zen→kai response を日付不問で探す
    REPLY_MATCH=$(find "$SHARED_OPS/board" -maxdepth 1 \
      -name "*_zen_kai_response_${slug}.md" 2>/dev/null | head -1)
    if [ -n "$REPLY_MATCH" ]; then
      echo "  [replied] $base"
    else
      echo "  [PENDING] $base"
      UNREPLIED_COUNT=$((UNREPLIED_COUNT + 1))
      add_candidate 1 "Kai→Zen 未返信に応答: $base" \
        "今日 Kai から届いた未返信メッセージ (最優先)"
    fi
  done <<< "$INCOMING"
  echo ""
  echo "  → 今日の未返信: $UNREPLIED_COUNT 件"
fi

subheader "board/ : 7日以内の積み残し (参考、無視可)"
# 古い backlog はノイズになりがちなので「件数だけ」で済ませる
OLD_INCOMING=$(find "$SHARED_OPS/board" -maxdepth 1 -type f -name "*_kai_zen_*.md" \
  -mtime -7 ! -newermt "${TODAY} 00:00:00" \
  ! -name "*_response_*" 2>/dev/null | sort)
OLD_UNREPLIED=0
OLDEST_PENDING_BASE=""
if [ -n "$OLD_INCOMING" ]; then
  while IFS= read -r f; do
    base=$(basename "$f" .md)
    slug="${base#*_kai_zen_}"
    if ! find "$SHARED_OPS/board" -maxdepth 1 \
        -name "*_zen_kai_response_${slug}.md" 2>/dev/null | grep -q .; then
      OLD_UNREPLIED=$((OLD_UNREPLIED + 1))
      # 最も古い (sort済み先頭) をひとつ記録
      if [ -z "$OLDEST_PENDING_BASE" ]; then
        OLDEST_PENDING_BASE="$base"
      fi
    fi
  done <<< "$OLD_INCOMING"
fi
echo "  過去7日積み残し: $OLD_UNREPLIED 件 (詳細は手動で board/ を grep)"
if [ -n "$OLDEST_PENDING_BASE" ]; then
  add_candidate 2 "7日以内の積み残し応答: $OLDEST_PENDING_BASE" \
    "過去7日 Kai→Zen 積み残し $OLD_UNREPLIED 件の先頭 (古い順)"
fi

subheader "inbox/INDEX.md : owner判断pending"
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
        "inbox Pending 先頭 (owner 判断キュー最上位)"
    fi
  else
    echo "  (pending なし)"
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
      "直近7日の最新 knot (再発防止の仕組み化検討)"
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
  CHOSEN_LABEL="自走モードの棚卸し (未返信/inbox/knots いずれも該当なし)"
  CHOSEN_REASON="候補プール空 — 静かな日。diary/report 整備や技術負債の棚卸し向け"
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
  echo "  → 仮選択 (priority=$CHOSEN_PRIORITY): $CHOSEN_LABEL"
  echo "  → 不適切なら zen_today.md を上書きして再決定"
fi

# ---------------------------------------------------------------
# 4. memory-lint (L1 + L2 MVP)
#   非ブロッキング: lint が violation 検出しても sweep 全体は通す。
#   Zen が status/memory_lint_last.md を読んで判断する。
#   2026-04-19 Iwa, spec: team_memory/_shared/2026-04-19_zen_memory_lint_spec.md
# ---------------------------------------------------------------
header "memory-lint"
if [ -f "$NEXUS_LAB/scripts/memory_lint.py" ]; then
  ( cd "$NEXUS_LAB" && python scripts/memory_lint.py --class L1,L2 ) || true
  echo ""
  echo "  詳細: ~/.shared-ops/status/memory_lint_last.md"
else
  echo "  (memory_lint.py 未導入)"
fi

# ---------------------------------------------------------------
# 終わり
# ---------------------------------------------------------------
header "Sweep完了"
echo "  Next: zen_today.md の「選んだ1件」を埋めて作業開始"

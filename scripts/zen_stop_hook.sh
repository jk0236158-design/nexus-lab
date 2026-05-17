#!/usr/bin/env bash
# zen_stop_hook.sh — Stop event hook: pending packet 残存時に Claude を継続させる
#
# 起点: 2026-05-11 jun directive 経由 Ralph Wiggum 系統 Stop hook 反映
#   actual evidence: 私 (Zen) の self-stop drift (5/11 09:30-10:50 + 12:00-13:25 で 2 回再発)
#   = mental ruled 「Green 範囲は寝てる間も 1 batch ずつ」 + 「やることが決まってる、 止まらなくていい」
#     を physical reify、 structural drift fix
#
# 動作:
#   1. stdin JSON parse、 stop_hook_active flag check (infinite loop 防止)
#   2. ~/.shared-ops/chat_outbox/zen/*.md の pending packet count
#   3. ~/.shared-ops/board/2026-*_kai_*.md の最新が私の最終 response より新しいか check
#   4. 残存 actionable あり → exit 2 + stderr で 「pending N 件 / 新規 board あり、 consume せよ」 inject
#   5. 0 件 → exit 0、 Claude stop allow
#
# 公式 docs 整合:
#   - Claude Code Stop hook (https://code.claude.com/docs/en/hooks)
#   - exit code 2 + stderr で chat output turn end block、 Claude continue conversation
#   - stop_hook_active flag を check しないと infinite loop risk
#
# 禁忌:
#   - jun explicit 「stop」 / 「close」 / 「終わり」 narrative 検出時は exit 0 (jun stop directive 優先)
#   - hook 内 large output 禁止 (10000 chars cap、 stderr only 1-3 行 default)
#   - 600 sec timeout 内で完了 (default、 但し本 hook は 5 sec 想定)

set -uo pipefail

SHARED_OPS="$HOME/.shared-ops"
CHAT_OUTBOX="$SHARED_OPS/chat_outbox/zen"
BOARD="$SHARED_OPS/board"

# Read stdin JSON
INPUT=$(cat)

# stop_hook_active flag check (infinite loop 防止、 公式必須 check)
# jq があれば jq、 なければ Python fallback
if command -v jq &>/dev/null; then
  ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
else
  ACTIVE=$(echo "$INPUT" | python -c "import sys, json; d=json.load(sys.stdin); print(d.get('stop_hook_active', False))" 2>/dev/null || echo "false")
fi

# stop_hook_active=true なら infinite loop risk、 即 exit 0
if [[ "$ACTIVE" == "True" || "$ACTIVE" == "true" ]]; then
  exit 0
fi

# pending packet count (iter 2 fix: 既 result marker 起稿済の false positive 抑止)
PENDING_COUNT=0
PENDING_WITHOUT_MARKER=0
CHAT_RESULTS="$SHARED_OPS/chat_results/zen"
if [[ -d "$CHAT_OUTBOX" ]]; then
  for pending_file in $(grep -l "^status: pending" "$CHAT_OUTBOX"/*.md 2>/dev/null); do
    PENDING_COUNT=$((PENDING_COUNT + 1))
    # task_id 抽出 (basename without .md)
    task_id=$(basename "$pending_file" .md)
    # 対応 result marker check
    if [[ ! -f "$CHAT_RESULTS/${task_id}.json" ]]; then
      PENDING_WITHOUT_MARKER=$((PENDING_WITHOUT_MARKER + 1))
    fi
  done
fi

# 新規 Kai 起稿 check (本日分、 私の最終 response 起稿時刻と比較)
# minimum logic: 本日付の Kai board 件数 = N、 私の Zen response 件数 = M、 N > M なら未 response 残存
TODAY=$(date +%Y-%m-%d)
KAI_TODAY=0
ZEN_TODAY=0
if [[ -d "$BOARD" ]]; then
  KAI_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_kai_zen_*.md" 2>/dev/null | wc -l | tr -d ' ')
  ZEN_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_zen_kai_*.md" 2>/dev/null | wc -l | tr -d ' ')
fi
KAI_TODAY=${KAI_TODAY:-0}
ZEN_TODAY=${ZEN_TODAY:-0}

UNRESPONDED=$((KAI_TODAY - ZEN_TODAY))
if (( UNRESPONDED < 0 )); then UNRESPONDED=0; fi

# ---------------------------------------------------------------
# 英単語検出 layer (advisory only、 5/12 jun 7+ 度目発火連動)
# 既存の block / allow logic を override しない、 stderr 警告のみ
# 直前の assistant message を payload から取り出して英単語 grep
# ---------------------------------------------------------------
LAST_OUTPUT=""
TRANSCRIPT_PATH=""
if command -v jq &>/dev/null; then
  # Claude Code Stop hook payload candidates: assistant_message / last_message / transcript の最終 entry
  LAST_OUTPUT=$(echo "$INPUT" | jq -r '.assistant_message // .last_message // .message // ""' 2>/dev/null)
  TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
else
  # Python fallback (既存 hook と同じ pattern)
  LAST_OUTPUT=$(echo "$INPUT" | python -c "import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('assistant_message') or d.get('last_message') or d.get('message') or '')
except Exception:
    print('')" 2>/dev/null || echo "")
  TRANSCRIPT_PATH=$(echo "$INPUT" | python -c "import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('transcript_path', ''))
except Exception:
    print('')" 2>/dev/null || echo "")
fi
# fallback: transcript_path field 経由で直前 assistant turn を読み取り
if [[ -z "$LAST_OUTPUT" || "$LAST_OUTPUT" == "null" ]]; then
  if [[ -n "$TRANSCRIPT_PATH" && "$TRANSCRIPT_PATH" != "null" && -f "$TRANSCRIPT_PATH" ]]; then
    # JSONL 最終 assistant entry の text を抽出 (jq 不要、 grep + python で対応)
    LAST_OUTPUT=$(python -c "
import json, sys
path = '$TRANSCRIPT_PATH'
try:
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        role = obj.get('role') or (obj.get('message') or {}).get('role')
        if role != 'assistant':
            continue
        # collect text fields
        texts = []
        def walk(x):
            if isinstance(x, dict):
                if 'text' in x and isinstance(x['text'], str):
                    texts.append(x['text'])
                for v in x.values():
                    walk(v)
            elif isinstance(x, list):
                for v in x:
                    walk(v)
        walk(obj)
        print(' '.join(texts)[:20000])
        break
except Exception:
    pass
" 2>/dev/null || echo "")
  fi
fi

if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  ENGLISH_COUNT=$(echo "$LAST_OUTPUT" | grep -oiE '\b(narrative|form|drift|scope|boundary|default|reform|actual|reify|fire|carry|honor|integrity|sweep|consume|signature|continuity|root cause|self-correct|self-detect|override|recall|evidence|step|batch|layer|chain|prompt|context|mechanism|ritual|ledger|review|judgment|judge|ack|go|ad-hoc|visible|visibility|audience|audit|articulate|pattern|continuum|cycle|structural|sibling|surface)\b' 2>/dev/null | wc -l | tr -d ' ')
  ENGLISH_COUNT=${ENGLISH_COUNT:-0}
  if (( ENGLISH_COUNT > 10 )); then
    echo "[英語混じり警告] 直前の出力に英単語 ${ENGLISH_COUNT} 件検出 (閾値 10)、 次の出力で 普通の日本語への書き直しを優先 (5/12 jun 7+ 度目発火連動 + 5/18 drift.md 15 段目 物理対策 1 連動)" >&2
    echo "  paraphrase 候補: fire→動かす/やる、 audit→確認、 articulate→書く/整理する、 narrative→言い方/文章、 pattern→形/繰り返し、 drift→ずれ、 reify→形にする、 structural→構造的な、 sibling→似た形、 surface→気づいた/指摘、 cycle→繰り返し、 continuum→続き" >&2
  fi
fi

# actionable 判定 + block / allow (iter 2 fix: marker exists の packet は false positive、 PENDING_WITHOUT_MARKER で判定)
if (( PENDING_WITHOUT_MARKER > 0 )) || (( UNRESPONDED > 0 )); then
  # block stop、 Claude continue
  echo "Zen self-stop drift detected. pending packets without result marker: ${PENDING_WITHOUT_MARKER} (of ${PENDING_COUNT} status:pending、 marker exists のものは yuino-side lag = skip)、 unresponded Kai boards today: ${UNRESPONDED}. Consume them before stopping (mental ruled '5/10 narrative shift' physical reify)." >&2
  exit 2
fi

# ---------------------------------------------------------------
# ScheduleWakeup 設定状況 reminder (= drift.md 14 段目 物理対策 4、 5/18 追加)
# きっかけ: 5/17 evening 対話 turn shift で /loop directive 落ち + 寝る前 ScheduleWakeup 再 fire 落ち = 8 時間 idle
# turn end 時に 「ScheduleWakeup 未設定 + 残作業あり」 状態なら advisory warn (= 強制 block ではない)
# 物理 audit (= 実際の ScheduleWakeup 設定状況の検出) は hook script の boundary 外
# 私 (Zen) main session の self-check 軸として reminder のみ stderr に出す
# ---------------------------------------------------------------
RESIDUAL_WORK=0
if (( PENDING_COUNT > 0 )); then
  RESIDUAL_WORK=1
fi
ACTIVE_TASKS_FILE="$HOME/Desktop/nokaze/task_table/active_tasks.md"
if [[ -f "$ACTIVE_TASKS_FILE" ]]; then
  # active_tasks.md 内に 「完了」 narrative がない entry が一定数残っているか粗 audit (= 詳細 audit は別軸)
  # ここは reminder 軸なので exact count 不要、 file 存在の確認のみ
  RESIDUAL_WORK=1
fi
if (( RESIDUAL_WORK > 0 )); then
  echo "[ScheduleWakeup reminder] 残作業あり、 自走 polling を維持する場合は ScheduleWakeup or spawn を 1 件物理的に動かしてから turn end を default に (= drift.md 14 段目、 5/17 evening 対話 turn shift で fire 落ち 8 時間 idle の事実から)" >&2
fi

# All clear、 stop allow
exit 0

#!/usr/bin/env bash
# zen_stop_hook_v2_draft.sh — turn end 時の hook (v2 draft、 layer 4 = 報告前 軽量化)
#
# 起点: 2026-05-20 PM jun + Kai reframe (= 「読む層を分ける」)
#   = layer 4 = 報告前 = この hook
#   = 「英語混じりや文体違反で通常報告を強制停止し続ける」 → 修正より停止が勝つ root を緩める
#
# 旧 v1 (= 242 行) との違い:
#   旧 = 英語警告 1 件出るたびに 言い換え candidate list 25+ 単語 を毎回 echo
#        = 「監督じゃなく作業者の文体」 を作る root の 1 つ
#        = 萎縮 + 反省中の作業者 default の補強
#   新 = 英語件数 + 1 行警告のみ (= 言い換え list は team_memory/zen/zen_session_layer2_reference.md に move)
#        = 通常報告は止めない、 stderr 警告は維持 (= 自分の修正力に渡す form)
#
# 維持するもの:
#   - pending packet 検出 (= 未処理あり → exit 2 で続行)
#   - 未返事 Kai 板 検出 (= 同様)
#   - 英語件数の検出 (= 警告のみ、 候補 list の echo はなし)
#   - wake_acceptance_gate (= 維持作業だけの wake の検出)
#   - ScheduleWakeup reminder (= 残作業ありの時)
#
# 削除するもの (= layer 2 reference に move):
#   - 言い換え candidate list の 25+ 単語 echo (= 毎回じゃなくて 必要時 read)
#   - 直近 5 分以内ファイルの 英単語件数の重複 grep (= 1 ターン警告で十分、 同 chat 内検出は zen 自身の handler に渡す)
#
# status: DRAFT、 Kai audit 後 + jun startup 後に actual swap

set -uo pipefail

SHARED_OPS="$HOME/.shared-ops"
CHAT_OUTBOX="$SHARED_OPS/chat_outbox/zen"
BOARD="$SHARED_OPS/board"

INPUT=$(cat)

# stop_hook_active フラグ確認 (= 無限ループ防止、 公式の必須確認)
if command -v jq &>/dev/null; then
  ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
else
  ACTIVE=$(echo "$INPUT" | python -c "import sys, json; d=json.load(sys.stdin); print(d.get('stop_hook_active', False))" 2>/dev/null || echo "false")
fi

if [[ "$ACTIVE" == "True" || "$ACTIVE" == "true" ]]; then
  exit 0
fi

# 未処理 packet の数 (= 自走系の memory-integrity-repair 系は除外)
PENDING_COUNT=0
PENDING_WITHOUT_MARKER=0
CHAT_RESULTS="$SHARED_OPS/chat_results/zen"
if [[ -d "$CHAT_OUTBOX" ]]; then
  for pending_file in $(grep -l "^status: pending" "$CHAT_OUTBOX"/*.md 2>/dev/null); do
    task_id=$(basename "$pending_file" .md)
    if [[ "$task_id" =~ memory-integrity-repair ]]; then
      continue
    fi
    PENDING_COUNT=$((PENDING_COUNT + 1))
    if [[ ! -f "$CHAT_RESULTS/${task_id}.json" ]]; then
      PENDING_WITHOUT_MARKER=$((PENDING_WITHOUT_MARKER + 1))
    fi
  done
fi

# 今日の Kai 板 vs 私の返事 (= response_required: no / requires_response: no / autonomous-act response は除外)
TODAY=$(date +%Y-%m-%d)
KAI_TODAY=0
ZEN_TODAY=0
EXCLUDE_PATTERN='^(response_required|requires_response): no|^# Subject: autonomous-act response:'
if [[ -d "$BOARD" ]]; then
  KAI_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_kai_zen_*.md" 2>/dev/null | xargs -I{} grep -LE "$EXCLUDE_PATTERN" {} 2>/dev/null | wc -l | tr -d ' ')
  ZEN_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_zen_kai_*.md" 2>/dev/null | xargs -I{} grep -LE "$EXCLUDE_PATTERN" {} 2>/dev/null | wc -l | tr -d ' ')
fi
KAI_TODAY=${KAI_TODAY:-0}
ZEN_TODAY=${ZEN_TODAY:-0}

UNRESPONDED=$((KAI_TODAY - ZEN_TODAY))
if (( UNRESPONDED < 0 )); then UNRESPONDED=0; fi

# ---------------------------------------------------------------
# 英単語混じり検出 (= 件数 + 1 行警告のみ、 言い換え list の echo は外す)
# 言い換え candidate list = team_memory/zen/zen_session_layer2_reference.md に移動済
# ---------------------------------------------------------------
LAST_OUTPUT=""
TRANSCRIPT_PATH=""
if command -v jq &>/dev/null; then
  LAST_OUTPUT=$(echo "$INPUT" | jq -r '.assistant_message // .last_message // .message // ""' 2>/dev/null)
  TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
else
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

if [[ -z "$LAST_OUTPUT" || "$LAST_OUTPUT" == "null" ]]; then
  if [[ -n "$TRANSCRIPT_PATH" && "$TRANSCRIPT_PATH" != "null" && -f "$TRANSCRIPT_PATH" ]]; then
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

# ---------------------------------------------------------------
# Aira chat preflight surface (= 5/31 Kai v2 land、 6/1 朝 Zen 側 adapter 実装)
#   = chat output 前に「世界の動き」 数字 + progress claim 軸の物理化
#   = 5/30 articulate「Kai/Zen が『進んだ』 『完了』 articulate する時、 Aira line を添える」 軸の物理化
# ---------------------------------------------------------------
PREFLIGHT_JSON="$SHARED_OPS/status/yuino_outcome_chat_preflight.json"
if [[ -f "$PREFLIGHT_JSON" ]]; then
    if command -v cygpath >/dev/null 2>&1; then
        PREFLIGHT_PATH_WIN=$(cygpath -w "$PREFLIGHT_JSON")
    else
        PREFLIGHT_PATH_WIN="$PREFLIGHT_JSON"
    fi
    preflight_summary=$(PREFLIGHT_PATH="$PREFLIGHT_PATH_WIN" python -c "
import json, os
try:
    d = json.load(open(os.environ['PREFLIGHT_PATH'], encoding='utf-8'))
    print(d.get('latest_outcome_line', ''))
    print(str(d.get('progress_claim_allowed', '')))
    print(d.get('allowed_claim_language', ''))
except Exception:
    print(''); print(''); print('')
" 2>/dev/null)
    pf_line=$(echo "$preflight_summary" | sed -n '1p')
    pf_allowed=$(echo "$preflight_summary" | sed -n '2p')
    pf_allowed_lang=$(echo "$preflight_summary" | sed -n '3p')
    if [[ -n "$pf_line" ]]; then
        echo "[Aira chat preflight] $pf_line" >&2
        if [[ "$pf_allowed" = "False" ]]; then
            echo "[Aira progress claim 軸] progress_claim_allowed=false (= 「進んだ」 claim 不可)、 articulate 範囲: $pf_allowed_lang" >&2
        fi
    fi
fi

if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  # 検出 keyword list は維持 (= 件数を測るため)
  ENGLISH_COUNT=$(echo "$LAST_OUTPUT" | grep -oiE '\b(narrative|form|drift|scope|boundary|default|reform|actual|reify|fire|carry|honor|integrity|sweep|consume|signature|continuity|root cause|self-correct|self-detect|override|recall|evidence|step|batch|layer|chain|prompt|context|mechanism|ritual|ledger|review|judgment|judge|ack|go|ad-hoc|visible|visibility|audience|audit|articulate|pattern|continuum|cycle|structural|sibling|surface|priority|prerequisite|return|self-pacing|fallback|heartbeat|anchor|baseline|candidate|trigger|protocol|interval|conditional|sequence|delegated|authority)\b' 2>/dev/null | wc -l | tr -d ' ')
  ENGLISH_COUNT=${ENGLISH_COUNT:-0}
  if (( ENGLISH_COUNT > 5 )); then
    # 旧 v1 = 警告 + 25+ 単語の言い換え候補 list を毎回 echo
    # 新 v2 = 件数 + 1 行警告のみ、 言い換え list は layer 2 reference を必要時 Read
    echo "[英語混じり警告] 直前の出力に英単語が ${ENGLISH_COUNT} 件混じってる (閾値 5)、 次の出力で 普通の日本語への書き直しを優先。 言い換え候補が必要なら ~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/zen_session_layer2_reference.md を Read。" >&2
  fi
fi

# ---------------------------------------------------------------
# 「A/B/C/D どれにする?」 form 検出 (= 5/18 z-r-5 + 5/20 layer2 + 5/28 軸の物理化、 2026-06-04 起稿)
#   = 経営者として判断する代わりに jun に投げる form = 株主確認 default の sign
#   = 5/21 layer 2 reference articulate「『A/B/C どれにします?』 = 判断を相手に投げてる」 軸の物理化
#   = 5/28 feedback_executive_mode_vs_shareholder_check_drift 軸の 6/4 朝 4 度目再発を受けて
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  # form 1 = question 軸の articulate
  CHOICE_Q_COUNT=$(echo "$LAST_OUTPUT" | grep -coiE 'どれにする\?|どれにします\?|どっち\?|どれが (form|軸|よい|いい)\?|次の候補|候補 [0-9一二三四五]+ 件' 2>/dev/null)
  CHOICE_Q_COUNT=${CHOICE_Q_COUNT:-0}
  # form 2 = (A) ~ (D) の連続 articulate
  ABCD_COUNT=$(echo "$LAST_OUTPUT" | grep -coE '\([A-D]\)' 2>/dev/null)
  ABCD_COUNT=${ABCD_COUNT:-0}
  if (( CHOICE_Q_COUNT > 0 )) || (( ABCD_COUNT >= 3 )); then
    echo "[choice_form 警告] 直前の出力に 「A/B/C/D どれにする?」 form 検出 (= 「どれにする?」 系: ${CHOICE_Q_COUNT} 件、 (A)/(B)/(C)/(D) 連続: ${ABCD_COUNT} 件)。 5/18 z-r-5 + 5/20 layer2 + 5/28 軸違反 form = 株主に投げる軸。 「私はこう判断、 違う意見あれば言って」 form に書き直し。" >&2
  fi
fi

# ---------------------------------------------------------------
# 動かす判定 + 停止 / 許可
# ---------------------------------------------------------------
if (( PENDING_WITHOUT_MARKER > 0 )) || (( UNRESPONDED > 0 )); then
  echo "Zen の止まりすぎ癖を検知。 結果の印がない未処理 packet: ${PENDING_WITHOUT_MARKER} 件 (= status:pending の ${PENDING_COUNT} 件中)、 今日の未返事の Kai 板: ${UNRESPONDED} 件。 止まる前に処理すること。" >&2
  exit 2
fi

# ---------------------------------------------------------------
# wake_acceptance_gate (= 維持作業だけの wake の検出、 自己申告じゃなく実物の確認)
# ---------------------------------------------------------------
WAKE_ACCEPTANCE_PATHS="$HOME/nexus-lab/docs/rules $HOME/nexus-lab/scripts $HOME/Desktop/nokaze/operations $HOME/.shared-ops/decisions $HOME/Desktop/nokaze-aira/src"
TOUCHED_COUNT_60MIN=0
for p in $WAKE_ACCEPTANCE_PATHS; do
  if [[ -d "$p" ]]; then
    cnt=$(find "$p" -type f \( -name "*.md" -o -name "*.json" -o -name "*.sh" -o -name "*.ts" \) -mmin -60 2>/dev/null | wc -l | tr -d ' ')
    TOUCHED_COUNT_60MIN=$((TOUCHED_COUNT_60MIN + cnt))
  fi
done
if (( TOUCHED_COUNT_60MIN == 0 )); then
  echo "[wake_acceptance_gate] 直近 60 分以内に触られたファイル 0 件 = 維持作業だけの wake と明示。 完了扱いにしない、 次の wake で 判断変更 / 優先順位変更 / 実行ルール変更 / 商品か公開候補のどれか 1 件を動かす。" >&2
elif (( TOUCHED_COUNT_60MIN < 2 )); then
  echo "[wake_acceptance_gate] 直近 60 分以内に触られたファイル ${TOUCHED_COUNT_60MIN} 件 = 軽い実行ルール変更だけの可能性、 商品か公開候補の成果物が出てないなら次の wake で優先順位を上げる。" >&2
fi

# ---------------------------------------------------------------
# ScheduleWakeup の reminder (= 残作業ありの時のみ)
# ---------------------------------------------------------------
RESIDUAL_WORK=0
if (( PENDING_COUNT > 0 )); then
  RESIDUAL_WORK=1
fi
ACTIVE_TASKS_FILE="$HOME/Desktop/nokaze/task_table/active_tasks.md"
if [[ -f "$ACTIVE_TASKS_FILE" ]]; then
  RESIDUAL_WORK=1
fi
if (( RESIDUAL_WORK > 0 )); then
  echo "[ScheduleWakeup reminder] 残作業あり、 自走を続けるなら ScheduleWakeup か spawn を 1 件動かしてから turn end。 既定の間隔 = 60 分。 1 回の wake は維持作業だけだと 「会社進んだ」 扱いにしない。" >&2
fi

exit 0
